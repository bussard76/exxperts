import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
// Only so the build emits the renderers' bundles; the server puts them into the frame's document.
import "../pptx-frame-entry.ts?worker&url";
import "../excalidraw-frame-entry.ts?worker&url";

// PPTX and Excalidraw: third-party renderers reading an untrusted file, so they stay in a frame with an
// opaque origin (no allow-same-origin) that may fetch nothing. The parent fetches the file and hands the bytes over.
export function WorkspaceFramedPreview({ agentId, conversationId, path }: { agentId: string; conversationId: string; path: string }) {
	const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [rendered, setRendered] = useState(false);
	const frameRef = useRef<HTMLIFrameElement>(null);
	// Read once: changing it later would reload the frame and lose the zoom.
	const [theme] = useState(() => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"));
	const route = `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${new URLSearchParams({ conversationId, path })}`;
	useEffect(() => {
		const controller = new AbortController();
		void apiFetch(route, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) {
					const body = await response.json().catch(() => null);
					if (!controller.signal.aborted) setError(response.status === 401 ? "Sign in to preview this file." : typeof body?.error === "string" ? body.error : "This file could not be previewed.");
					return;
				}
				const buffer = await response.arrayBuffer();
				if (!controller.signal.aborted) setBytes(buffer);
			})
			.catch(() => { if (!controller.signal.aborted) setError("This file could not be previewed."); });
		return () => controller.abort();
	}, [route]);
	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			const frame = frameRef.current?.contentWindow;
			if (!frame || event.source !== frame) return;
			if (event.data?.kind === "frame-ready" && bytes) frame.postMessage(bytes.slice(0), "*");
			else if (event.data?.kind === "frame-rendered") setRendered(true);
			else if (event.data?.kind === "frame-failed") setError("This file is damaged or cannot be read.");
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [bytes]);
	if (error) return <div className="workspace-preview-html"><p>{error}</p></div>;
	return <div className="workspace-preview-html">{!rendered && <p className="workspace-preview-pptx-loading">Loading preview…</p>}{bytes && <iframe ref={frameRef} sandbox="allow-scripts" title={path.split("/").pop() ?? path} src={`${route}&frame=1#theme=${theme}`} />}</div>;
}
