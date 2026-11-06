import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export function WorkspaceImagePreview({ agentId, conversationId, path }: { agentId: string; conversationId: string; path: string }) {
	const [src, setSrc] = useState<string | null>(null);
	const [error, setError] = useState(false);
	useEffect(() => {
		const controller = new AbortController();
		let objectUrl: string | null = null;
		const query = new URLSearchParams({ conversationId, path });
		void apiFetch(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-image?${query}`, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error("Image unavailable");
				const blob = await response.blob();
				if (controller.signal.aborted) return;
				objectUrl = URL.createObjectURL(blob);
				setSrc(objectUrl);
			})
			.catch(() => { if (!controller.signal.aborted) setError(true); });
		return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
	}, [agentId, conversationId, path]);
	return <div className="workspace-preview-image">{src ? <img src={src} alt={path.split("/").pop() ?? path} /> : error ? <p>This file could not be previewed.</p> : <p>Loading preview…</p>}</div>;
}
