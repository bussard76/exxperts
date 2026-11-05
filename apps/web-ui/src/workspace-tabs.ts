export type WorkspaceFileKind = "markdown" | "image" | "pdf" | "word" | "spreadsheet";

const KIND_BY_EXTENSION: Record<string, WorkspaceFileKind> = {
	".md": "markdown",
	".png": "image",
	".jpg": "image",
	".jpeg": "image",
	".gif": "image",
	".webp": "image",
	".svg": "image",
	".pdf": "pdf",
	".docx": "word",
	".doc": "word",
	".xlsx": "spreadsheet",
	".xlsm": "spreadsheet",
	".xls": "spreadsheet",
};

/** What a workspace file opens as in the right pane; null when it has no view. */
export function workspaceFileKind(path: string): WorkspaceFileKind | null {
	const name = path.slice(path.lastIndexOf("/") + 1);
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return null;
	return KIND_BY_EXTENSION[name.slice(dot).toLowerCase()] ?? null;
}

export function workspaceFileName(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1) || path;
}

export function openWorkspaceTab(tabs: string[], path: string): string[] {
	return tabs.includes(path) ? tabs : [...tabs, path];
}

/** Closing the active tab moves to its right neighbour, then its left one, then none. */
export function closeWorkspaceTab(tabs: string[], path: string, active: string | null): { tabs: string[]; active: string | null } {
	const index = tabs.indexOf(path);
	const remaining = tabs.filter((tab) => tab !== path);
	if (active !== path) return { tabs: remaining, active };
	return { tabs: remaining, active: remaining[index] ?? remaining[index - 1] ?? null };
}
