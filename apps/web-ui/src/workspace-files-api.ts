import { fetchJson } from "./api";

export interface WorkspaceFileEntry {
	name: string;
	relativePath: string;
	kind: "file" | "directory";
	bytes: number | null;
	modifiedAt: string;
	extension: string;
}

export interface WorkspaceFileListing {
	root: { displayLabel: string; basename: string } | null;
	path: string;
	entries: WorkspaceFileEntry[];
}

export async function listWorkspaceFiles(agentId: string, conversationId: string, relativePath = "", init?: RequestInit): Promise<WorkspaceFileListing> {
	const params = new URLSearchParams({ conversationId });
	if (relativePath) params.set("path", relativePath);
	const value: unknown = await fetchJson<unknown>(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-files?${params.toString()}`, { ...init, cache: "no-store" });
	const keys = (item: unknown, expected: string[]): item is Record<string, any> => !!item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).sort().join(",") === expected.slice().sort().join(",");
	if (!keys(value, ["agentId", "conversationId", "root", "path", "entries"]) || value.agentId !== agentId || value.conversationId !== conversationId || value.path !== relativePath || !Array.isArray(value.entries)) throw new Error("Invalid workspace listing.");
	if (value.root === null) {
		if (value.entries.length !== 0) throw new Error("Invalid workspace listing.");
	} else if (!keys(value.root, ["displayLabel", "basename"]) || typeof value.root.displayLabel !== "string" || typeof value.root.basename !== "string" || !value.root.basename || /[\\/\0]/.test(value.root.basename)) throw new Error("Invalid workspace listing.");
	const names = new Set<string>();
	for (const item of value.entries) {
		if (!keys(item, ["name", "relativePath", "kind", "bytes", "modifiedAt", "extension"]) || typeof item.name !== "string" || !item.name || item.name.startsWith(".") || /[\\/:\0]/.test(item.name) || names.has(item.name) || item.relativePath !== (relativePath ? `${relativePath}/${item.name}` : item.name) || !["file", "directory"].includes(item.kind) || (item.kind === "directory" ? item.bytes !== null || item.extension !== "" : !Number.isSafeInteger(item.bytes) || item.bytes < 0 || typeof item.extension !== "string") || typeof item.modifiedAt !== "string" || !Number.isFinite(Date.parse(item.modifiedAt))) throw new Error("Invalid workspace listing.");
		names.add(item.name);
	}
	return value as unknown as WorkspaceFileListing;
}
