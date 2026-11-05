import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import { workspaceFileUrl } from "../workspace-image-src";
import { workspaceFileKind, workspaceFileName } from "../workspace-tabs";

interface Props {
	agentId: string;
	conversationId: string;
	path: string;
}

interface Sheet {
	name: string;
	rows: string[][];
	truncated: boolean;
}

const PDF_MAX_PAGES = 200;

function PreviewError({ text }: { text: string }) {
	return <p className="workspace-preview-error" role="alert">{text}</p>;
}

async function fetchPreview(url: string): Promise<Response> {
	const response = await apiFetch(url);
	if (response.ok) return response;
	const body = await response.json().catch(() => null);
	throw new Error(typeof body?.error === "string" ? body.error : "This file could not be shown.");
}

function PdfPreview({ url }: { url: string }) {
	const pagesRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [cutAt, setCutAt] = useState<number | null>(null);
	useEffect(() => {
		let gone = false;
		let destroy: (() => void) | null = null;
		void (async () => {
			try {
				const data = await (await fetchPreview(url)).arrayBuffer();
				const pdfjs = await import("pdfjs-dist");
				pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker&url")).default;
				const task = pdfjs.getDocument({ data, isEvalSupported: false });
				destroy = () => void task.destroy();
				const doc = await task.promise;
				if (doc.numPages > PDF_MAX_PAGES) setCutAt(PDF_MAX_PAGES);
				for (let number = 1; number <= Math.min(doc.numPages, PDF_MAX_PAGES); number++) {
					const holder = pagesRef.current;
					if (gone || !holder) return;
					const page = await doc.getPage(number);
					const scale = (Math.max(holder.clientWidth, 320) * window.devicePixelRatio) / page.getViewport({ scale: 1 }).width;
					const viewport = page.getViewport({ scale });
					const canvas = document.createElement("canvas");
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					canvas.setAttribute("aria-label", `Page ${number}`);
					await page.render({ canvas, viewport }).promise;
					page.cleanup();
					if (gone) return;
					holder.appendChild(canvas);
				}
			} catch (cause) {
				if (!gone) setError(cause instanceof Error ? cause.message : "This PDF could not be shown.");
			}
		})();
		return () => {
			gone = true;
			destroy?.();
		};
	}, [url]);
	if (error) return <PreviewError text={error} />;
	return (
		<div className="workspace-preview-body workspace-preview-pdf">
			<div ref={pagesRef} />
			{cutAt !== null && <p className="workspace-preview-note">Showing the first {cutAt} pages.</p>}
		</div>
	);
}

function WordPreview({ url, title }: { url: string; title: string }) {
	const [html, setHtml] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		let gone = false;
		fetchPreview(url).then((response) => response.text()).then(
			(text) => { if (!gone) setHtml(text); },
			(cause: Error) => { if (!gone) setError(cause.message); },
		);
		return () => { gone = true; };
	}, [url]);
	if (error) return <PreviewError text={error} />;
	if (html === null) return <p className="workspace-preview-note">Loading…</p>;
	// sandbox="" grants nothing: no scripts, no same-origin access, whatever the document holds.
	return (
		<div className="workspace-preview-body workspace-preview-word">
			<iframe sandbox="" srcDoc={html} title={title} referrerPolicy="no-referrer" />
		</div>
	);
}

function SpreadsheetPreview({ url }: { url: string }) {
	const [sheets, setSheets] = useState<Sheet[] | null>(null);
	const [truncatedSheets, setTruncatedSheets] = useState(false);
	const [active, setActive] = useState(0);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		let gone = false;
		fetchPreview(url).then((response) => response.json()).then(
			(body) => {
				if (gone) return;
				setSheets(body.sheets);
				setTruncatedSheets(body.truncatedSheets === true);
			},
			(cause: Error) => { if (!gone) setError(cause.message); },
		);
		return () => { gone = true; };
	}, [url]);
	if (error) return <PreviewError text={error} />;
	if (!sheets) return <p className="workspace-preview-note">Loading…</p>;
	const sheet = sheets[active];
	return (
		<div className="workspace-preview-sheet">
			{sheets.length > 1 && (
				<div className="workspace-preview-sheet-tabs" role="group" aria-label="Sheets">
					{sheets.map((entry, index) => (
						<button type="button" key={entry.name} aria-pressed={index === active} onClick={() => setActive(index)}>{entry.name}</button>
					))}
				</div>
			)}
			<div className="workspace-preview-body">
				{sheet && sheet.rows.length > 0 ? (
					<table>
						<tbody>
							{sheet.rows.map((row, rowIndex) => (
								<tr key={rowIndex}>
									<th scope="row">{rowIndex + 1}</th>
									{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
								</tr>
							))}
						</tbody>
					</table>
				) : <p className="workspace-preview-note">This sheet is empty.</p>}
				{sheet?.truncated && <p className="workspace-preview-note">This sheet is too large to show in full.</p>}
				{truncatedSheets && <p className="workspace-preview-note">Only the first {sheets.length} sheets are shown.</p>}
			</div>
		</div>
	);
}

function ImagePreview({ url, name }: { url: string; name: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) return <PreviewError text="This image could not be shown." />;
	return (
		<div className="workspace-preview-body workspace-preview-image">
			<img src={url} alt={name} onError={() => setFailed(true)} />
		</div>
	);
}

/** A read-only view of one workspace file. Nothing in it can change the file. */
export function WorkspaceFilePreview({ agentId, conversationId, path }: Props) {
	const name = workspaceFileName(path);
	const kind = workspaceFileKind(path);
	const previewUrl = workspaceFileUrl(agentId, conversationId, "workspace-preview", path);
	return (
		<aside className="workspace-preview-pane" aria-label={`Preview: ${name}`}>
			<header className="workspace-preview-header">
				<h2>{name}</h2>
				<span title={path}>{path}</span>
			</header>
			{kind === "image" && <ImagePreview url={workspaceFileUrl(agentId, conversationId, "workspace-image", path)} name={name} />}
			{kind === "pdf" && <PdfPreview url={previewUrl} />}
			{kind === "word" && <WordPreview url={previewUrl} title={name} />}
			{kind === "spreadsheet" && <SpreadsheetPreview url={previewUrl} />}
		</aside>
	);
}
