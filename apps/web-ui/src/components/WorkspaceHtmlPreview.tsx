import { useEffect, useState } from "react";
import { apiFetch } from "../api";

// The frame loads the same route with frame=1. Its sandbox has no allow-same-origin, so a file's scripts
// run without the app's cookies or API, and the route's own policy blocks every network request.
export function WorkspaceHtmlPreview({ agentId, conversationId, path }: { agentId: string; conversationId: string; path: string }) {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadedFor, setLoadedFor] = useState("");
	const route = `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${new URLSearchParams({ conversationId, path })}`;
	useEffect(() => {
		const controller = new AbortController();
		// A plain request first, so a refused file shows its sentence instead of raw JSON in the frame.
		void apiFetch(route, { signal: controller.signal })
			.then(async (response) => {
				const body = await response.json();
				if (controller.signal.aborted) return;
				if (response.ok && body?.schemaVersion === 1 && body.agentId === agentId && body.conversationId === conversationId && body.path === path && body.kind === "html" && typeof body.html === "string" && body.html.length <= 16_777_216 && new Blob([body.html]).size <= 16_777_216 && Array.isArray(body.notices) && body.notices.length === 0) { setReady(true); setError(null); }
				else { setReady(false); setError(response.status === 401 ? "Sign in to preview this file." : !response.ok && typeof body?.error === "string" ? body.error : "This file could not be previewed."); }
				setLoadedFor(route);
			})
			.catch(() => { if (!controller.signal.aborted) { setReady(false); setLoadedFor(route); setError("This file could not be previewed."); } });
		return () => controller.abort();
	}, [agentId, conversationId, path, route]);
	if (loadedFor !== route) return <div className="workspace-preview-html"><p>Loading preview…</p></div>;
	return <div className="workspace-preview-html">{ready ? <iframe sandbox="allow-scripts" title={path.split("/").pop() ?? path} src={`${route}&frame=1`} /> : <p>{error ?? "Loading preview…"}</p>}</div>;
}
