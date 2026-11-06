import path from "node:path";
import type { FastifyRequest } from "fastify";
import { ARTIFACT_SECURITY_HEADERS } from "./request-checks.js";
import { MAINTENANCE_DIAGNOSTICS_KEEP, MAINTENANCE_DIAGNOSTICS_DEFAULT_LIMIT, listMaintenanceDiagnostics, exportMaintenanceDiagnostics } from "./maintenance-diagnostics.js";
import { createPersistentAgentInstance, getPersistentAgentThread, saveWithOpenConversationCheck, getPersistentRoomInstructionsView, savePersistentRoomGlobalInstructionsEnabled, savePersistentRoomInstructions } from "./persistent-agents.js";
import { normalizePersistentRoomWorkspaceToolSelectionInput, persistentRoomWorkspaceToolNamesForPolicy } from "./persistent-room-tool-policy.js";
import { PersistentRoomWorkspacePolicyError, resolvePersistentRoomEffectiveWorkspacePolicy, assertPersistentRoomWorkspaceDefaultMutable, releasePersistentRoomThreadWorkspaceMirror, type PersistentRoomCapabilityPolicy, persistentRoomCapabilityPolicyView, readPersistentRoomCapabilityPolicy, PERSISTENT_ROOM_WORKSPACE_POLICY_STORAGE_SOURCE, deletePersistentRoomCapabilityPolicy, readPersistentRoomDefaultCapabilityPolicy, PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE, missingPersistentRoomWorkspaceRootWarnings, normalizePersistentRoomWorkspaceAccessModeInput, createPersistentRoomDefaultCapabilityPolicy, updatePersistentRoomCapabilityPolicyWorkspaceSettings, writePersistentRoomDefaultCapabilityPolicy, deletePersistentRoomDefaultCapabilityPolicy, createPersistentRoomCapabilityPolicy, writePersistentRoomCapabilityPolicy } from "./persistent-room-workspace-policy.js";
import { PersistentRoomWorkspaceToolError, resolvePersistentRoomWorkspaceExistingFile, resolvePersistentRoomWorkspacePath } from "./persistent-room-workspace-tools.js";
import { runWorkspacePreviewWorker } from "./persistent-room-shelf-reading.js";
import { listPersistentRoomWorkspaceFiles } from "./persistent-room-workspace-files.js";
import { PersistentRoomWorkspaceMarkdownError, readWorkspaceImageFile, readWorkspaceMarkdownFile, writeWorkspaceMarkdownFile } from "./persistent-room-workspace-markdown-files.js";
import { readPersistentRoomMaintenanceSettings, writePersistentRoomMaintenanceSettings } from "./persistent-room-maintenance-settings.js";
import { settleMemoryBudget } from "./memory-entries-store.js";
import { readPersistentRoomBashSettings, writePersistentRoomBashSettings } from "./persistent-room-bash-settings.js";
import { isRoomEffortLevel, readPersistentRoomEffortChoice, writePersistentRoomEffortChoice } from "./persistent-room-effort-settings.js";
import { persistentRoomShellFound, PERSISTENT_ROOM_SHELL_MISSING_SENTENCE } from "./persistent-room-shell-missing.js";
import { createRoomModelCatalog, resolveAiDefault, memoryModelTooSmallSentence, writeRoomModels } from "./room-models.js";
import { ROOM_INSTRUCTIONS_MAX_CHARS } from "./persistent-room-instructions.js";
import { readPersistentRoomSkillSettings, computeSkillStatuses, enablePersistentRoomSkill, disablePersistentRoomSkill, approvePersistentRoomSkillExecution, revokePersistentRoomSkillExecution } from "./persistent-room-skill-settings.js";
import { listConfiguredMcpConnectorNames } from "./mcp-status.js";
import { readPersistentRoomMcpSettings, computeGrantedConnectorStatuses, grantPersistentRoomMcpConnector, revokePersistentRoomMcpConnector } from "./persistent-room-mcp-settings.js";
import { buildRoomMemoryHistory } from "./memory-api.js";
import { registerMemoryEntryRoutes } from "./memory-entries-api.js";
import { undoMemorySave } from "./memory-undo.js";
import { withRoomSaveLock } from "./memory-commit.js";
import { isSharedServer } from "./server-hooks.js";
import { activeRoomLock, REPO_ROOT, roomLockBusyStatus } from "./server-install-root.js";
import { app } from "./server-app.js";
import { getUsablePersistentAgentStatusForNormalUse, persistentAgentNormalUseErrorReply } from "./room-status.js";
import { parseRoomModelPatch, roomModelsPayload } from "./ai-models.js";
import { memoryBudgetRaiseRefusal, refuseMemoryBudgetRaise, refuseMemoryModelTooSmall } from "./ai-profile-models.js";
import { resolveExecutableSkillFiles, resolveLibrarySkillManifest, skillLibraryFingerprint, withSkillDisplayNames } from "./skills-library.js";

function parsePersistentRoomWorkspaceMode(value: unknown): "read" | "write" {
	if (value == null || value === "") return "read";
	const mode = String(value).trim();
	if (mode === "read" || mode === "read-only") return "read";
	if (mode === "write") return mode;
	throw new Error("workspace mode must be read, read-only, or write");
}

function parsePersistentRoomWorkspaceSource(value: unknown): "manual" | "query-param" | "runtime-state" | "admin-dev" {
	if (value == null || value === "") return "manual";
	const source = String(value).trim();
	if (source === "manual" || source === "query-param" || source === "runtime-state" || source === "admin-dev") return source;
	throw new Error("workspace source must be manual, query-param, runtime-state, or admin-dev");
}

function persistentRoomWorkspaceErrorPayload(error: unknown): { statusCode: number; body: Record<string, unknown> } {
	if (error instanceof PersistentRoomWorkspacePolicyError) {
		return {
			statusCode: 400,
			body: {
				error: error.message,
				code: error.code,
				...(error.forbiddenRoot ? { forbiddenRoot: error.forbiddenRoot } : {}),
			},
		};
	}
	const statusCode = (error as any)?.statusCode ?? 400;
	return { statusCode, body: { error: error instanceof Error ? error.message : String(error), ...((error as any)?.code ? { code: (error as any).code } : {}) } };
}

// Workspace defaults apply live: the only boundary a mutation must respect is
// a turn actually in flight (a turn finishes under the rules it started with).
// Before the mutation, the active thread sheds a sidecar that merely mirrors
// the current default (the old snapshot regime pinned every thread this way),
// so the running conversation follows the live default from its next message;
// a sidecar that differs from the default is a deliberate per-conversation
// override and stays authoritative.
function guardActiveThreadBeforeWorkspaceDefaultMutation(status: ReturnType<typeof getUsablePersistentAgentStatusForNormalUse>, action: "Save" | "Clear"): void {
	const activeThread = status.activeThread;
	if (!activeThread) return;
	assertPersistentRoomWorkspaceDefaultMutable(activeThread, action);
	releasePersistentRoomThreadWorkspaceMirror(status.id, activeThread.threadId);
}

// Whether this request may carry a full path from this computer: only a page
// on this computer, decided here per request, so a remote device or a shared
// server never receives one.
function requestGetsLocalPaths(req: FastifyRequest): boolean {
	return !(req as any).exxRemoteDevice && !isSharedServer();
}

function workspacePolicyViewFor(req: FastifyRequest, policy: PersistentRoomCapabilityPolicy) {
	return persistentRoomCapabilityPolicyView(policy, { withPaths: requestGetsLocalPaths(req) });
}

app.get("/api/persistent-agents/:id/workspace-policy", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const policy = readPersistentRoomCapabilityPolicy(id, conversationId);
		return {
			agentId: id,
			conversationId,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_POLICY_STORAGE_SOURCE },
			policy: policy ? workspacePolicyViewFor(req, policy) : null,
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.get("/api/persistent-agents/:id/workspace-files", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const requestedPath = String(query.path ?? "");
		const effectivePolicy = resolvePersistentRoomEffectiveWorkspacePolicy(status.id, conversationId);
		return {
			agentId: status.id,
			conversationId,
			...listPersistentRoomWorkspaceFiles(effectivePolicy.policy, requestedPath),
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.get("/api/persistent-agents/:id/workspace-markdown", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const filePath = String(query.path ?? "");
		return { agentId: status.id, conversationId, ...readWorkspaceMarkdownFile(status.id, conversationId, filePath) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		if (e instanceof PersistentRoomWorkspaceMarkdownError && e.currentRevision) payload.body.currentRevision = e.currentRevision;
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.get("/api/persistent-agents/:id/workspace-preview", async (req, reply) => {
	reply.headers({
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "no-referrer",
		"Content-Security-Policy": "sandbox; default-src 'none'",
	});
	let agentId: string;
	try {
		agentId = getUsablePersistentAgentStatusForNormalUse(String((req.params as any).id ?? "").trim()).id;
	} catch (error) {
		if ((error as { statusCode?: number }).statusCode !== 404) return persistentAgentNormalUseErrorReply(reply, error);
		return reply.code(404).send({ code: "room_not_found", error: "This file is no longer available in this workspace." });
	}
	const query = (req.query ?? {}) as Record<string, unknown>;
	if (typeof query.conversationId !== "string" || !query.conversationId || typeof query.path !== "string" || !query.path) {
		return reply.code(400).send({ code: "invalid_request", error: "Choose a valid workspace file to preview." });
	}
	const relativePath = query.path.replaceAll("\\", "/");
	if (relativePath.includes("\0") || relativePath.startsWith("~") || relativePath.startsWith("/") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(relativePath)
		|| relativePath.split("/").some((segment) => !segment || segment.startsWith("."))
		|| (process.platform === "win32" && relativePath.includes(":"))) {
		return reply.code(400).send({ code: "invalid_path", error: "Choose a valid workspace file to preview." });
	}
	let conversationExists = false;
	try { conversationExists = getPersistentAgentThread(agentId, query.conversationId) !== null; } catch { /* Invalid thread identifiers are not conversations. */ }
	if (!conversationExists) return reply.code(404).send({ code: "conversation_not_found", error: "This file is no longer available in this workspace." });
	const effective = resolvePersistentRoomEffectiveWorkspacePolicy(agentId, query.conversationId);
	if (!effective.policy) return reply.code(404).send({ code: "workspace_not_found", error: "This file is no longer available in this workspace." });
	if (!effective.workspaceToolsEnabled || !effective.policy.modes.read || !persistentRoomWorkspaceToolNamesForPolicy(effective.policy).includes("read")) {
		return reply.code(403).send({ code: "workspace_read_forbidden", error: "This file is not available under the current workspace permissions." });
	}
	let guarded: ReturnType<typeof resolvePersistentRoomWorkspaceExistingFile>;
	try {
		guarded = resolvePersistentRoomWorkspaceExistingFile(effective.policy, relativePath);
	} catch (error) {
		if (error instanceof PersistentRoomWorkspaceToolError) {
			if (error.code === "file_not_found") return reply.code(404).send({ code: "file_not_found", error: "This file is no longer available in this workspace." });
			if (error.code === "workspace_unavailable") return reply.code(503).send({ code: "workspace_unavailable", error: "The workspace folder is not readable right now." });
			if (error.code === "not_file") {
				try {
					if (!resolvePersistentRoomWorkspacePath(effective.policy, relativePath, "read").lstat.isSymbolicLink()) {
						return reply.code(400).send({ code: "not_file", error: "Choose a valid workspace file to preview." });
					}
				} catch { /* A changed target remains refused. */ }
			}
			return reply.code(403).send({ code: "blocked_by_policy", error: "This file is not available under the current workspace permissions." });
		}
		return reply.code(500).send({ code: "preview_failed", error: "This file could not be previewed." });
	}
	const extension = path.extname(relativePath).toLowerCase();
	if (extension === ".doc") return reply.code(415).send({ code: "legacy_doc", error: "Save this old .doc file as .docx to preview it here." });
	if (![".xlsx", ".xlsm", ".xls", ".docx", ".pdf"].includes(extension)) {
		return reply.code(415).send({ code: "unsupported_file_type", error: "This file type cannot be previewed here." });
	}
	if (extension !== ".pdf" && extension !== ".docx") return reply.code(503).send({ code: "renderer_unavailable", error: "Preview rendering is unavailable on this system." });
	const kind = extension === ".pdf" ? "pdf" : "word";
	const controller = new AbortController();
	const abort = () => { if (!reply.raw.writableEnded) controller.abort(); };
	req.raw.once("aborted", abort);
	reply.raw.once("close", abort);
	const stat = guarded.stat;
	let result: Awaited<ReturnType<typeof runWorkspacePreviewWorker>>;
	try {
		result = await runWorkspacePreviewWorker({
			mode: "workspace-preview-v1", kind, absolutePath: guarded.absolutePath,
			expected: { dev: String(stat.dev), ino: String(stat.ino), size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs },
			limits: { inputBytes: 26214400, timeoutMs: kind === "pdf" ? 60000 : 30000, zipEntries: 10000, zipTotalBytes: 134217728, zipEntryBytes: 33554432, zipExpansionRatio: 200,
				gridSlots: 200000, cells: 100000, maxRow: 100000, maxColumn: 16384, cellTextChars: 32767, gridDimensionPx: 10000,
				cfbSectors: 51200, cfbChainLinks: 200000, cfbDirectoryEntries: 16384, cfbDirectoryVisits: 65536, cfbDirectoryDepth: 128,
				cfbWorkbookBytes: 26214400, cfbExtractedBytes: 52428800, biffRecords: 200000, biffPayloadBytes: 33554432, biffRecordBytes: 8224,
				biffContinuations: 1024, biffLogicalBytes: 1048576, biffSheets: 1024, biffStyles: 16384, biffFonts: 4096, biffFormats: 4096,
				biffMerges: 100000, biffReferences: 400000, wordHtmlBytes: 16777216, wordElements: 200000, imagePixels: 40000000,
				totalImagePixels: 80000000, unknownImageBytes: 2097152, pdfPages: 200, pdfPagePixels: 4000000, pdfTotalPixels: 80000000,
				pdfJpegBytes: 33554432, resultJsonBytes: 50331648 },
		}, controller.signal);
	} finally {
		req.raw.removeListener("aborted", abort);
		reply.raw.removeListener("close", abort);
	}
	if (!result.ok) {
		const errors: Record<string, [number, string]> = {
			file_changed: [409, "This file changed while the preview was loading; close the tab and open it again."],
			file_too_large: [413, "This file is too large or complex to preview here."],
			preview_too_complex: [413, "This file is too large or complex to preview here."],
			expanded_content_too_large: [413, "This file is too large or complex to preview here."],
			decoded_image_too_large: [413, "This file is too large or complex to preview here."],
			unsupported_document_feature: [422, "This document uses a feature that cannot be previewed here."],
			damaged_file: [422, "This file is damaged or cannot be read."],
			encrypted_file: [422, "Password-protected files cannot be previewed here."],
			renderer_unavailable: [503, "Preview rendering is unavailable on this system."],
			preview_busy: [503, "Another preview is loading; close this tab and open it again shortly."],
			preview_timeout: [504, "This preview took too long to load."],
		};
		const code = result.code && errors[result.code] ? result.code : "preview_failed";
		const [status, error] = errors[code] ?? [500, "This file could not be previewed."];
		return reply.code(status).send({ code, error });
	}
	try {
		const current = resolvePersistentRoomEffectiveWorkspacePolicy(agentId, query.conversationId);
		if (!current.policy || !current.workspaceToolsEnabled || !current.policy.modes.read || !persistentRoomWorkspaceToolNamesForPolicy(current.policy).includes("read")) throw new Error("permission");
		const again = resolvePersistentRoomWorkspaceExistingFile(current.policy, relativePath);
		if (again.absolutePath !== guarded.absolutePath || again.rootRealpath !== guarded.rootRealpath || again.stat.dev !== stat.dev || again.stat.ino !== stat.ino || again.stat.size !== stat.size || again.stat.mtimeMs !== stat.mtimeMs || again.stat.ctimeMs !== stat.ctimeMs) {
			return reply.code(409).send({ code: "file_changed", error: "This file changed while the preview was loading; close the tab and open it again." });
		}
	} catch {
		return reply.code(403).send({ code: "workspace_read_forbidden", error: "This file is not available under the current workspace permissions." });
	}
	return { schemaVersion: 1, agentId, conversationId: query.conversationId, path: relativePath, notices: result.notices, ...(result.result as object) };
});

app.get("/api/persistent-agents/:id/workspace-image", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const image = readWorkspaceImageFile(status.id, conversationId, query.path);
		return reply.headers(ARTIFACT_SECURITY_HEADERS).type(image.contentType).send(image.bytes);
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.put("/api/persistent-agents/:id/workspace-markdown", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const body = (req.body ?? {}) as any;
		return { agentId: status.id, conversationId, ...writeWorkspaceMarkdownFile(status.id, conversationId, query.path, body.content, body.revision) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		if (e instanceof PersistentRoomWorkspaceMarkdownError && e.currentRevision) payload.body.currentRevision = e.currentRevision;
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.delete("/api/persistent-agents/:id/workspace-policy", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		const query = (req.query ?? {}) as any;
		const conversationId = String(query.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const result = deletePersistentRoomCapabilityPolicy(id, conversationId);
		return {
			agentId: id,
			conversationId,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_POLICY_STORAGE_SOURCE },
			policy: null,
			deleted: result.deleted,
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

// The numbers behind this room's maintenance runs: sizes, timings, stop
// reasons, which expected markers each reply carried, how the validator judged
// it. Never a prompt, a reply, or a line of the room's memory — so a user can
// send a failing run to be looked at without sending their memory with it.
app.get("/api/persistent-agents/:id/maintenance-diagnostics", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const query = (req.query ?? {}) as any;
		const requested = Number(query.limit);
		const limit = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), MAINTENANCE_DIAGNOSTICS_KEEP) : MAINTENANCE_DIAGNOSTICS_DEFAULT_LIMIT;
		const records = listMaintenanceDiagnostics(createPersistentAgentInstance(status.id).rootDir, limit);
		return { agentId: status.id, limit, recordCount: records.length, records };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// The same records as one document, for attaching to a report.
app.get("/api/persistent-agents/:id/maintenance-diagnostics/export", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		return exportMaintenanceDiagnostics(createPersistentAgentInstance(status.id).rootDir, status.id);
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.get("/api/persistent-agents/:id/maintenance-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		settleMemoryBudget(status.id);
		const settings = readPersistentRoomMaintenanceSettings(status.id);
		return { agentId: status.id, settings };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/maintenance-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		// A dry run saves nothing: it answers with the refusal a save of that budget would get, or none, so Memory can ask again after the Memory model changes.
		if (body.dryRun === true) return { agentId: status.id, settings: readPersistentRoomMaintenanceSettings(status.id), budgetRefusal: memoryBudgetRaiseRefusal(status.id, body.memoryBudgetTokens) };
		refuseMemoryBudgetRaise(status.id, body.memoryBudgetTokens);
		const settings = writePersistentRoomMaintenanceSettings(status.id, { fastPathSecondApproval: body.fastPathSecondApproval, quickCheckpointAutoApply: body.quickCheckpointAutoApply, memoryBudgetTokens: body.memoryBudgetTokens });
		return { agentId: status.id, settings };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// The room's memory, entry by entry: list, add, edit, pin, move, close,
// delete to the archive, restore, and the room's own memory history.
registerMemoryEntryRoutes(app, {
	usableRoom: (idRaw) => getUsablePersistentAgentStatusForNormalUse(idRaw),
	errorReply: (reply, error) => persistentAgentNormalUseErrorReply(reply, error),
	history: (idRaw) => buildRoomMemoryHistory(idRaw),
});

// Taking back the room's latest memory save: the file from before it, put back
// byte for byte. Every other refusal lives in the undo itself; the room lock is
// checked here, where it is read, exactly as Memento checks it.
app.post("/api/persistent-agents/:id/memory/undo", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		// A scheduled background run is working this room now; putting an
		// earlier memory back underneath it is the one thing undo
		// must never do. The room's own web session is not in the way: undo is
		// offered from that session.
		const roomLockState = activeRoomLock(status.id);
		if (roomLockState?.surface === "scheduler") {
			const error = new Error(`This room is ${roomLockBusyStatus(roomLockState)}. Wait for that to finish, then undo.`);
			(error as any).statusCode = 409;
			(error as any).code = "memory_undo_room_busy";
			throw error;
		}
		return await withRoomSaveLock(status.id, () => saveWithOpenConversationCheck(status.id, () => undoMemorySave(status.id, (req.body as any)?.saveId)));
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// Per-room bash approval preference (workspace reshape slice e). The PUT is
// loopback-only at the remote route policy: a phone must never flip a room
// to run commands without asking.
app.get("/api/persistent-agents/:id/bash-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const settings = readPersistentRoomBashSettings(status.id);
		return { agentId: status.id, settings };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/bash-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		const settings = writePersistentRoomBashSettings(status.id, { autoApprove: body.autoApprove });
		return { agentId: status.id, settings };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// The model per room: what the room talks with and what does its memory work.
// GET answers both rows (stored, effective, and why they differ); PUT sets a
// row (a lock), clears it back to the default (null), or leaves it (absent).
// A lock that cannot run now is refused: the picker only offers what can.
// `effort` is the room's default reasoning effort for new conversations
// (null when it never chose); PUT sets it with a level, or leaves it (absent).
app.get("/api/persistent-agents/:id/models", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		return { agentId: status.id, models: roomModelsPayload(status.id), effort: readPersistentRoomEffortChoice(status.id) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/models", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const catalog = createRoomModelCatalog();
		const patch = parseRoomModelPatch(req.body ?? {}, catalog, { allowClear: true });
		const effort = (req.body as any)?.effort;
		if (effort !== undefined && !isRoomEffortLevel(effort)) return reply.code(400).send({ error: "effort must be a known reasoning effort level" });
		// The Memory pick, or the default it goes back to, must hold this room's memory.
		const memory = "memory" in patch ? patch.memory ?? resolveAiDefault("memory", catalog).chosen : null;
		if (memory) refuseMemoryModelTooSmall(memory, readPersistentRoomMaintenanceSettings(status.id).memoryBudgetTokens, catalog, 400, (model) => memoryModelTooSmallSentence(model, patch.memory === null ? "default" : "room"));
		if (Object.keys(patch).length > 0) writeRoomModels(status.id, patch);
		if (effort !== undefined) writePersistentRoomEffortChoice(status.id, effort);
		return { agentId: status.id, models: roomModelsPayload(status.id, catalog), effort: readPersistentRoomEffortChoice(status.id) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// Room settings → Instructions: the user's standing text for how the room
// works. GET reads it back with the cap the pane counts against; PUT stores
// the text (empty = none) and answers with what was stored. The write refuses
// a room held by a scheduled run (409) and text over the cap (400),
// each with the remedy in the sentence; a refusal leaves the previous text.
app.get("/api/persistent-agents/:id/instructions", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		return { agentId: status.id, ...getPersistentRoomInstructionsView(status.id), maxChars: ROOM_INSTRUCTIONS_MAX_CHARS };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

// The room's switch for the global instructions; the reply is the
// same view the GET returns, so the pane re-renders from one shape.
app.put("/api/persistent-agents/:id/instructions/global", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		return { agentId: status.id, ...savePersistentRoomGlobalInstructionsEnabled(status.id, body.enabled), maxChars: ROOM_INSTRUCTIONS_MAX_CHARS };
	} catch (e) {
		const statusCode = (e as any).statusCode;
		if (statusCode >= 500) {
			app.log.error({ err: e }, "persistent-room global-instructions switch failed");
			return reply.code(statusCode).send({ error: "Changing the switch failed because of a server error. The room's setting is unchanged. Check the server logs for details." });
		}
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/instructions", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		savePersistentRoomInstructions(status.id, body.text);
		return { agentId: status.id, ...getPersistentRoomInstructionsView(status.id), maxChars: ROOM_INSTRUCTIONS_MAX_CHARS };
	} catch (e) {
		const statusCode = (e as any).statusCode;
		if (statusCode >= 500) {
			app.log.error({ err: e }, "persistent-room instructions save failed");
			const removing = typeof (req.body as any)?.text === "string" && !(req.body as any).text.trim();
			return reply.code(statusCode).send({ error: `${removing ? "Removing" : "Saving"} the instructions failed because of a server error. The previous instructions are unchanged. Check the server logs for details.` });
		}
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.get("/api/persistent-agents/:id/skill-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const settings = readPersistentRoomSkillSettings(status.id);
		// `skills` is the mismatch view the settings panel (MR-5) renders:
		// ok | hash-mismatch | missing per enabled skill, plus the execution
		// approval state (none | approved | drifted) and, per skill, whether it
		// is execution-capable at all and which bundled files it carries.
		const skills = withSkillDisplayNames(computeSkillStatuses(settings.enabledSkills, skillLibraryFingerprint, (name) => resolveExecutableSkillFiles(name)?.filesSha256 ?? null));
		return {
			agentId: status.id,
			settings,
			skills: skills.map((skill) => {
				const executable = resolveExecutableSkillFiles(skill.name);
				return { ...skill, executable: executable !== null, bundledFiles: executable?.files ?? [], manualOnly: resolveLibrarySkillManifest(skill.name)?.disableModelInvocation === true };
			}),
		};
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/skill-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		const action = String(body.action ?? "");
		const name = String(body.name ?? "");
		if (action !== "enable" && action !== "disable" && action !== "approve-execution" && action !== "revoke-execution") {
			return reply.code(400).send({ error: "action must be 'enable', 'disable', 'approve-execution' or 'revoke-execution'" });
		}
		// Enable pins sha256(current library body), computed server-side by the
		// resolver — the client never supplies the hash. An unknown skill is a 4xx.
		// approve-execution pins the skill's whole-content files digest the same
		// way: server-computed, only for an already-enabled, execution-capable
		// user-store skill. revoke-execution withdraws it; the skill stays enabled.
		const result =
			action === "enable" ? enablePersistentRoomSkill(status.id, name, skillLibraryFingerprint)
			: action === "disable" ? disablePersistentRoomSkill(status.id, name)
			: action === "approve-execution" ? approvePersistentRoomSkillExecution(status.id, name, (n) => resolveExecutableSkillFiles(n)?.filesSha256 ?? null)
			: revokePersistentRoomSkillExecution(status.id, name);
		if (!result.ok) {
			const message =
				result.reason === "unknown-skill" ? `unknown skill: ${name}`
				: result.reason === "not-enabled" ? `skill not enabled for this room: ${name}`
				: result.reason === "no-files" ? `skill is not executable (not a user-library skill, or its content did not pass review): ${name}`
				: "invalid skill name";
			return reply.code(400).send({ error: message });
		}
		return { agentId: status.id, settings: result.settings, skills: withSkillDisplayNames(computeSkillStatuses(result.settings.enabledSkills, skillLibraryFingerprint, (n) => resolveExecutableSkillFiles(n)?.filesSha256 ?? null)) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.get("/api/persistent-agents/:id/mcp-connectors", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const settings = readPersistentRoomMcpSettings(status.id);
		const configuredNames = await listConfiguredMcpConnectorNames();
		// `granted` is the per-grant configured/missing view the room settings
		// panel renders next to the full configured list.
		return { agentId: status.id, settings, configuredConnectors: configuredNames, granted: computeGrantedConnectorStatuses(settings.grantedConnectors, configuredNames) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/mcp-connectors", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		const action = String(body.action ?? "");
		const name = String(body.name ?? "");
		if (action !== "grant" && action !== "revoke") return reply.code(400).send({ error: "action must be 'grant' or 'revoke'" });
		const configuredNames = await listConfiguredMcpConnectorNames();
		// Grant validates against the CURRENT configured list server-side, so a
		// grant can never name a connector that does not exist; revoke stays
		// permissive so dangling grants can always be cleaned up.
		const result = action === "grant"
			? grantPersistentRoomMcpConnector(status.id, name, configuredNames)
			: revokePersistentRoomMcpConnector(status.id, name);
		if (!result.ok) {
			return reply.code(400).send({ error: result.reason === "unknown-connector" ? `unknown connector: ${name}` : "invalid connector name" });
		}
		return { agentId: status.id, settings: result.settings, configuredConnectors: configuredNames, granted: computeGrantedConnectorStatuses(result.settings.grantedConnectors, configuredNames) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.get("/api/persistent-agents/:id/workspace-default", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		const policy = readPersistentRoomDefaultCapabilityPolicy(id);
		return {
			agentId: id,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE },
			policy: policy ? workspacePolicyViewFor(req, policy) : null,
			warnings: missingPersistentRoomWorkspaceRootWarnings(policy),
			// Looked up afresh on every read: the pane asks again when it opens.
			shellMissingNote: persistentRoomShellFound(policy?.roots[0]?.path ?? REPO_ROOT) ? null : PERSISTENT_ROOM_SHELL_MISSING_SENTENCE,
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.put("/api/persistent-agents/:id/workspace-default", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		const body = (req.body ?? {}) as any;
		// Legacy field: older clients still send a workspace mode. Garbage keeps
		// failing loudly, but the value itself no longer means anything — write
		// capability is derived from the tool selection.
		parsePersistentRoomWorkspaceMode(body.mode);
		const root = String(body.root ?? "").trim();
		let policy;
		if (root) {
			const workspaceAccessMode = normalizePersistentRoomWorkspaceAccessModeInput(body.workspaceAccessMode);
			const toolSelection = normalizePersistentRoomWorkspaceToolSelectionInput(body.toolSelection, { defaultToStandard: true, workspaceAccessMode });
			policy = createPersistentRoomDefaultCapabilityPolicy({
				agentId: id,
				repoRoot: REPO_ROOT,
				root,
				workspaceAccessMode,
				source: "manual",
				displayLabel: typeof body.displayLabel === "string" ? body.displayLabel : undefined,
				toolSelection,
				bashEnabled: body.bashEnabled === true,
			});
		} else {
			const existingDefault = readPersistentRoomDefaultCapabilityPolicy(id);
			if (!existingDefault) throw new Error("Choose a folder for this room.");
			const workspaceAccessMode = normalizePersistentRoomWorkspaceAccessModeInput(body.workspaceAccessMode, { defaultMode: existingDefault.workspaceAccessMode });
			const toolSelection = Object.prototype.hasOwnProperty.call(body, "toolSelection")
				? normalizePersistentRoomWorkspaceToolSelectionInput(body.toolSelection, { defaultToStandard: true, workspaceAccessMode })
				: undefined;
			policy = updatePersistentRoomCapabilityPolicyWorkspaceSettings(existingDefault, { workspaceAccessMode, ...(toolSelection ? { toolSelection } : {}), ...(Object.prototype.hasOwnProperty.call(body, "bashEnabled") ? { bashEnabled: body.bashEnabled === true } : {}) });
		}
		guardActiveThreadBeforeWorkspaceDefaultMutation(status, "Save");
		writePersistentRoomDefaultCapabilityPolicy(policy);
		return {
			agentId: id,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE },
			policy: workspacePolicyViewFor(req, policy),
			warnings: [],
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.delete("/api/persistent-agents/:id/workspace-default", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		guardActiveThreadBeforeWorkspaceDefaultMutation(status, "Clear");
		const result = deletePersistentRoomDefaultCapabilityPolicy(id);
		return {
			agentId: id,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE },
			policy: null,
			deleted: result.deleted,
			warnings: [],
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

app.post("/api/persistent-agents/:id/workspace/validate", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		const body = (req.body ?? {}) as any;
		const conversationId = String(body.conversationId ?? "").trim();
		if (!conversationId) throw new Error("conversationId is required");
		const workspaceAccessMode = normalizePersistentRoomWorkspaceAccessModeInput(body.workspaceAccessMode);
		// Legacy field: validated for compat with older clients, then discarded.
		parsePersistentRoomWorkspaceMode(body.mode);
		const source = parsePersistentRoomWorkspaceSource(body.source);
		const toolSelection = normalizePersistentRoomWorkspaceToolSelectionInput(body.toolSelection, { defaultToStandard: true, workspaceAccessMode });
		const warnings: string[] = [];
		const policy = createPersistentRoomCapabilityPolicy({
			agentId: id,
			conversationId,
			repoRoot: REPO_ROOT,
			root: String(body.root ?? ""),
			workspaceAccessMode,
			source,
			displayLabel: typeof body.displayLabel === "string" ? body.displayLabel : undefined,
			toolSelection,
			bashEnabled: body.bashEnabled === true,
		});
		writePersistentRoomCapabilityPolicy(policy);
		return {
			agentId: id,
			conversationId,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_POLICY_STORAGE_SOURCE },
			policy: workspacePolicyViewFor(req, policy),
			warnings,
		};
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

export { requestGetsLocalPaths };
