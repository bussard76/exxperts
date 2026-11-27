import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function formatted(path: string, text: string): string {
	if (!/\.json$/i.test(path)) return text;
	try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

export function WorkspaceTextPreview({ agentId, conversationId, path }: { agentId: string; conversationId: string; path: string }) {
	const [text, setText] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadedFor, setLoadedFor] = useState("");
	const identity = JSON.stringify([agentId, conversationId, path]);
	useEffect(() => {
		const controller = new AbortController();
		const query = new URLSearchParams({ conversationId, path });
		void apiFetch(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${query}`, { signal: controller.signal })
			.then(async (response) => {
				const body = await response.json();
				if (controller.signal.aborted) return;
				if (response.ok && body?.schemaVersion === 1 && body.agentId === agentId && body.conversationId === conversationId && body.path === path && body.kind === "text" && typeof body.text === "string" && body.text.length <= 16_777_216 && new Blob([body.text]).size <= 16_777_216 && Array.isArray(body.notices) && body.notices.length === 0) { setText(formatted(path, body.text)); setError(null); }
				else { setText(null); setError(response.status === 401 ? "Sign in to preview this file." : !response.ok && typeof body?.error === "string" ? body.error : "This file could not be previewed."); }
				setLoadedFor(identity);
			})
			.catch(() => { if (!controller.signal.aborted) { setText(null); setLoadedFor(identity); setError("This file could not be previewed."); } });
		return () => controller.abort();
	}, [agentId, conversationId, path, identity]);
	if (loadedFor !== identity) return <div className="workspace-preview-text"><p>Loading preview…</p></div>;
	return <div className="workspace-preview-text">{text !== null ? <pre>{text}</pre> : <p>{error ?? "Loading preview…"}</p>}</div>;
}
