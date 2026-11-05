// TipTap Markdown editing surface adapted from Omnigent's
// web/src/shell/MarkdownRichTextViewer.tsx and CodeViewer.tsx.
// Source: https://github.com/omnigent-ai/omnigent/tree/da7555532be25cd127a3cdee8bf8bb32071932fb
// Copyright (2026) Databricks, Inc.; Apache-2.0.
// Changes: exxperts keeps the textarea-era workspace API, revision conflicts,
// room dirty-navigation guard, and adds a read-only TipTap preview.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type MouseEvent, type Ref } from "react";
import { mergeAttributes, Node, type Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { ListItem, TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import "@tiptap/markdown";
import "@tiptap/extension-list";
import "@tiptap/extension-table";
import {
	getWorkspaceMarkdownFile,
	putWorkspaceMarkdownFile,
	WorkspaceMarkdownApiError,
	type WorkspaceMarkdownFile,
} from "../workspace-markdown-api";
import { useMarkdownEditorSync } from "./useMarkdownEditorSync";
import { MarkdownEditorToolbar } from "./MarkdownEditorToolbar";
import { MarkdownSearchBar } from "./MarkdownSearchBar";
import { createSearchDecorationExtension, type SearchDecorationState } from "./TipTapSearchExtension";

export interface MarkdownEditorHandle {
	save: () => Promise<boolean>;
	discard: () => void;
	focus: () => void;
}

interface Props {
	agentId: string;
	conversationId: string;
	path: string;
	onClose: () => void;
	onDirtyChange: (dirty: boolean) => void;
	onOpenMarkdown?: (path: string) => void;
}

type EditorPhase = "loading" | "ready" | "saving" | "conflict" | "error";
type EditorMode = "edit" | "preview" | "raw";

// Markdown permits a list item's first block to be a heading, quote, table, or
// nested list. Relaxing the stock paragraph-first schema keeps those files
// editable instead of failing on the first transaction.
const SafeListItem = ListItem.extend({ content: "block+" });

const WikiLink = Node.create({
	name: "wikiLink",
	inline: true,
	group: "inline",
	content: "text*",
	selectable: false,
	addOptions() {
		return { HTMLAttributes: {} };
	},
	addAttributes() {
		return { href: { default: "" } };
	},
	parseHTML() {
		return [{ tag: 'a[data-wiki-link="true"]' }];
	},
	renderHTML({ node, HTMLAttributes }) {
		const href = String(node.attrs?.href ?? "");
		const safeHref = /^[a-z][a-z\\d+.-]*:/i.test(href) || href.startsWith("//") ? "" : href;
		return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { href: safeHref, "data-wiki-link": "true" }), 0];
	},
	markdownTokenName: "wikiLink",
	markdownTokenizer: {
		name: "wikiLink",
		level: "inline",
		start: "[[",
		tokenize(src, _tokens, lexer) {
			const match = /^\[\[([^\]\n]+)\]\]/.exec(src);
			if (!match) return;
			const inner = match[1].trim();
			const separator = inner.indexOf("|");
			const href = (separator < 0 ? inner : inner.slice(0, separator)).trim();
			const label = (separator < 0 ? inner : inner.slice(separator + 1)).trim() || href;
			if (!href || !label) return;
			return { type: "wikiLink", raw: match[0], href, tokens: lexer.inlineTokens(label) };
		},
	},
	parseMarkdown: (token, helpers) => helpers.createNode("wikiLink", { href: token.href }, helpers.parseInline(token.tokens || [])),
	renderMarkdown: (node, helpers) => {
		const href = String(node.attrs?.href ?? "");
		const label = helpers.renderChildren(node);
		return label === href ? `[[${href}]]` : `[[${href}|${label}]]`;
	},
});

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

interface SurfaceHandle {
	save: () => Promise<boolean>;
	discard: () => void;
	focus: () => void;
	getContent: () => string;
	markSaved: (content: string) => void;
}

interface SurfaceProps {
	content: string;
	revision: string;
	canEdit: boolean;
	isDirty: boolean;
	hasExternalUpdate: boolean;
	isSaving: boolean;
	saveError: boolean;
	readOnly: boolean;
	onPreviewLink?: (href: string, isWikiLink?: boolean) => boolean;
	setDirty: (dirty: boolean) => void;
	onDraftChange: (content: string) => void;
	onSave: (content: string, revision: string) => Promise<boolean>;
	discardAndApplyExternal: () => void;
	contentSetterRef: { current: ((content: string) => void) | null };
}

function MarkdownEditorSurface({
	content,
	revision,
	canEdit,
	isDirty,
	hasExternalUpdate,
	isSaving,
	saveError,
	readOnly,
	onPreviewLink,
	setDirty,
	onDraftChange,
	onSave,
	discardAndApplyExternal,
	contentSetterRef,
}: SurfaceProps, ref: Ref<SurfaceHandle>) {
	const baselineRef = useRef(content);
	const editorRef = useRef<Editor | null>(null);
	const userEditedRef = useRef(false);
	const draftRef = useRef(content);
	const revisionRef = useRef(revision);
	revisionRef.current = revision;
	const saveInFlightRef = useRef<Promise<boolean> | null>(null);
	const saveQueuedRef = useRef(false);
	const saveRef = useRef<(() => Promise<boolean>) | null>(null);
	const headerSaveRef = useRef<(() => Promise<boolean>) | null>(null);
	const searchStateRef = useRef<SearchDecorationState | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const extensions = useMemo(() => [
		StarterKit.configure({
			listItem: false,
			link: { openOnClick: false, autolink: false },
		}),
		WikiLink.configure({ HTMLAttributes: { "data-wiki-link": "true" } }),
		SafeListItem,
		TaskList,
		TaskItem.configure({ nested: true }),
		Table.configure({ resizable: true }),
		TableRow,
		TableCell,
		TableHeader,
		Markdown,
		createSearchDecorationExtension(searchStateRef),
	], [searchStateRef]);

	const editor = useEditor({
		extensions,
		content,
		contentType: "markdown",
		editable: canEdit && !readOnly,
		onCreate: ({ editor: created }) => {
			baselineRef.current = created.getMarkdown();
			draftRef.current = created.getMarkdown();
		},
		onUpdate: ({ editor: changed }) => {
			const markdown = changed.getMarkdown();
			draftRef.current = markdown;
			onDraftChange(markdown);
			if (!changed.isFocused && !userEditedRef.current) {
				baselineRef.current = markdown;
				setDirty(false);
				return;
			}
			userEditedRef.current = true;
			setDirty(markdown !== baselineRef.current);
		},
	});
	editorRef.current = editor;

	const save = useCallback(async (): Promise<boolean> => {
		if (saveInFlightRef.current) {
			saveQueuedRef.current = true;
			return saveInFlightRef.current;
		}
		const current = editorRef.current;
		if (!current || !canEdit || hasExternalUpdate) return false;
		const markdown = current.getMarkdown();
		draftRef.current = markdown;
		onDraftChange(markdown);
		if (markdown === baselineRef.current) {
			setDirty(false);
			return true;
		}
		const request = onSave(markdown, revisionRef.current);
		saveInFlightRef.current = request;
		try {
			const saved = await request;
			if (saved) {
				const latest = editorRef.current?.getMarkdown() ?? markdown;
				baselineRef.current = markdown;
				if (latest !== markdown) {
					draftRef.current = latest;
					onDraftChange(latest);
					userEditedRef.current = true;
					setDirty(true);
				} else {
					userEditedRef.current = false;
					setDirty(false);
				}
			}
			return saved;
		} finally {
			if (saveInFlightRef.current === request) {
				saveInFlightRef.current = null;
				if (saveQueuedRef.current) {
					saveQueuedRef.current = false;
					window.setTimeout(() => { void saveRef.current?.(); }, 0);
				}
			}
		}
	}, [canEdit, hasExternalUpdate, onDraftChange, onSave, setDirty]);
	saveRef.current = save;
	headerSaveRef.current = save;

	const discard = useCallback(() => {
		if (hasExternalUpdate) {
			discardAndApplyExternal();
			return;
		}
		const current = editorRef.current;
		if (!current) return;
		const next = baselineRef.current;
		current.commands.setContent(next, { emitUpdate: false, contentType: "markdown" });
		draftRef.current = next;
		onDraftChange(next);
		userEditedRef.current = false;
		setDirty(false);
	}, [discardAndApplyExternal, hasExternalUpdate, onDraftChange, setDirty]);

	const markSaved = useCallback((saved: string) => {
		baselineRef.current = saved;
		draftRef.current = saved;
		userEditedRef.current = false;
		setDirty(false);
	}, [setDirty]);

	useImperativeHandle(ref, () => ({
		save,
		discard,
		focus: () => editorRef.current?.commands.focus(),
		getContent: () => editorRef.current?.getMarkdown() ?? draftRef.current,
		markSaved,
	}), [discard, markSaved, save]);

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(canEdit && !readOnly);
		contentSetterRef.current = (next: string) => {
			if (editor.isDestroyed) return;
			editor.commands.setContent(next, { emitUpdate: false, contentType: "markdown" });
			baselineRef.current = next;
			draftRef.current = next;
			userEditedRef.current = false;
			onDraftChange(next);
			setDirty(false);
		};
		return () => {
			if (contentSetterRef.current) contentSetterRef.current = null;
		};
	}, [canEdit, contentSetterRef, editor, onDraftChange, readOnly, setDirty]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				void headerSaveRef.current?.();
			} else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
				event.preventDefault();
				setSearchOpen(true);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	useEffect(() => {
		if (!canEdit || !isDirty || hasExternalUpdate || isSaving) return;
		const timer = window.setTimeout(() => { void save(); }, 1000);
		return () => window.clearTimeout(timer);
	}, [canEdit, hasExternalUpdate, isDirty, isSaving, save]);

	const handlePreviewLinkClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
		if (!readOnly || !onPreviewLink) return;
		const target = event.target instanceof Element ? event.target.closest("a") : null;
		if (!(target instanceof HTMLAnchorElement)) return;
		const href = target.getAttribute("href");
		if (!href) return;
		const isWikiLink = target.dataset.wikiLink === "true";
		if (onPreviewLink(href, isWikiLink)) event.preventDefault();
	}, [onPreviewLink, readOnly]);

	return (
		<div className="markdown-editor-rich-surface">
			{!readOnly && <MarkdownSearchBar editor={editor} stateRef={searchStateRef} open={searchOpen} onClose={() => setSearchOpen(false)} />}
			{!readOnly && <MarkdownEditorToolbar editor={editor} canEdit={canEdit} onSave={() => { void save(); }} isSaving={isSaving} isDirty={isDirty} saveError={saveError} hasExternalUpdate={hasExternalUpdate} onSearch={() => setSearchOpen((open) => !open)} searchOpen={searchOpen} />}
			<div className="markdown-editor-rich-scroll" onClick={handlePreviewLinkClick}>
				<EditorContent editor={editor} className="markdown-editor-tiptap" />
			</div>
		</div>
	);
}

const MarkdownEditorSurfaceWithRef = forwardRef(MarkdownEditorSurface);

function resolveWorkspaceMarkdownPath(currentPath: string, href: string, allowExtensionless = false): string | null {
	const trimmed = href.trim();
	if (!trimmed || trimmed.startsWith("#") || trimmed.includes("\\") || /^[a-z][a-z\d+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;
	const pathPart = trimmed.split(/[?#]/, 1)[0];
	const segments = pathPart.startsWith("/") ? [] : currentPath.split("/").slice(0, -1);
	for (const rawSegment of pathPart.split("/")) {
		if (!rawSegment || rawSegment === ".") continue;
		let segment: string;
		try {
			segment = decodeURIComponent(rawSegment);
		} catch {
			return null;
		}
		if (segment === "..") {
			if (segments.length === 0) return null;
			segments.pop();
			continue;
		}
		if (!segment || segment.includes("/") || segment.includes("\\") || segment.includes("\0") || segment.startsWith(".")) return null;
		segments.push(segment);
	}
	const resolved = segments.join("/");
	if (!resolved) return null;
	if (/\.md$/i.test(resolved)) return resolved;
	return allowExtensionless ? `${resolved}.md` : null;
}

export const MarkdownEditorPane = forwardRef(function MarkdownEditorPane({ agentId, conversationId, path, onClose, onDirtyChange, onOpenMarkdown }: Props, ref: Ref<MarkdownEditorHandle>) {
	const [file, setFile] = useState<WorkspaceMarkdownFile | null>(null);
	const fileRef = useRef<WorkspaceMarkdownFile | null>(null);
	const [draft, setDraft] = useState("");
	const draftRef = useRef("");
	const [phase, setPhase] = useState<EditorPhase>("loading");
	const [mode, setMode] = useState<EditorMode>("edit");
	const [error, setError] = useState<string | null>(null);
	const [conflictRevision, setConflictRevision] = useState<string | null>(null);
	const [canEdit, setCanEdit] = useState(false);
	const surfaceRef = useRef<SurfaceHandle | null>(null);
	const contentSetterRef = useRef<((content: string) => void) | null>(null);

	const sync = useMarkdownEditorSync({
		content: file?.content ?? "",
		path,
		isSettled: file?.path === path && phase !== "loading",
		onDirtyChange,
		setContentRef: contentSetterRef,
	});
	const { editorKey, isDirty, hasExternalUpdate, setDirty, dismissExternalUpdate, discardAndApplyExternal, markSaved, reconcileServerContent } = sync;

	const setLoadedFile = useCallback((next: WorkspaceMarkdownFile) => {
		fileRef.current = next;
		setFile(next);
		draftRef.current = next.content;
		setDraft(next.content);
		setDirty(false);
		dismissExternalUpdate();
		setConflictRevision(null);
		setError(null);
		setPhase("ready");
	}, [dismissExternalUpdate, setDirty]);

	useEffect(() => {
		const controller = new AbortController();
		fileRef.current = null;
		setFile(null);
		draftRef.current = "";
		setDraft("");
		setCanEdit(false);
		setPhase("loading");
		setMode("edit");
		setError(null);
		setConflictRevision(null);
		void getWorkspaceMarkdownFile(agentId, conversationId, path, { signal: controller.signal }).then((next) => {
			if (controller.signal.aborted) return;
			setCanEdit(!next.readOnly);
			setLoadedFile(next);
		}).catch((cause) => {
			if (controller.signal.aborted) return;
			setPhase("error");
			setError(errorMessage(cause));
		});
		return () => controller.abort();
	}, [agentId, conversationId, path, setLoadedFile]);

	useEffect(() => {
		if (!file || phase === "loading" || phase === "saving" || phase === "conflict") return;
		let active = true;
		let checking = false;
		const checkForExternalChange = async () => {
			if (!active || checking) return;
			checking = true;
			try {
				const latest = await getWorkspaceMarkdownFile(agentId, conversationId, path);
				const current = fileRef.current;
				if (!active || !current || latest.revision === current.revision) return;
				const conflictDetected = reconcileServerContent(latest.content);
				fileRef.current = latest;
				setFile(latest);
				setCanEdit(!latest.readOnly);
				if (conflictDetected) {
					setConflictRevision(latest.revision);
					setPhase("conflict");
				} else {
					setPhase("ready");
				}
			} catch {
				// A transient OneDrive/readability error must not discard a draft.
			} finally {
				checking = false;
			}
		};
		const timer = window.setInterval(() => { void checkForExternalChange(); }, 5000);
		return () => { active = false; window.clearInterval(timer); };
	}, [agentId, conversationId, file, path, phase, reconcileServerContent]);

	const persist = useCallback(async (content: string, revision: string): Promise<boolean> => {
		if (!canEdit) return false;
		setPhase("saving");
		setError(null);
		try {
			const next = await putWorkspaceMarkdownFile(agentId, conversationId, path, content, revision);
			setLoadedFile(next);
			markSaved(next.content);
			return true;
		} catch (cause) {
			if (cause instanceof WorkspaceMarkdownApiError && (cause.status === 409 || cause.code === "revision_conflict")) {
				setConflictRevision(cause.currentRevision ?? null);
				setPhase("conflict");
				setError(cause.message);
			} else {
				setPhase("error");
				setError(errorMessage(cause));
			}
			return false;
		}
	}, [agentId, canEdit, conversationId, markSaved, path, setLoadedFile]);

	const handleDraftChange = useCallback((next: string) => {
		draftRef.current = next;
		setDraft(next);
	}, []);
	const save = useCallback(() => surfaceRef.current?.save() ?? Promise.resolve(false), []);
	const discard = useCallback(() => surfaceRef.current?.discard(), []);
	const focus = useCallback(() => surfaceRef.current?.focus(), []);
	const handlePreviewLink = useCallback((href: string, isWikiLink = false): boolean => {
		const workspacePath = resolveWorkspaceMarkdownPath(path, href, isWikiLink);
		if (workspacePath && onOpenMarkdown) {
			onOpenMarkdown(workspacePath);
			return true;
		}
		if (/^(?:https?:|mailto:|tel:)/i.test(href)) {
			window.open(href, "_blank", "noopener,noreferrer");
			return true;
		}
		return false;
	}, [onOpenMarkdown, path]);
	const setEditorMode = useCallback((nextMode: EditorMode) => {
		// TipTap is the source of truth after a formatting command. Mirror it
		// before switching views so Preview/RAW never show a stale React draft.
		if (isDirty) {
			const current = surfaceRef.current?.getContent();
			if (current !== undefined && current !== draftRef.current) {
				draftRef.current = current;
				setDraft(current);
			}
		}
		setMode(nextMode);
	}, [isDirty]);
	useImperativeHandle(ref, () => ({ save, discard, focus }), [discard, focus, save]);

	const reloadLatest = useCallback(async () => {
		setPhase("loading");
		setError(null);
		try {
			const latest = await getWorkspaceMarkdownFile(agentId, conversationId, path);
			setLoadedFile(latest);
			discardAndApplyExternal();
			surfaceRef.current?.focus();
		} catch (cause) {
			setPhase("conflict");
			setError(errorMessage(cause));
		}
	}, [agentId, conversationId, discardAndApplyExternal, path, setLoadedFile]);

	const keepMine = useCallback(async () => {
		const localDraft = surfaceRef.current?.getContent() ?? draftRef.current;
		try {
			const latest = await getWorkspaceMarkdownFile(agentId, conversationId, path);
			fileRef.current = latest;
			setFile(latest);
			dismissExternalUpdate();
			setConflictRevision(null);
			const saved = await persist(localDraft, latest.revision);
			if (saved) surfaceRef.current?.markSaved(localDraft);
			else setPhase("conflict");
		} catch (cause) {
			setPhase("conflict");
			setError(errorMessage(cause));
		}
	}, [agentId, conversationId, dismissExternalUpdate, path, persist]);

	const filename = path.split("/").pop() || path;
	const conflict = phase === "conflict" || hasExternalUpdate;
	const status = phase === "loading" ? "Loading…" : phase === "saving" ? "Saving…" : conflict ? "Conflict" : phase === "error" ? "Error" : isDirty ? "Unsaved" : canEdit ? "Saved" : "Read-only";

	return (
		<aside className="markdown-editor-pane" aria-label={`Markdown editor: ${filename}`}>
			<header className="markdown-editor-header" tabIndex={-1}>
				<div className="markdown-editor-title"><h2>{filename}</h2><span title={path}>{path}</span></div>
				<div className="markdown-editor-actions">
					<div className="markdown-editor-mode" role="group" aria-label="Editor mode">
						<button type="button" aria-pressed={mode === "edit"} onClick={() => setEditorMode("edit")}>Edit</button>
						<button type="button" aria-pressed={mode === "preview"} onClick={() => setEditorMode("preview")}>Preview</button>
						<button type="button" aria-pressed={mode === "raw"} onClick={() => setEditorMode("raw")}>RAW</button>
					</div>
					<span className={`markdown-editor-status markdown-editor-status-${phase}`} aria-live="polite">{status}</span>
					<button type="button" className="markdown-editor-save" onClick={() => void save()} disabled={!canEdit || !isDirty || phase === "loading" || phase === "saving" || conflict}>{phase === "saving" ? "Saving…" : "Save"}</button>
					<button type="button" className="markdown-editor-close" onClick={onClose} aria-label="Close Markdown editor" title="Close">✕</button>
				</div>
			</header>
			{error && <p className="markdown-editor-error" role="alert">{error}</p>}
			<div className="markdown-editor-body">
				{phase === "loading" && <p className="markdown-editor-placeholder">Loading file…</p>}
				{phase !== "loading" && file && <div className={mode === "raw" ? "markdown-editor-surface markdown-editor-surface-hidden" : "markdown-editor-surface"}><MarkdownEditorSurfaceWithRef key={`${conversationId}:${path}:${editorKey}`} ref={surfaceRef} content={draft} revision={file.revision} canEdit={canEdit} isDirty={isDirty} hasExternalUpdate={hasExternalUpdate || phase === "conflict"} isSaving={phase === "saving"} saveError={phase === "error"} readOnly={mode === "preview"} onPreviewLink={handlePreviewLink} setDirty={setDirty} onDraftChange={handleDraftChange} onSave={persist} discardAndApplyExternal={discardAndApplyExternal} contentSetterRef={contentSetterRef} /></div>}
				{phase !== "loading" && mode === "raw" && <pre className="markdown-editor-raw" aria-label="Raw Markdown source">{draft}</pre>}
			</div>
			{conflict && <div className="markdown-editor-conflict" role="alert"><strong>This file changed outside the editor.</strong>{conflictRevision ? <span> Reload the latest version or save your draft over it.</span> : <span> Reload the latest version or keep your local draft.</span>}<div className="markdown-editor-conflict-actions"><button type="button" onClick={() => void reloadLatest()}>Reload</button><button type="button" onClick={() => void keepMine()} disabled={!canEdit}>Keep mine</button></div></div>}
		</aside>
	);
});

MarkdownEditorPane.displayName = "MarkdownEditorPane";
