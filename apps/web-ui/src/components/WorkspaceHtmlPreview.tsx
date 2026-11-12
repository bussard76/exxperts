import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";

// The frame loads the same route with frame=1. Its sandbox has no allow-same-origin, so a file's scripts
// run without the app's cookies or API, and the route's own policy blocks every network request.
export function WorkspaceHtmlPreview({ agentId, conversationId, path }: { agentId: string; conversationId: string; path: string }) {
	const [snapshot, setSnapshot] = useState<ArrayBuffer | null>(null);
	const [error, setError] = useState<string | null>(null);
	const frameRef = useRef<HTMLIFrameElement>(null);
	const delivered = useRef(false);
	const route = `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${new URLSearchParams({ conversationId, path })}`;
	useEffect(() => {
		const controller = new AbortController();
		// A plain request first, so a refused file shows its sentence instead of raw JSON in the frame.
		void apiFetch(route, { signal: controller.signal })
			.then(async (response) => {
				const body = await response.json();
				if (controller.signal.aborted) return;
				if (response.ok && body?.kind === "html" && typeof body.html === "string") setSnapshot(new TextEncoder().encode(body.html).buffer);
				else setError(response.status === 401 ? "Sign in to preview this file." : typeof body?.error === "string" ? body.error : "This file could not be previewed.");
			})
			.catch(() => { if (!controller.signal.aborted) setError("This file could not be previewed."); });
		return () => controller.abort();
	}, [route]);
	useEffect(() => {
		const parent = frameRef.current?.ownerDocument.defaultView;
		if (!parent || !snapshot) return;
		const onMessage = (event: MessageEvent) => {
			const frame = frameRef.current?.contentWindow;
			if (!frame || event.source !== frame || event.data?.kind !== "frame-ready" || delivered.current) return;
			delivered.current = true;
			const copy = snapshot.slice(0);
			frame.postMessage(copy, "*", [copy]);
		};
		parent.addEventListener("message", onMessage);
		return () => parent.removeEventListener("message", onMessage);
	}, [snapshot]);
	return <div className="workspace-preview-html">{snapshot ? <iframe ref={frameRef} sandbox="allow-scripts" title={path.split("/").pop() ?? path} src={`${route}&frame=1`} /> : <p>{error ?? "Loading preview…"}</p>}</div>;
}
