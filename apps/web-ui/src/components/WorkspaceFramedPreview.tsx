import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
// Only so the build emits the renderers' bundles; the server puts them into the frame's document.
import "../pptx-frame-entry.ts?worker&url";
import "../excalidraw-frame-entry.ts?worker&url";

// PPTX and Excalidraw: third-party renderers reading an untrusted file, so they stay in a frame with an
// opaque origin (no allow-same-origin) that may fetch nothing. The parent fetches the file and hands the bytes over.
export function WorkspaceFramedPreview({ agentId, conversationId, path, retained, createFrameId, hostGeneration }: { agentId: string; conversationId: string; path: string; retained: { bytes: ArrayBuffer | null; nextFrame?: { generation: number; id: string } }; createFrameId: () => string | null; hostGeneration: number }) {
	const [firstFrameId] = useState(createFrameId);
	const activeFrame = useRef({ generation: hostGeneration, id: firstFrameId, delivered: false, terminal: false });
	if (activeFrame.current.generation !== hostGeneration) activeFrame.current = { generation: hostGeneration, id: retained.nextFrame?.generation === hostGeneration ? retained.nextFrame.id : null, delivered: false, terminal: false };
	const instance = activeFrame.current;
	const frameId = instance.id;
	const [bytes, setBytes] = useState<ArrayBuffer | null>(() => retained.bytes);
	const [error, setError] = useState<string | null>(() => frameId ? null : "This file could not be previewed.");
	const [renderedGeneration, setRenderedGeneration] = useState<number | null>(null);
	const rendered = renderedGeneration === hostGeneration;
	const frameRef = useRef<HTMLIFrameElement>(null);
	const fetchController = useRef<AbortController | null>(null);
	// Read once: changing it later would reload the frame and lose the zoom.
	const [theme] = useState(() => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"));
	const route = `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${new URLSearchParams({ conversationId, path })}`;
	const frameSrc = `${route}&frame=1#theme=${theme}&frameId=${frameId}`;
	useEffect(() => {
		if (!firstFrameId || retained.bytes) return;
		const controller = new AbortController();
		fetchController.current = controller;
		void apiFetch(route, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) {
					const body = await response.json().catch(() => null);
					if (!controller.signal.aborted) setError(response.status === 401 ? "Sign in to preview this file." : typeof body?.error === "string" ? body.error : "This file could not be previewed.");
					return;
				}
				const buffer = await response.arrayBuffer();
				if (!controller.signal.aborted) { retained.bytes = buffer; setBytes(buffer); }
			})
			.catch(() => { if (!controller.signal.aborted) setError("This file could not be previewed."); });
		return () => { controller.abort(); if (fetchController.current === controller) fetchController.current = null; };
	}, [route, retained, firstFrameId]);
	useEffect(() => {
		const parent = frameRef.current?.ownerDocument.defaultView;
		if (!parent || !bytes) return;
		const onMessage = (event: MessageEvent) => {
			const element = frameRef.current;
			const frame = element?.contentWindow;
			if (activeFrame.current !== instance || !frame || element.ownerDocument.defaultView !== parent || event.source !== frame || element.getAttribute("src") !== frameSrc || instance.terminal) return;
			if (event.data?.kind === "frame-ready" && event.data.frameId === frameId && !instance.delivered) {
				instance.delivered = true;
				const copy = bytes.slice(0);
				frame.postMessage(copy, "*", [copy]);
			}
			else if (instance.delivered && event.data?.kind === "frame-rendered") { instance.terminal = true; setRenderedGeneration(hostGeneration); }
			else if (instance.delivered && event.data?.kind === "frame-failed") { instance.terminal = true; setError("This file is damaged or cannot be read."); }
		};
		parent.addEventListener("message", onMessage);
		return () => parent.removeEventListener("message", onMessage);
	}, [bytes, frameId, frameSrc, hostGeneration, instance]);
	useEffect(() => {
		if (!frameId || rendered || error) return;
		const timer = window.setTimeout(() => { if (activeFrame.current !== instance) return; instance.terminal = true; fetchController.current?.abort(); setError("This preview took too long to load."); }, 30_000);
		return () => window.clearTimeout(timer);
	}, [rendered, error, route, frameId, hostGeneration, instance]);
	if (!frameId || error) return <div className="workspace-preview-html"><p>{error ?? "This file could not be previewed."}</p></div>;
	return <div className="workspace-preview-html">{!rendered && <p className="workspace-preview-pptx-loading">Loading preview…</p>}{bytes && <iframe key={hostGeneration} ref={frameRef} sandbox="allow-scripts" title={path.split("/").pop() ?? path} src={frameSrc} />}</div>;
}
