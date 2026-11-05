import fs from "node:fs";
import path from "node:path";
import { MAX_SPREADSHEET_BYTES } from "@exxeta/exxperts-runtime";
import * as XLSX from "xlsx";
import type { PersistentRoomCapabilityPolicy, PersistentRoomWorkspacePolicyStorageOptions } from "./persistent-room-workspace-policy.js";
import {
	normalizeRelativePath,
	PersistentRoomWorkspaceMarkdownError,
	requireWorkspaceReadPolicy,
	toMarkdownError,
} from "./persistent-room-workspace-markdown-files.js";
import { persistentRoomWorkspaceToolNamesForPolicy } from "./persistent-room-tool-policy.js";
import { PersistentRoomShelfError } from "./persistent-room-shelf.js";
import { runShelfDocxHtmlWorker } from "./persistent-room-shelf-reading.js";
import { resolvePersistentRoomWorkspaceExistingFile } from "./persistent-room-workspace-tools.js";

// Read-only views of workspace files for the right pane. Nothing here writes.
export const MAX_WORKSPACE_PREVIEW_BYTES = 25 * 1024 * 1024;
export const MAX_WORKSPACE_PREVIEW_ROWS = 5000;
export const MAX_WORKSPACE_PREVIEW_COLUMNS = 100;
export const MAX_WORKSPACE_PREVIEW_SHEETS = 50;

export interface WorkspacePreviewSheet {
	name: string;
	rows: string[][];
	truncated: boolean;
}

export type WorkspacePreview =
	| { kind: "pdf"; bytes: Buffer }
	| { kind: "word"; html: string }
	| { kind: "spreadsheet"; sheets: WorkspacePreviewSheet[]; truncatedSheets: boolean };

const WORD_PAGE_STYLE = `
body { margin: 0; padding: 24px; background: #fff; color: #1a1a1a; font: 15px/1.55 system-ui, sans-serif; overflow-wrap: anywhere; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; margin: 12px 0; }
td, th { border: 1px solid #c8c8c8; padding: 4px 8px; vertical-align: top; }
`;

function parseFailed(message: string): PersistentRoomWorkspaceMarkdownError {
	return new PersistentRoomWorkspaceMarkdownError("parse_failed", 422, message);
}

function startsWith(bytes: Buffer, signature: number[]): boolean {
	return signature.every((value, index) => bytes[index] === value);
}

async function wordPreview(absolutePath: string): Promise<WorkspacePreview> {
	let html: string;
	try {
		html = await runShelfDocxHtmlWorker(absolutePath);
	} catch (error) {
		if (error instanceof PersistentRoomShelfError) throw parseFailed("This Word file could not be read.");
		throw error;
	}
	// A read-only view follows no links: a click would load the target inside the frame.
	const inert = html.replace(/<a\b[^>]*>/g, "<a>");
	return { kind: "word", html: `<!doctype html><html><head><meta charset="utf-8"><style>${WORD_PAGE_STYLE}</style></head><body>${inert}</body></html>` };
}

function spreadsheetPreview(bytes: Buffer): WorkspacePreview {
	// xlsx reads anything that is not a workbook as text, so the format is checked first.
	const zip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
	const legacy = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);
	if (!zip && !legacy) throw parseFailed("This Excel file could not be read.");
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(bytes, { type: "buffer", cellDates: true, cellFormula: false, cellHTML: false, cellNF: false, cellStyles: false, sheetRows: MAX_WORKSPACE_PREVIEW_ROWS + 1 });
	} catch {
		throw parseFailed("This Excel file could not be read.");
	}
	const sheets = workbook.SheetNames.slice(0, MAX_WORKSPACE_PREVIEW_SHEETS).map((name) => {
		const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: false, defval: "", blankrows: true, dateNF: "yyyy-mm-dd" });
		const wide = rows.some((row) => row.length > MAX_WORKSPACE_PREVIEW_COLUMNS);
		return {
			name,
			rows: rows.slice(0, MAX_WORKSPACE_PREVIEW_ROWS).map((row) => row.slice(0, MAX_WORKSPACE_PREVIEW_COLUMNS).map((cell) => String(cell ?? ""))),
			truncated: wide || rows.length > MAX_WORKSPACE_PREVIEW_ROWS,
		};
	});
	return { kind: "spreadsheet", sheets, truncatedSheets: workbook.SheetNames.length > sheets.length };
}

async function previewWithPolicy(policy: PersistentRoomCapabilityPolicy, rawPath: unknown): Promise<WorkspacePreview> {
	const relativePath = normalizeRelativePath(rawPath);
	const extension = path.extname(relativePath).toLowerCase();
	if (extension === ".doc") throw new PersistentRoomWorkspaceMarkdownError("unsupported_file_type", 415, "Old .doc files cannot be shown. Save it as .docx to read it here.");
	const spreadsheet = extension === ".xlsx" || extension === ".xlsm" || extension === ".xls";
	if (extension !== ".pdf" && extension !== ".docx" && !spreadsheet) {
		throw new PersistentRoomWorkspaceMarkdownError("unsupported_file_type", 400, "This file type cannot be shown.");
	}
	try {
		const guarded = resolvePersistentRoomWorkspaceExistingFile(policy, relativePath);
		const limit = spreadsheet ? MAX_SPREADSHEET_BYTES : MAX_WORKSPACE_PREVIEW_BYTES;
		if (guarded.stat.size > limit) {
			throw new PersistentRoomWorkspaceMarkdownError("file_too_large", 413, `This file is too large to show (${limit / (1024 * 1024)} MiB maximum).`);
		}
		if (extension === ".docx") return await wordPreview(guarded.absolutePath);
		const bytes = fs.readFileSync(guarded.absolutePath);
		if (spreadsheet) return spreadsheetPreview(bytes);
		// Only real PDFs are handed out as PDFs, whatever the file is called.
		if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new PersistentRoomWorkspaceMarkdownError("invalid_file", 415, "This file is not a valid PDF.");
		return { kind: "pdf", bytes };
	} catch (error) {
		throw toMarkdownError(error);
	}
}

export function readWorkspacePreview(
	agentId: string,
	conversationId: string,
	rawPath: unknown,
	options: PersistentRoomWorkspacePolicyStorageOptions = {},
): Promise<WorkspacePreview> {
	return previewWithPolicy(requireWorkspaceReadPolicy(agentId, conversationId, options).policy, rawPath);
}

export async function readWorkspacePreviewWithPolicy(policy: PersistentRoomCapabilityPolicy, rawPath: unknown): Promise<WorkspacePreview> {
	if (policy.modes.read !== true || persistentRoomWorkspaceToolNamesForPolicy(policy).length === 0) throw new PersistentRoomWorkspaceMarkdownError("workspace_read_forbidden", 403, "Workspace reading is not enabled for this room.");
	return previewWithPolicy(policy, rawPath);
}
