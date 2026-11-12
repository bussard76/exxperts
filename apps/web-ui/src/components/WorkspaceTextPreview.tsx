import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function formatted(path: string, text: string): string {
	if (!/\.json$/i.test(path)) return text;
	try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

export function WorkspaceTextPreview({ agentId, conversationId, path, retained }: { agentId: string; conversationId: string; path: string; retained: { text?: string } }) {
	const [text, setText] = useState<string | null>(() => retained.text ?? null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		if (retained.text !== undefined) return;
		const controller = new AbortController();
		const query = new URLSearchParams({ conversationId, path });
		void apiFetch(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${query}`, { signal: controller.signal })
			.then(async (response) => {
				const body = await response.json();
				if (controller.signal.aborted) return;
				if (response.ok && body?.kind === "text" && typeof body.text === "string") { retained.text = formatted(path, body.text); setText(retained.text); }
				else setError(response.status === 401 ? "Sign in to preview this file." : typeof body?.error === "string" ? body.error : "This file could not be previewed.");
			})
			.catch(() => { if (!controller.signal.aborted) setError("This file could not be previewed."); });
		return () => controller.abort();
	}, [agentId, conversationId, path, retained]);
	return <div className="workspace-preview-text">{text !== null ? <pre>{text}</pre> : <p>{error ?? "Loading preview…"}</p>}</div>;
}
