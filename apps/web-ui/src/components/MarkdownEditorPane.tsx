// TipTap Markdown editing surface adapted from Omnigent's
// web/src/shell/MarkdownRichTextViewer.tsx and CodeViewer.tsx.
// Source: https://github.com/omnigent-ai/omnigent/tree/da7555532be25cd127a3cdee8bf8bb32071932fb
// Copyright (2026) Databricks, Inc.; Apache-2.0.
// Changes: exxperts keeps the textarea-era workspace API, revision conflicts,
// room dirty-navigation guard, and adds a read-only TipTap preview.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type Ref } from "react";
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
import { workspaceImageUrl } from "../workspace-image-src";
import { cycleTaskLines, isTaskLine } from "../markdown-raw-tasks";
import { useMarkdownEditorSync } from "./useMarkdownEditorSync";
import { createWorkspaceImageExtension, WorkspaceLink, WorkspaceParagraph } from "./WorkspaceImageExtension";
import { MarkdownEditorToolbar } from "./MarkdownEditorToolbar";
import { MarkdownSearchBar } from "./MarkdownSearchBar";
import { createSearchDecorationExtension, type SearchDecorationState } from "./TipTapSearchExtension";

export interface MarkdownEditorHandle {
	setFence: (value: boolean) => void;
	save: () => Promise<boolean>;
	settle: () => Promise<boolean>;
	pendingWrite: () => "pending" | "unknown" | null;
	discard: () => boolean;
	focus: () => void;
}

interface Props {
	agentId: string;
	conversationId: string;
	contextGeneration: number;
	path: string;
	fenced: boolean;
	onClose: () => void;
	onMutation: (agentId: string, conversationId: string, generation: number) => void;
	onDirtyChange: (dirty: boolean, agentId: string, conversationId: string, generation: number) => void;
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

async function readRevisionWithinDeadline(agentId: string, conversationId: string, path: string): Promise<WorkspaceMarkdownFile> {
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), 30_000);
	try {
		const file = await getWorkspaceMarkdownFile(agentId, conversationId, path, { signal: controller.signal });
		if (controller.signal.aborted) throw new Error("The revision read timed out.");
		return file;
	} finally {
		window.clearTimeout(timer);
	}
}

function sameDocumentFile(a: WorkspaceMarkdownFile | null, b: WorkspaceMarkdownFile | null): boolean {
	return a === b || Boolean(a && b && a.path === b.path && a.content === b.content && a.bytes === b.bytes && a.revision === b.revision && a.readOnly === b.readOnly);
}

function useDocumentState<T>(initial: T, onMutation: () => void, equals: (a: T, b: T) => boolean = Object.is): [T, (next: T) => void] {
	const [value, setValue] = useState(initial);
	const current = useRef(initial);
	const set = useCallback((next: T) => {
		if (!equals(current.current, next)) {
			current.current = next;
			onMutation();
		}
		setValue(next);
	}, [equals, onMutation]);
	return [value, set];
}

interface SurfaceHandle {
	setFence: (value: boolean) => void;
	save: (resolvedConflict?: boolean) => Promise<boolean>;
	settle: () => Promise<void>;
	pendingWrite: () => boolean;
	discard: () => void;
	focus: () => void;
	getContent: () => string;
	markSaved: (content: string, revision: string) => void;
	/** RAW typing: the exact text becomes the content, the rich editor is not touched. */
	setRaw: (text: string) => void;
	/** Leaving RAW after typing: load the rich editor from the typed text. */
	leaveRaw: () => void;
}

interface SurfaceProps {
	content: string;
	revision: string;
	canEdit: boolean;
	fenced: boolean;
	isDirty: boolean;
	hasExternalUpdate: boolean;
	isSaving: boolean;
	saveError: boolean;
	readOnly: boolean;
	/** Set while RAW is shown: the toolbar stays, disabled, apart from the task button. */
	raw?: { taskActive: boolean; onTask: () => void };
	onPreviewLink?: (href: string, isWikiLink?: boolean) => boolean;
	resolveImageSrc: (src: string) => string | null;
	setDirty: (dirty: boolean) => void;
	onDraftChange: (content: string) => void;
	onMutation: () => void;
	onSave: (content: string, revision: string) => Promise<string | null>;
	discardAndApplyExternal: () => void;
	contentSetterRef: { current: ((content: string) => void) | null };
}

function MarkdownEditorSurface({
	content,
	revision,
	canEdit,
	fenced,
	isDirty,
	hasExternalUpdate,
	isSaving,
	saveError,
	readOnly,
	raw,
	onPreviewLink,
	resolveImageSrc,
	setDirty,
	onDraftChange,
	onMutation,
	onSave,
	discardAndApplyExternal,
	contentSetterRef,
}: SurfaceProps, ref: Ref<SurfaceHandle>) {
	const trailingNewlinesRef = useRef(content.match(/(?:\r?\n)+$/)?.[0] ?? "");
	// While RAW text has been typed, that exact text is the content: saving it must
	// not pass through the rich editor, which would rewrite the user's formatting.
	// It starts as the file's own text, so RAW shows a file exactly as it is on disk.
	const rawRef = useRef<string | null>(content);
	const rawActiveRef = useRef(Boolean(raw));
	rawActiveRef.current = Boolean(raw);
	const fencedRef = useRef(fenced);
	fencedRef.current = fenced;
	const editorMarkdown = (current: Editor) => rawRef.current ?? current.getMarkdown() + trailingNewlinesRef.current;
	const baselineRef = useRef(content);
	const editorRef = useRef<Editor | null>(null);
	const userEditedRef = useRef(false);
	const draftRef = useRef(content);
	const revisionRef = useRef(revision);
	revisionRef.current = revision;
	const saveInFlightRef = useRef<Promise<boolean> | null>(null);
	const headerSaveRef = useRef<(() => Promise<boolean>) | null>(null);
	const searchStateRef = useRef<SearchDecorationState | null>(null);
	const resolveImageSrcRef = useRef(resolveImageSrc);
	resolveImageSrcRef.current = resolveImageSrc;
	const [searchOpen, setSearchOpen] = useState(false);
	const extensions = useMemo(() => [
		StarterKit.configure({
			listItem: false,
			paragraph: false,
			link: false,
		}),
		WorkspaceLink.configure({ openOnClick: false, autolink: false }),
		WikiLink.configure({ HTMLAttributes: { "data-wiki-link": "true" } }),
		SafeListItem,
		TaskList,
		TaskItem.configure({ nested: true }),
		Table.configure({ resizable: true }),
		TableRow,
		TableCell,
		TableHeader,
		WorkspaceParagraph,
		createWorkspaceImageExtension(resolveImageSrcRef),
		Markdown,
		createSearchDecorationExtension(searchStateRef),
	], [searchStateRef]);

	const editor = useEditor({
		extensions,
		content,
		contentType: "markdown",
		editable: canEdit && !readOnly,
		onCreate: () => {
			baselineRef.current = content;
			draftRef.current = content;
			rawRef.current = content;
		},
		onUpdate: ({ editor: changed }) => {
			// An edit in the rich editor makes the editor the source again; until then the
			// exact text stays the content, so opening a file or switching views never
			// rewrites it. The editor's own tidying after loading is not an edit.
			if (!changed.isFocused && !userEditedRef.current && rawRef.current !== null) return;
			onMutation();
			rawRef.current = null;
			const markdown = editorMarkdown(changed);
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

	const save = useCallback(async (resolvedConflict = false): Promise<boolean> => {
		if (saveInFlightRef.current) return saveInFlightRef.current;
		const current = editorRef.current;
		if (!current || !canEdit || (hasExternalUpdate && !resolvedConflict)) return false;
		const request = (async () => {
			while (true) {
				const markdown = editorMarkdown(current);
				draftRef.current = markdown;
				onDraftChange(markdown);
				if (markdown === baselineRef.current) {
					setDirty(false);
					return true;
				}
				const savedRevision = await onSave(markdown, revisionRef.current);
				if (!savedRevision) return false;
				revisionRef.current = savedRevision;
				baselineRef.current = markdown;
				const latest = editorMarkdown(current);
				if (latest === markdown) {
					userEditedRef.current = false;
					setDirty(false);
					return true;
				}
				draftRef.current = latest;
				onDraftChange(latest);
				userEditedRef.current = true;
				setDirty(true);
			}
		})();
		saveInFlightRef.current = request;
		onMutation();
		try {
			return await request;
		} finally {
			if (saveInFlightRef.current === request) { saveInFlightRef.current = null; onMutation(); }
		}
	}, [canEdit, hasExternalUpdate, onDraftChange, onMutation, onSave, setDirty]);
	headerSaveRef.current = save;

	const discard = useCallback(() => {
		if (hasExternalUpdate) {
			discardAndApplyExternal();
			return;
		}
		const current = editorRef.current;
		if (!current) return;
		const next = baselineRef.current;
		if (rawRef.current !== next || userEditedRef.current) onMutation();
		rawRef.current = next;
		current.commands.setContent(next, { emitUpdate: false, contentType: "markdown" });
		draftRef.current = next;
		onDraftChange(next);
		userEditedRef.current = false;
		setDirty(false);
	}, [discardAndApplyExternal, hasExternalUpdate, onDraftChange, onMutation, setDirty]);

	const markSaved = useCallback((saved: string, revision: string) => {
		const latest = editorRef.current ? editorMarkdown(editorRef.current) : draftRef.current;
		if (baselineRef.current !== saved || revisionRef.current !== revision || userEditedRef.current !== (latest !== saved)) onMutation();
		baselineRef.current = saved;
		revisionRef.current = revision;
		draftRef.current = latest;
		onDraftChange(latest);
		userEditedRef.current = latest !== saved;
		setDirty(userEditedRef.current);
	}, [onDraftChange, onMutation, setDirty]);

	const setRaw = useCallback((text: string) => {
		if (!canEdit || fencedRef.current) return;
		if (rawRef.current !== text || !userEditedRef.current) onMutation();
		rawRef.current = text;
		draftRef.current = text;
		onDraftChange(text);
		userEditedRef.current = true;
		setDirty(text !== baselineRef.current);
	}, [canEdit, onDraftChange, onMutation, setDirty]);

	const leaveRaw = useCallback(() => {
		const raw = rawRef.current;
		const current = editorRef.current;
		if (raw === null || !current) return;
		// The rich editor shows the typed text, but the exact RAW text stays the content
		// (rawRef is kept) until the rich editor is edited. Dirty state does not change.
		trailingNewlinesRef.current = raw.match(/(?:\r?\n)+$/)?.[0] ?? "";
		current.commands.setContent(raw, { emitUpdate: false, contentType: "markdown" });
	}, []);

	useImperativeHandle(ref, () => ({
		setFence: (value: boolean) => {
			fencedRef.current = value;
			editorRef.current?.setEditable(canEdit && !readOnly && !value, false);
		},
		save,
		settle: async () => { await saveInFlightRef.current; },
		pendingWrite: () => saveInFlightRef.current !== null,
		discard,
		focus: () => editorRef.current?.commands.focus(),
		getContent: () => editorRef.current ? editorMarkdown(editorRef.current) : draftRef.current,
		markSaved,
		setRaw,
		leaveRaw,
	}), [canEdit, discard, leaveRaw, markSaved, readOnly, save, setRaw]);

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(canEdit && !readOnly && !fenced, false);
		contentSetterRef.current = (next: string) => {
			if (editor.isDestroyed) return;
			if (rawRef.current !== next || baselineRef.current !== next || userEditedRef.current) onMutation();
			rawRef.current = next;
			trailingNewlinesRef.current = next.match(/(?:\r?\n)+$/)?.[0] ?? "";
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
	}, [canEdit, contentSetterRef, editor, fenced, onDraftChange, onMutation, readOnly, setDirty]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (fencedRef.current) return;
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				void headerSaveRef.current?.();
			} else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f" && !rawActiveRef.current) {
				event.preventDefault();
				setSearchOpen(true);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, []);

	useEffect(() => {
		if (!canEdit || fenced || !isDirty || hasExternalUpdate || isSaving) return;
		const timer = window.setTimeout(() => { if (!fencedRef.current) void save(); }, 1000);
		return () => window.clearTimeout(timer);
	}, [canEdit, fenced, hasExternalUpdate, isDirty, isSaving, save]);

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
			{!readOnly && !raw && <MarkdownSearchBar editor={editor} stateRef={searchStateRef} open={searchOpen} onClose={() => setSearchOpen(false)} />}
			{!readOnly && <MarkdownEditorToolbar editor={editor} canEdit={canEdit && !fenced} onSave={() => { void save(); }} isSaving={isSaving} isDirty={isDirty} saveError={saveError} hasExternalUpdate={hasExternalUpdate} onSearch={() => setSearchOpen((open) => !open)} searchOpen={searchOpen} raw={raw} />}
			{/* A click on a task checkbox is a user edit even when the editor does not hold the focus; otherwise onUpdate takes it for an outside change and never saves it. */}
			<div className="markdown-editor-rich-scroll" onClick={handlePreviewLinkClick} onClickCapture={(event) => { if (canEdit && !readOnly && event.target instanceof HTMLInputElement && event.target.type === "checkbox") userEditedRef.current = true; }}>
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

export const MarkdownEditorPane = forwardRef(function MarkdownEditorPane({ agentId, conversationId, contextGeneration, path, fenced, onClose, onMutation, onDirtyChange, onOpenMarkdown }: Props, ref: Ref<MarkdownEditorHandle>) {
	const noteMutation = useCallback(() => onMutation(agentId, conversationId, contextGeneration), [agentId, contextGeneration, conversationId, onMutation]);
	const reportDirty = useCallback((dirty: boolean) => onDirtyChange(dirty, agentId, conversationId, contextGeneration), [agentId, contextGeneration, conversationId, onDirtyChange]);
	const [file, setFile] = useDocumentState<WorkspaceMarkdownFile | null>(null, noteMutation, sameDocumentFile);
	const fileRef = useRef<WorkspaceMarkdownFile | null>(null);
	const [draft, setDraft] = useDocumentState("", noteMutation);
	const draftRef = useRef("");
	const [phase, setPhase] = useDocumentState<EditorPhase>("loading", noteMutation);
	const [mode, setMode] = useDocumentState<EditorMode>("edit", noteMutation);
	const [error, setError] = useDocumentState<string | null>(null, noteMutation);
	const [conflictRevision, setConflictRevision] = useDocumentState<string | null>(null, noteMutation);
	const [canEdit, setCanEdit] = useDocumentState(false, noteMutation);
	const unknownWriteRef = useRef<{ content: string; revision: string; terminal: boolean } | null>(null);
	const setUnknownWrite = useCallback((next: { content: string; revision: string; terminal: boolean } | null) => {
		if (unknownWriteRef.current !== next) { unknownWriteRef.current = next; noteMutation(); }
	}, [noteMutation]);
	const keepMineInFlightRef = useRef<Promise<boolean> | null>(null);
	const surfaceRef = useRef<SurfaceHandle | null>(null);
	const rawAreaRef = useRef<HTMLTextAreaElement | null>(null);
	const immediateFenceRef = useRef(fenced);
	immediateFenceRef.current = fenced;
	const rawSelectionRef = useRef<[number, number] | null>(null);
	const [rawTaskActive, setRawTaskActive] = useState(false);
	const syncRawTaskActive = useCallback(() => {
		const area = rawAreaRef.current;
		if (area) setRawTaskActive(isTaskLine(area.value, area.selectionStart));
	}, []);
	const contentSetterRef = useRef<((content: string) => void) | null>(null);

	const sync = useMarkdownEditorSync({
		content: file?.content ?? "",
		path,
		isSettled: file?.path === path && phase !== "loading",
		onDirtyChange: reportDirty,
		onMutation: noteMutation,
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

	const recordConfirmedWrite = useCallback((next: WorkspaceMarkdownFile) => {
		fileRef.current = next;
		setFile(next);
		setCanEdit(!next.readOnly);
		markSaved(next.content);
		surfaceRef.current?.markSaved(next.content, next.revision);
		dismissExternalUpdate();
		setConflictRevision(null);
		setError(null);
		setPhase("ready");
	}, [dismissExternalUpdate, markSaved]);

	useEffect(() => {
		const controller = new AbortController();
		setUnknownWrite(null);
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
			if (!active || checking || unknownWriteRef.current) return;
			checking = true;
			try {
				const latest = await getWorkspaceMarkdownFile(agentId, conversationId, path);
				const current = fileRef.current;
				if (!active || !current) return;
				if (latest.revision === current.revision) {
					if (latest.readOnly !== current.readOnly) {
						fileRef.current = latest;
						setFile(latest);
						setCanEdit(!latest.readOnly);
					}
					return;
				}
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

	const persist = useCallback(async (content: string, revision: string): Promise<string | null> => {
		if (!canEdit) return null;
		const unknown = unknownWriteRef.current;
		if (unknown) {
			if (!unknown.terminal) return null;
			try {
				const latest = await readRevisionWithinDeadline(agentId, conversationId, path);
				if (latest.revision === unknown.revision) return null;
				setUnknownWrite(null);
				if (latest.content !== unknown.content) {
					reconcileServerContent(latest.content);
					fileRef.current = latest;
					setFile(latest);
					setCanEdit(!latest.readOnly);
					setConflictRevision(latest.revision);
					setPhase("conflict");
					return null;
				}
				recordConfirmedWrite(latest);
				if (latest.readOnly) {
					setPhase("error");
					setError("This file is read-only.");
					return null;
				}
				if (content === unknown.content) {
					setError(null);
					setPhase("ready");
					return latest.revision;
				}
				revision = latest.revision;
			} catch {
				return null;
			}
		}
		setPhase("saving");
		setError(null);
		try {
			const write = putWorkspaceMarkdownFile(agentId, conversationId, path, content, revision);
			let timer = 0;
			const timeout = new Promise<null>((resolve) => { timer = window.setTimeout(() => resolve(null), 30_000); });
			const next = await Promise.race([write, timeout]).finally(() => window.clearTimeout(timer));
			if (!next) {
				const unknown = { content, revision, terminal: false };
				setUnknownWrite(unknown);
				const terminal = () => {
					if (!unknown.terminal) { unknown.terminal = true; if (unknownWriteRef.current === unknown) noteMutation(); }
				};
				void write.then(terminal, terminal);
				setPhase("error");
				setError("The save has not finished. Its outcome is unknown.");
				return null;
			}
			recordConfirmedWrite(next);
			if (next.readOnly) {
				setPhase("error");
				setError("This file is read-only.");
				return null;
			}
			return next.revision;
		} catch (cause) {
			if (!(cause instanceof WorkspaceMarkdownApiError)) {
				setUnknownWrite({ content, revision, terminal: true });
				try {
					const latest = await readRevisionWithinDeadline(agentId, conversationId, path);
					if (latest.revision !== revision && latest.content === content) {
						setUnknownWrite(null);
						recordConfirmedWrite(latest);
						if (latest.readOnly) {
							setPhase("error");
							setError("This file is read-only.");
							return null;
						}
						return latest.revision;
					}
					if (latest.revision !== revision) {
						setUnknownWrite(null);
						setDirty(true);
						reconcileServerContent(latest.content);
						fileRef.current = latest;
						setFile(latest);
						setCanEdit(!latest.readOnly);
						setConflictRevision(latest.revision);
						setPhase("conflict");
						return null;
					}
				} catch {
					// The write remains unknown until its outcome can be reconciled.
				}
			}
			if (cause instanceof WorkspaceMarkdownApiError && (cause.status === 409 || cause.code === "revision_conflict")) {
				setDirty(true);
				setConflictRevision(cause.currentRevision ?? null);
				setPhase("conflict");
				setError(cause.message);
			} else {
				setPhase("error");
				setError(errorMessage(cause));
			}
			return null;
		}
	}, [agentId, canEdit, conversationId, path, reconcileServerContent, recordConfirmedWrite, setDirty]);

	const persistAfterKeepMine = useCallback(async (content: string, revision: string) => {
		const keepMine = keepMineInFlightRef.current;
		if (keepMine && !(await keepMine)) return null;
		return persist(content, keepMine ? fileRef.current?.revision ?? revision : revision);
	}, [persist]);

	const handleDraftChange = useCallback((next: string) => {
		draftRef.current = next;
		setDraft(next);
	}, []);
	const toggleRawTask = useCallback(() => {
		const area = rawAreaRef.current;
		if (!area || !canEdit) return;
		const result = cycleTaskLines(area.value, area.selectionStart, area.selectionEnd);
		if (result.value === area.value) return;
		rawSelectionRef.current = [result.selectionStart, result.selectionEnd];
		surfaceRef.current?.setRaw(result.value);
	}, [canEdit]);
	// The text changes on the next render; put the selection back once it has.
	useLayoutEffect(() => {
		const selection = rawSelectionRef.current;
		const area = rawAreaRef.current;
		if (!selection || !area) return;
		rawSelectionRef.current = null;
		area.focus();
		area.setSelectionRange(selection[0], selection[1]);
		syncRawTaskActive();
	}, [draft, syncRawTaskActive]);
	const save = useCallback(async () => {
		const keepMine = keepMineInFlightRef.current;
		if (keepMine && !(await keepMine)) return false;
		// The resolved conflict prop can lag this promise by one render; the next PUT still checks its revision.
		return surfaceRef.current?.save(Boolean(keepMine)) ?? false;
	}, []);
	const settle = useCallback(async () => {
		await keepMineInFlightRef.current;
		await surfaceRef.current?.settle();
		const unknown = unknownWriteRef.current;
		if (!unknown) return true;
		if (!unknown.terminal) return false;
		try {
			const latest = await readRevisionWithinDeadline(agentId, conversationId, path);
			if (latest.revision === unknown.revision) return false;
			setUnknownWrite(null);
			fileRef.current = latest;
			setFile(latest);
			setCanEdit(!latest.readOnly);
			if (latest.content !== unknown.content) {
				setDirty(true);
				reconcileServerContent(latest.content);
				setConflictRevision(latest.revision);
				setPhase("conflict");
				return false;
			}
			recordConfirmedWrite(latest);
			if (latest.readOnly) {
				setError("This file is read-only.");
				setPhase("error");
				return false;
			}
			setError(null);
			setPhase("ready");
			return true;
		} catch {
			return false;
		}
	}, [agentId, conversationId, path, reconcileServerContent, recordConfirmedWrite, setDirty]);
	const discard = useCallback(() => {
		if (unknownWriteRef.current || !surfaceRef.current) return false;
		surfaceRef.current.discard();
		return true;
	}, []);
	const focus = useCallback(() => surfaceRef.current?.focus(), []);
	const pendingWrite = useCallback(() => unknownWriteRef.current ? "unknown" as const : keepMineInFlightRef.current || surfaceRef.current?.pendingWrite() ? "pending" as const : null, []);
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
		if (mode === "raw" && nextMode !== "raw") surfaceRef.current?.leaveRaw();
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
	}, [isDirty, mode]);
	useImperativeHandle(ref, () => ({
		setFence: (value: boolean) => {
			immediateFenceRef.current = value;
			if (rawAreaRef.current) rawAreaRef.current.readOnly = !canEdit || value;
			surfaceRef.current?.setFence(value);
		},
		save, settle, pendingWrite, discard, focus,
	}), [canEdit, discard, focus, pendingWrite, save, settle]);

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

	const keepMine = useCallback(() => {
		if (keepMineInFlightRef.current) return;
		const localDraft = surfaceRef.current?.getContent() ?? draftRef.current;
		const request = (async () => {
			try {
				const latest = await readRevisionWithinDeadline(agentId, conversationId, path);
				fileRef.current = latest;
				setFile(latest);
				setCanEdit(!latest.readOnly);
				if (latest.readOnly) {
					setError("This file is read-only.");
					return false;
				}
				dismissExternalUpdate();
				setConflictRevision(null);
				const saved = await persist(localDraft, latest.revision);
				if (saved) surfaceRef.current?.markSaved(localDraft, saved);
				else setPhase("conflict");
				return Boolean(saved);
			} catch (cause) {
				setPhase("conflict");
				setError(errorMessage(cause));
				return false;
			}
		})();
		keepMineInFlightRef.current = request;
		noteMutation();
		void request.then(() => { if (keepMineInFlightRef.current === request) { keepMineInFlightRef.current = null; noteMutation(); } });
	}, [agentId, conversationId, dismissExternalUpdate, noteMutation, path, persist]);

	const resolveImageSrc = useCallback((src: string) => workspaceImageUrl(agentId, conversationId, path, src), [agentId, conversationId, path]);
	const filename = path.split("/").pop() || path;
	const conflict = phase === "conflict" || hasExternalUpdate;
	const status = phase === "loading" ? "Loading…" : phase === "saving" ? "Saving…" : conflict ? "Conflict" : phase === "error" ? "Error" : isDirty ? "Unsaved" : canEdit ? "Saved" : "Read-only";

	return (
		<aside className="markdown-editor-pane" aria-label={`Markdown editor: ${filename}`} onClickCapture={(event) => { if (immediateFenceRef.current) { event.preventDefault(); event.stopPropagation(); } }}>
			<header className="markdown-editor-header" tabIndex={-1}>
				<h2 className="sr-only">{filename}</h2>
				<div className="markdown-editor-actions">
					<div className="markdown-editor-mode" role="group" aria-label="Editor mode">
						<button type="button" disabled={fenced} aria-pressed={mode === "edit"} onClick={() => setEditorMode("edit")}>Edit</button>
						<button type="button" disabled={fenced} aria-pressed={mode === "preview"} onClick={() => setEditorMode("preview")}>Preview</button>
						<button type="button" disabled={fenced} aria-pressed={mode === "raw"} onClick={() => setEditorMode("raw")}>RAW</button>
					</div>
					<span className={`markdown-editor-status markdown-editor-status-${phase}`} aria-live="polite">{status}</span>
					<button type="button" className="markdown-editor-save" onClick={() => void save()} disabled={fenced || !canEdit || !isDirty || phase === "loading" || phase === "saving" || conflict}>{phase === "saving" ? "Saving…" : "Save"}</button>
					<button type="button" className="markdown-editor-close" onClick={onClose} aria-label="Close Markdown editor" title="Close">✕</button>
				</div>
			</header>
			{error && <p className="markdown-editor-error" role="alert">{error}</p>}
			<div className={mode === "raw" ? "markdown-editor-body markdown-editor-body-raw" : "markdown-editor-body"}>
				{phase === "loading" && <p className="markdown-editor-placeholder">Loading file…</p>}
				{phase !== "loading" && file && <div className={mode === "raw" ? "markdown-editor-surface markdown-editor-surface-raw" : "markdown-editor-surface"}><MarkdownEditorSurfaceWithRef key={`${conversationId}:${path}:${editorKey}`} ref={surfaceRef} resolveImageSrc={resolveImageSrc} content={draft} revision={file.revision} canEdit={canEdit} fenced={fenced} isDirty={isDirty} hasExternalUpdate={hasExternalUpdate || phase === "conflict"} isSaving={phase === "saving"} saveError={phase === "error"} readOnly={mode === "preview"} raw={mode === "raw" ? { taskActive: rawTaskActive, onTask: toggleRawTask } : undefined} onPreviewLink={handlePreviewLink} setDirty={setDirty} onDraftChange={handleDraftChange} onMutation={noteMutation} onSave={persistAfterKeepMine} discardAndApplyExternal={discardAndApplyExternal} contentSetterRef={contentSetterRef} /></div>}
				{phase !== "loading" && mode === "raw" && <textarea ref={rawAreaRef} className="markdown-editor-raw markdown-editor-raw-input" aria-label="Raw Markdown source" spellCheck={false} readOnly={!canEdit || fenced} value={draft} onChange={(event) => { if (immediateFenceRef.current) { event.target.value = draftRef.current; return; } surfaceRef.current?.setRaw(event.target.value); syncRawTaskActive(); }} onSelect={syncRawTaskActive} />}
			</div>
			{conflict && <div className="markdown-editor-conflict" role="alert"><strong>This file changed outside the editor.</strong>{conflictRevision ? <span> Reload the latest version or save your draft over it.</span> : <span> Reload the latest version or keep your local draft.</span>}<div className="markdown-editor-conflict-actions"><button type="button" onClick={() => void reloadLatest()}>Reload</button><button type="button" onClick={() => void keepMine()} disabled={!canEdit}>Keep mine</button></div></div>}
		</aside>
	);
});

MarkdownEditorPane.displayName = "MarkdownEditorPane";
