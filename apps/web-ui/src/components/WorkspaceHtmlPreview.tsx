import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";

// The frame loads the same route with frame=1. Its sandbox has no allow-same-origin, so a file's scripts
// run without the app's cookies or API, and the route's own policy blocks every network request.
export function WorkspaceHtmlPreview({ agentId, conversationId, path, retained, createFrameId }: { agentId: string; conversationId: string; path: string; retained: { bytes: ArrayBuffer | null }; createFrameId: () => string | null }) {
	const [frameId] = useState(createFrameId);
	const [snapshot, setSnapshot] = useState<ArrayBuffer | null>(() => retained.bytes);
	const [error, setError] = useState<string | null>(() => frameId ? null : "This file could not be previewed.");
	const [rendered, setRendered] = useState(false);
	const frameRef = useRef<HTMLIFrameElement>(null);
	const delivered = useRef(false);
	const terminal = useRef(false);
	const fetchController = useRef<AbortController | null>(null);
	const route = `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${new URLSearchParams({ conversationId, path })}`;
	const frameSrc = `${route}&frame=1#${frameId}`;
	useEffect(() => {
		if (!frameId || retained.bytes) return;
		const controller = new AbortController();
		fetchController.current = controller;
		// A plain request first, so a refused file shows its sentence instead of raw JSON in the frame.
		void apiFetch(route, { signal: controller.signal })
			.then(async (response) => {
				const body = await response.json();
				if (controller.signal.aborted) return;
				if (response.ok && body?.kind === "html" && typeof body.html === "string") {
					const bytes = new TextEncoder().encode(body.html).buffer;
					retained.bytes = bytes;
					setSnapshot(bytes);
				}
				else setError(response.status === 401 ? "Sign in to preview this file." : typeof body?.error === "string" ? body.error : "This file could not be previewed.");
			})
			.catch(() => { if (!controller.signal.aborted) setError("This file could not be previewed."); });
		return () => { controller.abort(); if (fetchController.current === controller) fetchController.current = null; };
	}, [route, retained, frameId]);
	useEffect(() => {
		const parent = frameRef.current?.ownerDocument.defaultView;
		if (!parent || !snapshot) return;
		const onMessage = (event: MessageEvent) => {
			const element = frameRef.current;
			const frame = element?.contentWindow;
			if (!frame || event.source !== frame || element.getAttribute("src") !== frameSrc || terminal.current) return;
			if (event.data?.kind === "frame-ready" && event.data.frameId === frameId && !delivered.current) {
				delivered.current = true;
				const copy = snapshot.slice(0);
				frame.postMessage(copy, "*", [copy]);
			} else if (delivered.current && event.data?.kind === "frame-rendered") { terminal.current = true; setRendered(true); }
			else if (delivered.current && event.data?.kind === "frame-failed") { terminal.current = true; setError("This file could not be previewed."); }
		};
		parent.addEventListener("message", onMessage);
		return () => parent.removeEventListener("message", onMessage);
	}, [snapshot, frameId, frameSrc]);
	useEffect(() => {
		if (rendered || error) return;
		const timer = window.setTimeout(() => { terminal.current = true; fetchController.current?.abort(); setError("This preview took too long to load."); }, 30_000);
		return () => window.clearTimeout(timer);
	}, [rendered, error, route]);
	return <div className="workspace-preview-html">{error ? <p>{error}</p> : snapshot ? <>{!rendered && <p>Loading preview…</p>}<iframe ref={frameRef} sandbox="allow-scripts" title={path.split("/").pop() ?? path} src={frameSrc} /></> : <p>Loading preview…</p>}</div>;
}
