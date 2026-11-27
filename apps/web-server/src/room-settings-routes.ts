import type { FastifyRequest } from "fastify";
import { listWorkspaceForBrowser, readWorkspaceForBrowser } from "./persistent-room-workspace-tools.js";
import { runWorkspacePdfSnapshot, runWorkspaceSpreadsheetSnapshot, runWorkspaceWordSnapshot } from "./persistent-room-shelf-reading.js";
import { workspaceBoxFor } from "./room-live-sessions.js";
import { roomBoxComputer } from "./room-box/box-available.js";
import { fileToolsWait } from "./room-box/windows/folder-wait.js";
import { MAINTENANCE_DIAGNOSTICS_KEEP, MAINTENANCE_DIAGNOSTICS_DEFAULT_LIMIT, listMaintenanceDiagnostics, exportMaintenanceDiagnostics } from "./maintenance-diagnostics.js";
import { createPersistentAgentInstance, getPersistentAgentThread, saveWithOpenConversationCheck, getPersistentRoomInstructionsView, savePersistentRoomGlobalInstructionsEnabled, savePersistentRoomInstructions } from "./persistent-agents.js";
import { normalizePersistentRoomWorkspaceToolSelectionInput } from "./persistent-room-tool-policy.js";
import { PersistentRoomWorkspacePolicyError, assertPersistentRoomWorkspaceDefaultMutable, type PersistentRoomCapabilityPolicy, persistentRoomCapabilityPolicyView, readPersistentRoomCapabilityPolicy, PERSISTENT_ROOM_WORKSPACE_POLICY_STORAGE_SOURCE, deletePersistentRoomCapabilityPolicy, readPersistentRoomDefaultCapabilityPolicy, PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE, missingPersistentRoomWorkspaceRootWarnings, normalizePersistentRoomWorkspaceAccessModeInput, createPersistentRoomDefaultCapabilityPolicy, updatePersistentRoomCapabilityPolicyWorkspaceSettings, writePersistentRoomDefaultCapabilityPolicy, deletePersistentRoomDefaultCapabilityPolicy, createPersistentRoomCapabilityPolicy, writePersistentRoomCapabilityPolicy, persistentRoomCommandsStartOn, PERSISTENT_ROOM_WORKSPACE_DEFAULT_CONVERSATION_ID, resolvePersistentRoomEffectiveWorkspacePolicy } from "./persistent-room-workspace-policy.js";
import { readPersistentRoomMaintenanceSettings, writePersistentRoomMaintenanceSettings } from "./persistent-room-maintenance-settings.js";
import { settleMemoryBudget } from "./memory-entries-store.js";
import { readPersistentRoomBashSettings, unprotectedRoomOnAuto, writePersistentRoomBashSettings } from "./persistent-room-bash-settings.js";
import { type PersistentRoomProtection, type PersistentRoomProtectionCause, persistentRoomProtection, persistentRoomWindowsBoxed, writePersistentRoomProtection } from "./persistent-room-protection.js";
import { isRoomEffortLevel, readPersistentRoomEffortChoice, writePersistentRoomEffortChoice } from "./persistent-room-effort-settings.js";
import { persistentRoomShellFound, PERSISTENT_ROOM_SHELL_MISSING_SENTENCE } from "./persistent-room-shell-missing.js";
import { createRoomModelCatalog, resolveAiDefault, memoryModelTooSmallSentence, writeRoomModels } from "./room-models.js";
import { ROOM_INSTRUCTIONS_MAX_CHARS } from "./persistent-room-instructions.js";
import { readPersistentRoomSkillSettings, computeSkillStatuses, enablePersistentRoomSkill, disablePersistentRoomSkill } from "./persistent-room-skill-settings.js";
import { listConfiguredMcpConnectorDisplayNames, listConfiguredMcpConnectorNames } from "./mcp-status.js";
import { allowedToolsOf, readPersistentRoomMcpSettings, computeGrantedConnectorStatuses, forgetPersistentRoomMcpTool, grantPersistentRoomMcpConnector, type PersistentRoomMcpSettings, revokePersistentRoomMcpConnector, roomUsableMcpConnectors } from "./persistent-room-mcp-settings.js";
import { connectorToolWords } from "../../../pi-package/extensions/mcp/room-scope.js";
import { readConnectorToolChoices, toolChoiceIn } from "./connector-tool-choices.js";
import { buildRoomMemoryHistory } from "./memory-api.js";
import { registerMemoryEntryRoutes } from "./memory-entries-api.js";
import { undoMemorySave } from "./memory-undo.js";
import { withRoomSaveLock } from "./memory-commit.js";
import { isSharedServer } from "./server-hooks.js";
import { skillFilesReach } from "./persistent-room-skill-tool.js";
import { activeRoomLock, REPO_ROOT, roomLockBusyStatus } from "./server-install-root.js";
import { app, PORT, WEB_UI_DIST } from "./server-app.js";
import { getUsablePersistentAgentStatusForNormalUse, persistentAgentNormalUseErrorReply } from "./room-status.js";
import { parseRoomModelPatch, roomModelsPayload } from "./ai-models.js";
import { memoryBudgetRaiseRefusal, refuseMemoryBudgetRaise, refuseMemoryModelTooSmall } from "./ai-profile-models.js";
import { resolveLibrarySkillManifest, skillLibraryFingerprint, withSkillDisplayNames } from "./skills-library.js";
import { addAlsoAllowedFolder, type AlsoAllowedEntry, readAlsoAllowed, removeAlsoAllowedEntry, removedAlsoAllowedEntry, restoreAlsoAllowedEntry } from "./room-box/also-allowed.js";
import { CHANGE_SAVE_FAILED, FOLDER_ALREADY_USED, FOLDER_PICK_REFUSED, folderRefusedLine, NO_FOLDER_WINDOW, pathHoldsHidden, PROTECTION_UNAVAILABLE, PROTECTION_UNAVAILABLE_COMPUTER, PROTECTION_UNAVAILABLE_FOLDER } from "./room-box/card-text.js";
import { folderGrantable, roomFolderRefusal, soundFolders, writeEntries } from "./room-box/folder-offer.js";
import { chooseFolderForRoom, undoAllowChanges } from "./room-box/folder-question.js";
import { isInside } from "./room-box/box-closed.js";
import { chooseLocalFolder, folderPickerPrompt, type LocalFolderPickerResult } from "./local-folder-picker.js";
import { roomFence } from "./room-files.js";
import { ARTIFACT_SECURITY_HEADERS, isLocalSystemChooseFolderRequest, remoteMode } from "./request-checks.js";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFile, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { connectorStartRefusal, roomWritePlaces } from "./connector-start-check.js";

type WorkspaceAssociation = { executable: string; workingDirectory: string; args: string[]; identity: string; current: () => boolean };

async function dispatchWorkspaceAssociation(association: WorkspaceAssociation, signal: AbortSignal): Promise<"accepted" | "open_failed" | "open_timeout" | "opener_unavailable"> {
	if (signal.aborted) return "open_failed";
	return new Promise((resolve) => {
		let child: ReturnType<typeof spawn>;
		const env: NodeJS.ProcessEnv = { PATH: "/usr/bin:/bin", HOME: process.env.HOME || os.homedir() };
		for (const key of ["DISPLAY", "WAYLAND_DISPLAY", "XDG_RUNTIME_DIR", "DBUS_SESSION_BUS_ADDRESS", "LANG", "LC_ALL"]) if (process.env[key]) env[key] = process.env[key];
		try { child = spawn(association.executable, association.args, { cwd: association.workingDirectory, env, shell: false, stdio: "ignore", windowsHide: true }); }
		catch (error) { resolve(["ENOENT", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? "") ? "opener_unavailable" : "open_failed"); return; }
		let done = false;
		const finish = (result: "accepted" | "open_failed" | "open_timeout" | "opener_unavailable") => {
			if (done) return;
			done = true; clearTimeout(timer); signal.removeEventListener("abort", abort);
			if (result !== "accepted") { try { child.kill(); } catch { /* Already ended. */ } }
			else child.unref();
			resolve(result);
		};
		const abort = () => finish("open_failed");
		const timer = setTimeout(() => finish("open_timeout"), 10_000);
		signal.addEventListener("abort", abort, { once: true });
		child.once("error", (error) => finish(["ENOENT", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? "") ? "opener_unavailable" : "open_failed"));
		child.once("spawn", () => finish("accepted"));
		if (signal.aborted) abort();
	});
}

/** Only unambiguous, direct Linux desktop entries can be bound to a spawn. */
async function workspaceAssociation(file: string): Promise<WorkspaceAssociation | null> {
	if (process.platform === "darwin") {
		try {
			const koffi = (await import("koffi")).default;
			const core = koffi.load("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation");
			const services = koffi.load("/System/Library/Frameworks/CoreServices.framework/CoreServices");
			const urlForPath = core.func("void *CFURLCreateFromFileSystemRepresentation(void *allocator, const uint8_t *bytes, intptr_t length, uint8_t isDirectory)");
			const defaultApp = services.func("void *LSCopyDefaultApplicationURLForURL(void *url, uint32_t roles, void *error)");
			const bundleForUrl = core.func("void *CFBundleCreate(void *allocator, void *url)");
			const bundleExecutable = core.func("void *CFBundleCopyExecutableURL(void *bundle)");
			const pathForUrl = core.func("uint8_t CFURLGetFileSystemRepresentation(void *url, uint8_t resolve, _Out_ uint8_t *buffer, intptr_t length)");
			const release = core.func("void CFRelease(void *value)");
			const bytes = Buffer.from(file), url = urlForPath(null, bytes, bytes.length, 0);
			if (!url) return null;
			let app: unknown, bundle: unknown, executable: unknown;
			try {
				app = defaultApp(url, 0xffffffff, null); if (!app) return null;
				bundle = bundleForUrl(null, app); if (!bundle) return null;
				executable = bundleExecutable(bundle); if (!executable) return null;
				const resolved = Buffer.alloc(4096);
				if (!pathForUrl(executable, 1, resolved, resolved.length)) return null;
				// shortcut: the Launch Services working directory is unbound; refuse until it can be verified.
				return null;
			} finally { if (executable) release(executable); if (bundle) release(bundle); if (app) release(app); release(url); }
		} catch { return null; }
	}
	if (process.platform === "win32") {
		try {
			const koffi = (await import("koffi")).default;
			const kernel = koffi.load("kernel32.dll");
			const systemDirectory = kernel.func("uint32_t __stdcall GetSystemDirectoryW(_Out_ char16_t *buffer, uint32_t size)");
			const directoryBuffer = Buffer.alloc(65_536), directoryLength = systemDirectory(directoryBuffer, 32_768);
			if (!Number.isInteger(directoryLength) || directoryLength < 1 || directoryLength >= 32_768) return null;
			const directory = directoryBuffer.toString("utf16le", 0, directoryLength * 2);
			if (!/^[A-Za-z]:\\/.test(directory) || !path.win32.isAbsolute(directory)) return null;
			const library = koffi.load(path.win32.join(directory, "shlwapi.dll"));
			const association = library.func("int32_t __stdcall AssocQueryStringW(uint32_t flags, uint32_t kind, const char16_t *assoc, const char16_t *extra, _Out_ char16_t *out, _Inout_ uint32_t *length)");
			const extension = path.win32.extname(file);
			if (!extension) return null;
			for (const kind of [1, 2]) {
				const output = Buffer.alloc(65_536), length = [32_768];
				if (association(0, kind, extension, "open", output, length) !== 0 || !Number.isInteger(length[0]) || length[0] < 2 || length[0] > 32_768 || output.readUInt16LE((length[0] - 1) * 2) !== 0) return null;
			}
			// shortcut: the effective association does not bind lpDirectory here; refuse until it can be verified.
			return null;
		} catch { return null; }
	}
	if (process.platform !== "linux") return null;
	try {
		const helper = fs.realpathSync("/usr/bin/xdg-mime");
		const places = await roomWritePlaces();
		if (connectorStartRefusal({ command: helper, args: [], cwd: "/" }, places)) return null;
		const env: NodeJS.ProcessEnv = { PATH: "/usr/bin:/bin", HOME: process.env.HOME || os.homedir() };
		for (const key of ["XDG_CONFIG_HOME", "XDG_CONFIG_DIRS", "XDG_DATA_HOME", "XDG_DATA_DIRS", "XDG_CURRENT_DESKTOP", "DESKTOP_SESSION", "DISPLAY", "WAYLAND_DISPLAY", "DBUS_SESSION_BUS_ADDRESS"]) if (process.env[key]) env[key] = process.env[key];
		const query = (args: string[]) => new Promise<string>((resolve, reject) => execFile(helper, args, { cwd: "/", env, timeout: 5000, maxBuffer: 4096, encoding: "utf8" }, (error, stdout) => error ? reject(error) : resolve(stdout.trim())));
		const mime = await query(["query", "filetype", file]);
		if (!/^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/.test(mime)) return null;
		const id = await query(["query", "default", mime]);
		// Hyphenated desktop IDs can denote nested application paths; refuse that ambiguity.
		if (!/^[A-Za-z0-9_.]+\.desktop$/.test(id)) return null;
		const dataHome = process.env.XDG_DATA_HOME || path.join(env.HOME!, ".local", "share");
		const dataDirs = (process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share").split(":");
		if (![dataHome, ...dataDirs].every((dir) => path.isAbsolute(dir))) return null;
		const candidates = [...new Set([dataHome, ...dataDirs].map((dir) => path.join(dir, "applications", id)))].filter((candidate) => {
			try { fs.lstatSync(candidate); return true; }
			catch (error) { if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return false; throw error; }
		});
		if (candidates.length !== 1) return null;
		const desktop = fs.realpathSync(candidates[0]);
		const desktopFd = fs.openSync(desktop, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
		let desktopStat: fs.BigIntStats, source: string;
		try {
			desktopStat = fs.fstatSync(desktopFd, { bigint: true });
			if (!desktopStat.isFile() || desktopStat.size > 65_536n) return null;
			const data = Buffer.alloc(Number(desktopStat.size));
			let offset = 0;
			while (offset < data.length) { const count = fs.readSync(desktopFd, data, offset, data.length - offset, offset); if (!count) return null; offset += count; }
			const after = fs.fstatSync(desktopFd, { bigint: true });
			if (desktopStat.dev !== after.dev || desktopStat.ino !== after.ino || desktopStat.size !== after.size || desktopStat.mtimeNs !== after.mtimeNs || desktopStat.ctimeNs !== after.ctimeNs) return null;
			source = data.toString("utf8");
			if (!Buffer.from(source, "utf8").equals(data)) return null;
		} finally { fs.closeSync(desktopFd); }
		let section = "", fields: Record<string, string> = {};
		for (const raw of source.split(/\r?\n/)) {
			const line = raw.trim();
			if (!line || line.startsWith("#")) continue;
			if (line.startsWith("[") && line.endsWith("]")) { section = line; continue; }
			if (section !== "[Desktop Entry]") continue;
			const separator = line.indexOf("=");
			if (separator <= 0) return null;
			const key = line.slice(0, separator), value = line.slice(separator + 1);
			if (Object.prototype.hasOwnProperty.call(fields, key)) return null;
			fields[key] = value;
		}
		if (fields.Type !== "Application" || (fields.Terminal && fields.Terminal !== "false") || (fields.DBusActivatable && fields.DBusActivatable !== "false") || (fields.Hidden && fields.Hidden !== "false") || fields.TryExec || fields.OnlyShowIn || fields.NotShowIn || !fields.MimeType?.split(";").includes(mime) || !fields.Exec || !fields.Path || !path.isAbsolute(fields.Path) || /[\\%]/.test(fields.Path)) return null;
		const parts = fields.Exec.split(/ +/);
		const placeholders = parts.slice(1).filter((part) => part === "%f" || part === "%u");
		if (parts.length < 2 || placeholders.length !== 1 || !path.isAbsolute(parts[0]) || !/^[A-Za-z0-9_./+:-]+$/.test(parts[0]) || parts.slice(1).some((part) => !["%f", "%u"].includes(part) && !/^[A-Za-z0-9_./+:-]+$/.test(part))) return null;
		const executable = fs.realpathSync(parts[0]), workingDirectory = fs.realpathSync(fields.Path);
		const executableStat = fs.statSync(executable, { bigint: true }), cwdStat = fs.statSync(workingDirectory, { bigint: true });
		if (!executableStat.isFile() || !cwdStat.isDirectory()) return null;
		fs.accessSync(executable, fs.constants.X_OK);
		const base = path.basename(executable).toLowerCase();
		if (/^(?:env|busybox|sh|bash|dash|zsh|fish|node|nodejs|bun|deno|python[0-9.]*|perl|ruby|php|java|xdg-open|gio|flatpak|snap|wine|ld-linux.*)$/.test(base)) return null;
		const fd = fs.openSync(executable, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
		const magic = Buffer.alloc(4);
		try {
			const opened = fs.fstatSync(fd, { bigint: true });
			if (opened.dev !== executableStat.dev || opened.ino !== executableStat.ino || opened.size !== executableStat.size || opened.mtimeNs !== executableStat.mtimeNs || opened.ctimeNs !== executableStat.ctimeNs || fs.readSync(fd, magic, 0, 4, 0) !== 4 || !magic.equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) return null;
			const after = fs.fstatSync(fd, { bigint: true });
			if (opened.dev !== after.dev || opened.ino !== after.ino || opened.size !== after.size || opened.mtimeNs !== after.mtimeNs || opened.ctimeNs !== after.ctimeNs) return null;
		} finally { fs.closeSync(fd); }
		const argument = placeholders[0] === "%u" ? pathToFileURL(file).href : file;
		const args = parts.slice(1).map((part) => part === "%f" || part === "%u" ? argument : part);
		if (args.filter((part) => part === argument || part === file).length !== 1 || connectorStartRefusal({ command: executable, args, cwd: workingDirectory }, places)) return null;
		const stamp = (stat: fs.BigIntStats) => [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].map(String);
		const same = (a: fs.BigIntStats, b: fs.BigIntStats) => JSON.stringify(stamp(a)) === JSON.stringify(stamp(b));
		const current = () => {
			try {
				return fs.realpathSync(candidates[0]) === desktop && fs.realpathSync(parts[0]) === executable && fs.realpathSync(fields.Path) === workingDirectory
					&& same(fs.statSync(desktop, { bigint: true }), desktopStat) && same(fs.statSync(executable, { bigint: true }), executableStat) && same(fs.statSync(workingDirectory, { bigint: true }), cwdStat);
			} catch { return false; }
		};
		return { executable, workingDirectory, args, current, identity: JSON.stringify({ mime, id, desktop, source, desktopStat: stamp(desktopStat), executableStat: stamp(executableStat), cwdStat: stamp(cwdStat) }) };
	} catch { return null; }
}

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
		return { agentId: status.id, settings, ...protectionView(status.id) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

app.put("/api/persistent-agents/:id/bash-settings", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const body = (req.body ?? {}) as any;
		// The protection the chip last read: a yes is kept for the state the person saw, or refused. `free`: the chip's Auto in a protected room, beside its yes.
		const settings = writePersistentRoomBashSettings(status.id, { autoApprove: body.autoApprove, free: body.free, protection: body.protection });
		return { agentId: status.id, settings, ...protectionView(status.id) };
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
		// `skills` is the view the settings panel renders: ok | unreadable per
		// enabled skill still in the room (a deleted one has no row), and whether
		// its author marked it for picking by hand only.
		const skills = withSkillDisplayNames(computeSkillStatuses(settings.enabledSkills, skillLibraryFingerprint));
		return {
			agentId: status.id,
			settings,
			skills: skills.map((skill) => ({ ...skill, manualOnly: resolveLibrarySkillManifest(skill.name)?.disableModelInvocation === true })),
			// What the room's skills can do with their files, as the model is told; the room's own policy, which every conversation runs on.
			skillFiles: skillFilesReach(resolvePersistentRoomEffectiveWorkspacePolicy(status.id, PERSISTENT_ROOM_WORKSPACE_DEFAULT_CONVERSATION_ID), isSharedServer()),
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
		if (action !== "enable" && action !== "disable") {
			return reply.code(400).send({ error: "action must be 'enable' or 'disable'" });
		}
		// Enable reads the skill's identity server-side through the resolver; the
		// client never supplies it. An unknown skill is a 4xx.
		const result = action === "enable" ? enablePersistentRoomSkill(status.id, name, skillLibraryFingerprint) : disablePersistentRoomSkill(status.id, name);
		if (!result.ok) {
			return reply.code(400).send({ error: result.reason === "unknown-skill" ? `unknown skill: ${name}` : "invalid skill name" });
		}
		return { agentId: status.id, settings: result.settings, skills: withSkillDisplayNames(computeSkillStatuses(result.settings.enabledSkills, skillLibraryFingerprint)) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

/**
 * A room's connectors as the settings pane reads them. `granted` is the
 * per-grant configured/missing view the pane renders next to the configured
 * list; `allowedTools`, the old room yeses that still let a tool of an enabled
 * connector run without asking, by their own name and as people read it: a
 * tool the person has picked a choice for is left out, as the gate ignores its
 * yes. Never on a shared server, where no yes is kept. What a yes is pinned to stays on the server. A
 * configured connector the room may not use is in none of them, its stored
 * grant included, which stays on disk unused. `asksNothing`: the room is on
 * Auto without protection now, so no tool asks first; an unreadable setting
 * reads as no.
 */
function asksNothingNow(agentId: string): boolean {
	try {
		return unprotectedRoomOnAuto(agentId, PERSISTENT_ROOM_WORKSPACE_DEFAULT_CONVERSATION_ID);
	} catch {
		return false;
	}
}

async function roomConnectorsAnswer(agentId: string, { allowedTools, ...stored }: PersistentRoomMcpSettings, configuredNames: string[]) {
	const usable = roomUsableMcpConnectors(agentId, configuredNames);
	const settings = { ...stored, grantedConnectors: stored.grantedConnectors.filter((name) => usable.includes(name) || !configuredNames.includes(name)) };
	const choices = isSharedServer() ? null : readConnectorToolChoices();
	const left = (name: string) => allowedToolsOf(allowedTools, name).filter(({ tool }) => !choices?.readable || toolChoiceIn(choices, name, tool) === null);
	const allowed = isSharedServer() ? {} : { allowedTools: Object.fromEntries(settings.grantedConnectors.filter((name) => left(name).length > 0).map((name) => [name, left(name).map(({ tool }) => ({ tool, shown: connectorToolWords(tool) }))])) };
	const displayNames = Object.fromEntries(Object.entries(await listConfiguredMcpConnectorDisplayNames()).filter(([name]) => usable.includes(name)));
	return { agentId, settings, configuredConnectors: usable, displayNames, granted: computeGrantedConnectorStatuses(settings.grantedConnectors, configuredNames), ...allowed, ...(asksNothingNow(agentId) ? { asksNothing: true } : {}) };
}

app.get("/api/persistent-agents/:id/mcp-connectors", async (req, reply) => {
	const idRaw = String((req.params as any).id ?? "").trim();
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		return await roomConnectorsAnswer(status.id, readPersistentRoomMcpSettings(status.id), await listConfiguredMcpConnectorNames());
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
		// forget-tool takes back a tool's yes; a shared server keeps none, so there it is no action at all.
		const forget = action === "forget-tool" && !isSharedServer();
		if (action !== "grant" && action !== "revoke" && !forget) return reply.code(400).send({ error: "action must be 'grant' or 'revoke'" });
		const configuredNames = await listConfiguredMcpConnectorNames();
		// Grant validates against the CURRENT configured list server-side, so a
		// grant can never name a connector that does not exist; revoke and
		// forget-tool stay permissive so dangling entries can always be cleaned up.
		const result = forget
			? forgetPersistentRoomMcpTool(status.id, name, String(body.tool ?? ""))
			: action === "grant"
				? grantPersistentRoomMcpConnector(status.id, name, configuredNames)
				: revokePersistentRoomMcpConnector(status.id, name);
		if (!result.ok) {
			return reply.code(400).send({ error: result.reason === "unknown-connector" ? `unknown connector: ${name}` : "invalid connector name" });
		}
		return await roomConnectorsAnswer(status.id, result.settings, configuredNames);
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
	}
});

/** The room's own folder by its real path, and whether it can change files: what the list is judged against. */
function roomReachOf(roomId: string): { folder: string; canChangeFiles: boolean } | null {
	const policy = readPersistentRoomDefaultCapabilityPolicy(roomId);
	const room = policy ? roomFence(policy, () => []).room : null;
	return room ? { folder: room.path, canChangeFiles: room.access === "write" } : null;
}

const folderName = (folder: string): string => path.basename(folder) || folder;

/**
 * The list as the pane draws it. A phone gets names, never a path. A Can read
 * folder says whether Allow changes can widen it, by the same check a pick has.
 * A folder the room's own folder makes unusable isn't drawn: the room's list
 * keeps it for a conversation, or a Location, that can use it.
 */
function alsoAllowedView(req: FastifyRequest, roomId: string) {
	const withPaths = requestGetsLocalPaths(req);
	const room = roomReachOf(roomId);
	const listed = readAlsoAllowed(roomId);
	const folders = room ? soundFolders(listed.folders, room.folder) : listed.folders;
	const sites = listed.sites;
	const writable = room ? [room.folder, ...writeEntries(folders)] : [];
	return {
		folders: folders.map((entry) => ({
			name: folderName(entry.path),
			access: entry.access,
			...(withPaths ? { path: entry.path } : {}),
			canAllowChanges: entry.access === "read" && room !== null && room.canChangeFiles && folderGrantable(entry.path, "write", writable, room.folder),
		})),
		sites: sites.map((site) => ({ host: site.host, port: site.port })),
	};
}

/** A list change that widens what the room can do waits while it answers, as a Save does. */
function refuseWhileAnswering(roomId: string): void {
	assertPersistentRoomWorkspaceDefaultMutable(getUsablePersistentAgentStatusForNormalUse(roomId).activeThread, "Save");
}

function listError(statusCode: number, code: string, error: string): Error {
	return Object.assign(new Error(error), { statusCode, code });
}

/** Names one entry of the list from a request body: a folder by its path, or a site by host and port. */
function namedEntry(body: unknown): { path: string } | { host: string; port: number } {
	const { path: folder, host, port } = (body ?? {}) as { path?: unknown; host?: unknown; port?: unknown };
	if (typeof folder === "string" && folder !== "") return { path: folder };
	if (typeof host === "string" && host !== "" && Number.isInteger(port)) return { host, port: port as number };
	throw listError(400, "entry_required", "Name a folder by its path, or a site by its host and port.");
}

app.get("/api/persistent-agents/:id/also-allowed", async (req, reply) => {
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(String((req.params as { id: string }).id ?? ""));
		return alsoAllowedView(req, status.id);
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

// Add a folder…: the computer's own window, and the one way a pick goes on the
// list. A path in the body is never read. A new folder starts at Can read.
app.post("/api/persistent-agents/:id/also-allowed/folders", async (req, reply) => {
	// The window opens only for the app's own page, as the room's folder's does.
	if (!isLocalSystemChooseFolderRequest(req)) return reply.code(403).send({ error: "Folder chooser is only available from the local Exxperts app.", code: "local_request_required" });
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(String((req.params as { id: string }).id ?? ""));
		const roomId = status.id;
		refuseWhileAnswering(roomId);
		const room = roomReachOf(roomId);
		if (!room) throw listError(400, "missing_root", "Choose a folder for this room.");
		// The window closes when the page goes before it answers.
		const window = new AbortController();
		reply.raw.on("close", () => {
			if (!reply.raw.writableFinished) window.abort();
		});
		let windowFailed: LocalFolderPickerResult | null = null;
		const outcome = await chooseFolderForRoom({
			roomId,
			room: { folder: room.folder, canChangeFiles: room.canChangeFiles, commands: "unavailable", boxed: false },
			access: "read",
			pickFolder: async (signal) => {
				const picked = await chooseLocalFolder({ prompt: folderPickerPrompt("room-asks"), timeoutMs: null, signal });
				if (!picked.ok) windowFailed = picked;
				// The room may have started answering while the window was open.
				else if (!picked.cancelled) refuseWhileAnswering(roomId);
				return picked;
			},
			signal: window.signal,
			// Again in the same run as the write: the room may have started answering during the look.
			beforeGive: () => refuseWhileAnswering(roomId),
		});
		const failed = windowFailed as LocalFolderPickerResult | null;
		if (failed && !failed.ok && failed.code !== "folder_chooser_stopped") return { state: "refused", line: failed.supported ? CHANGE_SAVE_FAILED : NO_FOLDER_WINDOW, list: alsoAllowedView(req, roomId) };
		if ("line" in outcome) return { state: "refused", line: outcome.line, list: alsoAllowedView(req, roomId) };
		if ("done" in outcome && outcome.done.state === "already") return { state: "already", line: FOLDER_ALREADY_USED, list: alsoAllowedView(req, roomId) };
		if ("done" in outcome && outcome.done.state === "picked") return { state: "added", name: outcome.done.name, list: alsoAllowedView(req, roomId) };
		return { state: "unchanged", list: alsoAllowedView(req, roomId) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

// Allow changes, and the button back to Can read. Only a listed folder moves.
// Back to Can read only narrows, so it works while the room answers, from the next command and the next file call.
app.post("/api/persistent-agents/:id/also-allowed/access", async (req, reply) => {
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(String((req.params as { id: string }).id ?? ""));
		const roomId = status.id;
		const { path: folder, access } = (req.body ?? {}) as { path?: unknown; access?: unknown };
		if (typeof folder !== "string" || (access !== "read" && access !== "write")) throw listError(400, "entry_required", "Name a listed folder and read or write.");
		const listed = readAlsoAllowed(roomId).folders;
		const entry = listed.find((each) => each.path === folder);
		if (!entry) throw listError(404, "not_listed", "That folder isn't on this room's list.");
		if (access === "read") {
			undoAllowChanges(roomId, folder);
			return { list: alsoAllowedView(req, roomId) };
		}
		refuseWhileAnswering(roomId);
		const room = roomReachOf(roomId);
		if (!room?.canChangeFiles || !folderGrantable(folder, "write", [room.folder, ...writeEntries(listed)], room.folder)) throw listError(400, "folder_refused", "This room can't change files in that folder.");
		addAlsoAllowedFolder(roomId, folder, "write");
		return { list: alsoAllowedView(req, roomId) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

// The cross: a folder or a site leaves the list and is kept for Undo. It only
// narrows, so it works while the room answers, from the next command and the next file call.
app.post("/api/persistent-agents/:id/also-allowed/remove", async (req, reply) => {
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(String((req.params as { id: string }).id ?? ""));
		const roomId = status.id;
		const removed = removeAlsoAllowedEntry(roomId, namedEntry(req.body));
		if (!removed) throw listError(404, "not_listed", "That isn't on this room's list.");
		// A folder another row still lets the room read: the pane says which.
		const room = roomReachOf(roomId);
		const through = removed.kind === "folder" && room ? soundFolders(readAlsoAllowed(roomId).folders, room.folder).find((entry) => isInside(removed.path, entry.path)) : undefined;
		return { removed: entryView(removed), ...(through ? { stillReadThrough: folderName(through.path) } : {}), list: alsoAllowedView(req, roomId) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

// Undo after the cross: puts back only what Remove kept, with the access it had.
app.post("/api/persistent-agents/:id/also-allowed/restore", async (req, reply) => {
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(String((req.params as { id: string }).id ?? ""));
		const roomId = status.id;
		refuseWhileAnswering(roomId);
		const kept = removedAlsoAllowedEntry(roomId, namedEntry(req.body));
		if (!kept) throw listError(404, "not_removed", "There's nothing to put back.");
		restoreAlsoAllowedEntry(roomId, kept);
		return { list: alsoAllowedView(req, roomId) };
	} catch (e) {
		const payload = persistentRoomWorkspaceErrorPayload(e);
		return reply.code(payload.statusCode).send(payload.body);
	}
});

/** A room's own folder is judged as a folder on its list is: one no room may use is refused before it is saved. */
function refuseUnusableRoomFolder(policy: PersistentRoomCapabilityPolicy): void {
	const root = policy.roots[0];
	const refusal = root ? roomFolderRefusal(root.realpath) : null;
	if (!root || !refusal) return;
	// A name with a hidden character isn't drawn: the plain line names none.
	const line = pathHoldsHidden(root.realpath) ? FOLDER_PICK_REFUSED : folderRefusedLine(refusal, path.basename(root.realpath) || root.realpath, FOLDER_PICK_REFUSED);
	throw Object.assign(new Error(line), { statusCode: 400, code: "folder_refused" });
}

function entryView(entry: AlsoAllowedEntry) {
	return entry.kind === "folder" ? { kind: "folder", name: folderName(entry.path), path: entry.path, access: entry.access } : { kind: "site", host: entry.host, port: entry.port };
}

app.get("/api/persistent-agents/:id/workspace-files", async (req, reply) => {
	reply.headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	const query = (req.query ?? {}) as Record<string, unknown>;
	if (typeof query.conversationId !== "string" || !query.conversationId.trim() || (query.path !== undefined && typeof query.path !== "string")) {
		return reply.code(400).send({ code: "invalid_request", error: "Invalid workspace request." });
	}
	const requestedPath = (query.path as string | undefined ?? "").replace(/\\/g, "/");
	if (requestedPath && (requestedPath.startsWith("~") || requestedPath.includes("\0") || requestedPath.includes(":") || requestedPath.split("/").some((part) => !part || part.startsWith(".")))) {
		return reply.code(400).send({ code: "invalid_path", error: "Invalid workspace path." });
	}
	try {
		const { id } = getUsablePersistentAgentStatusForNormalUse(String((req.params as any).id ?? "").trim());
		const conversationId = query.conversationId.trim();
		if (!getPersistentAgentThread(id, conversationId)) return reply.code(404).send({ code: "conversation_not_found", error: "Conversation not found." });
		const effectivePolicy = resolvePersistentRoomEffectiveWorkspacePolicy(id, conversationId);
		if (effectivePolicy.source === "none") return { agentId: id, conversationId, root: null, path: requestedPath, entries: [] };
		if (effectivePolicy.policy && effectivePolicy.workspaceToolsEnabled && effectivePolicy.policy.modes.read && effectivePolicy.allowedToolNames.includes("read")) {
			const initialPolicy = JSON.stringify(effectivePolicy.policy);
			const policyNow = () => {
				try {
					getUsablePersistentAgentStatusForNormalUse(id);
					if (!getPersistentAgentThread(id, conversationId)) throw new Error("Conversation unavailable.");
					const current = resolvePersistentRoomEffectiveWorkspacePolicy(id, conversationId);
					if (current.source !== effectivePolicy.source || !current.policy || !current.workspaceToolsEnabled || !current.policy.modes.read || !current.allowedToolNames.includes("read") || current.fingerprint.value !== effectivePolicy.fingerprint.value || JSON.stringify(current.policy) !== initialPolicy) throw new Error("Workspace changed.");
					return current.policy;
				} catch { throw Object.assign(new Error("Workspace changed."), { code: "grant_changed" }); }
			};
			const binding = () => {
				if (effectivePolicy.source === "room-files" || roomBoxComputer() !== "mac") return undefined;
				const selected = workspaceBoxFor(id, conversationId);
				if (!selected) throw Object.assign(new Error("Workspace box unavailable."), { code: "box_failed" });
				return selected;
			};
			if (roomBoxComputer() === "unknown") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
			const controller = new AbortController();
			const disconnected = () => controller.abort();
			reply.raw.once("close", disconnected);
			try {
				const entries = await listWorkspaceForBrowser(policyNow, requestedPath, fileToolsWait(), binding, controller.signal);
				const root = effectivePolicy.policy.roots[0];
				return { agentId: id, conversationId, root: { displayLabel: root.displayLabel, basename: root.basename }, path: requestedPath, entries };
			} finally { reply.raw.removeListener("close", disconnected); }
		}
		return reply.code(403).send({ code: "workspace_read_forbidden", error: "Workspace access is forbidden." });
	} catch (error) {
		if ((error as { code?: string })?.code === "workspace_unavailable") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		if ((error as { code?: string })?.code === "grant_changed") return reply.code(403).send({ code: "grant_changed", error: "Workspace access changed." });
		if ((error as { code?: string })?.code === "file_changed") return reply.code(409).send({ code: "file_changed", error: "Workspace changed while it was read." });
		if ((error as { code?: string })?.code === "box_failed") return reply.code(503).send({ code: "box_failed", error: "Workspace is unavailable." });
		if (["folder_moved", "not_readable", "not_permitted"].includes((error as { code?: string })?.code ?? "")) return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		if (["link", "folder_refused", "box_refused"].includes((error as { code?: string })?.code ?? "")) return reply.code(403).send({ code: "blocked_by_policy", error: "Workspace access is forbidden." });
		if (["outside_workspace", "blocked_by_policy"].includes((error as { code?: string })?.code ?? "")) return reply.code(403).send({ code: (error as { code: string }).code, error: "Workspace access is forbidden." });
		if (["invalid_name", "not_directory", "file_not_found"].includes((error as { code?: string })?.code ?? "")) return reply.code(400).send({ code: "invalid_path", error: "Invalid workspace path." });
		return reply.code(404).send({ code: "room_not_found", error: "Room not found." });
	}
});

app.post("/api/persistent-agents/:id/workspace-open", async (req, reply) => {
	reply.headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	const refuse = (status: number, code: string) => reply.code(status).send({ code, error: "This file could not be opened in another program." });
	const names = req.raw.rawHeaders.filter((_, index) => index % 2 === 0).map((name) => name.toLowerCase());
	const one = (name: string) => names.filter((entry) => entry === name).length === 1;
	const host = String(req.headers.host ?? "").toLowerCase();
	const hosts = [`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`];
	const address = req.raw.socket?.remoteAddress;
	if (isSharedServer() || (req as any).exxRemoteDevice || remoteMode.isRemoteSocket(req.raw.socket)
		|| !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "")
		|| names.some((name) => name === "forwarded" || name === "via" || name === "x-real-ip" || name.startsWith("x-forwarded-"))
		|| !one("host") || !hosts.includes(host) || !one("origin") || req.headers.origin !== `http://${host}`
		|| !one("x-exxperts-local-action") || req.headers["x-exxperts-local-action"] !== "open-workspace-file") return refuse(403, "local_action_forbidden");
	const body = req.body;
	if (!body || typeof body !== "object" || Array.isArray(body)) return refuse(400, "invalid_request");
	const fields = body as Record<string, unknown>;
	if (Object.keys(fields).length !== 2 || typeof fields.conversationId !== "string" || !fields.conversationId || typeof fields.path !== "string" || !fields.path) return refuse(400, "invalid_request");
	const requestedPath = fields.path.replace(/\\/g, "/");
	if (requestedPath.startsWith("~") || requestedPath.includes("\0") || requestedPath.includes(":") || requestedPath.split("/").some((part) => !part || part.startsWith("."))) return refuse(400, "invalid_path");
	let id: string;
	try { id = getUsablePersistentAgentStatusForNormalUse(String((req.params as any).id ?? "").trim()).id; }
	catch { return refuse(404, "room_not_found"); }
	try { if (!getPersistentAgentThread(id, fields.conversationId)) return refuse(404, "conversation_not_found"); }
	catch { return refuse(404, "conversation_not_found"); }
	try {
		const effective = resolvePersistentRoomEffectiveWorkspacePolicy(id, fields.conversationId);
		if (!effective.policy) return refuse(404, "workspace_not_found");
		if (!effective.workspaceToolsEnabled || !effective.policy.modes.read || !effective.allowedToolNames.includes("read")) return refuse(403, "workspace_read_forbidden");
		if (![".xlsx", ".xlsm", ".docx", ".pptx", ".drawio", ".dio", ".txt", ".json", ".pdf", ".html", ".htm", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(path.extname(requestedPath).toLowerCase())) return refuse(415, "unsupported_file_type");
		if (roomBoxComputer() === "unknown") return refuse(503, "opener_unavailable");
		const access = browserWorkspaceAccess(id, fields.conversationId, effective);
		const controller = new AbortController();
		const disconnected = () => controller.abort();
		reply.raw.once("close", disconnected);
		try {
			return await readWorkspaceForBrowser(access.current, requestedPath, Number.MAX_SAFE_INTEGER, fileToolsWait(), access.binding, controller.signal, async (snapshot) => {
				await snapshot.recheck();
				const first = await workspaceAssociation(snapshot.real);
				if (!first) return refuse(403, "association_unverified");
				const second = await workspaceAssociation(snapshot.real);
				if (!second || JSON.stringify(first) !== JSON.stringify(second)) return refuse(403, "association_unverified");
				await snapshot.recheck();
				const places = await roomWritePlaces();
				if (connectorStartRefusal({ command: second.executable, args: second.args, cwd: second.workingDirectory }, places)) return refuse(403, "association_unverified");
				await snapshot.recheck();
				const final = await workspaceAssociation(snapshot.real);
				if (!final || JSON.stringify(second) !== JSON.stringify(final)) return refuse(403, "association_unverified");
				await snapshot.recheck();
				const finalPlaces = await roomWritePlaces();
				if (connectorStartRefusal({ command: final.executable, args: final.args, cwd: final.workingDirectory }, finalPlaces)) return refuse(403, "association_unverified");
				await snapshot.recheck();
				if (!final.current()) return refuse(403, "association_unverified");
				const result = await dispatchWorkspaceAssociation(final, controller.signal);
				return result === "accepted" ? reply.code(202).send({ accepted: true }) : refuse(result === "open_timeout" ? 504 : result === "opener_unavailable" ? 503 : 500, result);
			}, true);
		} finally { reply.raw.removeListener("close", disconnected); }
	} catch (error) {
		const code = (error as { code?: string })?.code;
		if (code === "box_failed") return refuse(503, "box_failed");
		if (code === "file_changed") return refuse(409, "file_changed");
		if (code === "file_not_found" || code === "path_not_found") return refuse(404, "file_not_found");
		if (code === "not_file") return refuse(400, "not_file");
		return refuse(403, "workspace_read_forbidden");
	}
});

function browserWorkspaceAccess(id: string, conversationId: string, initial: ReturnType<typeof resolvePersistentRoomEffectiveWorkspacePolicy>) {
	const originalPolicy = JSON.stringify(initial.policy);
	return {
		current: () => {
			try {
				getUsablePersistentAgentStatusForNormalUse(id);
				if (!getPersistentAgentThread(id, conversationId)) throw new Error("Conversation unavailable.");
				const policy = resolvePersistentRoomEffectiveWorkspacePolicy(id, conversationId);
				if (policy.source !== initial.source || !policy.policy || !policy.workspaceToolsEnabled || !policy.policy.modes.read || !policy.allowedToolNames.includes("read") || policy.fingerprint.value !== initial.fingerprint.value || JSON.stringify(policy.policy) !== originalPolicy) throw new Error("Workspace changed.");
				return policy.policy;
			} catch { throw Object.assign(new Error("Workspace changed."), { code: "grant_changed" }); }
		},
		binding: () => {
			if (initial.source === "room-files" || roomBoxComputer() !== "mac") return undefined;
			const selected = workspaceBoxFor(id, conversationId);
			if (!selected) throw Object.assign(new Error("Workspace box unavailable."), { code: "box_failed" });
			return selected;
		},
	};
}

app.get("/api/persistent-agents/:id/workspace-image", async (req, reply) => {
	reply.headers({ ...ARTIFACT_SECURITY_HEADERS, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	const query = (req.query ?? {}) as Record<string, unknown>;
	if (typeof query.conversationId !== "string" || !query.conversationId.trim() || typeof query.path !== "string" || !query.path) return reply.code(400).send({ code: "invalid_request", error: "Invalid workspace request." });
	const requestedPath = query.path.replace(/\\/g, "/");
	if (requestedPath.startsWith("~") || requestedPath.includes("\0") || requestedPath.includes(":") || requestedPath.split("/").some((part) => !part || part.startsWith("."))) return reply.code(400).send({ code: "invalid_path", error: "Invalid workspace path." });
	const mime: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
	const type = mime[path.extname(requestedPath).toLowerCase()];
	let id: string;
	try { id = getUsablePersistentAgentStatusForNormalUse(String((req.params as any).id ?? "").trim()).id; }
	catch { return reply.code(404).send({ code: "room_not_found", error: "Room not found." }); }
	const conversationId = query.conversationId.trim();
	try { if (!getPersistentAgentThread(id, conversationId)) return reply.code(404).send({ code: "conversation_not_found", error: "Conversation not found." }); }
	catch { return reply.code(404).send({ code: "conversation_not_found", error: "Conversation not found." }); }
	try {
		const initial = resolvePersistentRoomEffectiveWorkspacePolicy(id, conversationId);
		if (!initial.policy) return reply.code(404).send({ code: "workspace_not_found", error: "Workspace is unavailable." });
		if (!initial.workspaceToolsEnabled || !initial.policy.modes.read || !initial.allowedToolNames.includes("read")) return reply.code(403).send({ code: "workspace_read_forbidden", error: "Workspace access is forbidden." });
		if (roomBoxComputer() === "unknown") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		const access = browserWorkspaceAccess(id, conversationId, initial);
		if (!type) { access.binding(); return reply.code(400).send({ code: "unsupported_file_type", error: "Only image files can be shown." }); }
		const controller = new AbortController();
		const disconnected = () => controller.abort();
		reply.raw.once("close", disconnected);
		try {
			return await readWorkspaceForBrowser(access.current, requestedPath, 20_971_520, fileToolsWait(), access.binding, controller.signal, async (snapshot) => {
				await snapshot.recheck();
				return reply.type(type).send(snapshot.bytes);
			});
		} finally { reply.raw.removeListener("close", disconnected); }
	} catch (error) {
		const code = (error as { code?: string })?.code;
		if (code === "grant_changed") return reply.code(403).send({ code, error: "Workspace access changed." });
		if (code === "workspace_unavailable") return reply.code(503).send({ code, error: "Workspace is unavailable." });
		if (code === "box_failed") return reply.code(503).send({ code, error: "Workspace is unavailable." });
		if (code === "folder_moved" || code === "not_readable" || code === "not_permitted") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		if (code === "link" || code === "folder_refused" || code === "box_refused") return reply.code(403).send({ code: "blocked_by_policy", error: "Workspace access is forbidden." });
		if (code === "file_changed") return reply.code(409).send({ code, error: "File changed while it was read." });
		if (code === "file_too_large") return reply.code(413).send({ code, error: "File is too large." });
		if (code === "file_not_found" || code === "path_not_found") return reply.code(404).send({ code: "file_not_found", error: "File not found." });
		if (code === "not_file") return reply.code(400).send({ code, error: "Not a file." });
		if (code === "outside_workspace" || code === "blocked_by_policy") return reply.code(403).send({ code, error: "Workspace access is forbidden." });
		return reply.code(500).send({ code: "preview_failed", error: "Image is unavailable." });
	}
});

app.get("/api/persistent-agents/:id/workspace-preview", async (req, reply) => {
	reply.headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "sandbox; default-src 'none'" });
	const query = (req.query ?? {}) as Record<string, unknown>;
	if (typeof query.conversationId !== "string" || !query.conversationId.trim() || typeof query.path !== "string" || !query.path) return reply.code(400).send({ code: "invalid_request", error: "Invalid workspace request." });
	const requestedPath = query.path.replace(/\\/g, "/");
	if (requestedPath.startsWith("~") || requestedPath.includes("\0") || requestedPath.includes(":") || requestedPath.split("/").some((part) => !part || part.startsWith("."))) return reply.code(400).send({ code: "invalid_path", error: "Invalid workspace path." });
	let id: string;
	try { id = getUsablePersistentAgentStatusForNormalUse(String((req.params as any).id ?? "").trim()).id; }
	catch { return reply.code(404).send({ code: "room_not_found", error: "Room not found." }); }
	const conversationId = query.conversationId.trim();
	try { if (!getPersistentAgentThread(id, conversationId)) return reply.code(404).send({ code: "conversation_not_found", error: "Conversation not found." }); }
	catch { return reply.code(404).send({ code: "conversation_not_found", error: "Conversation not found." }); }
	try {
		const initial = resolvePersistentRoomEffectiveWorkspacePolicy(id, conversationId);
		if (!initial.policy) return reply.code(404).send({ code: "workspace_not_found", error: "Workspace is unavailable." });
		if (!initial.workspaceToolsEnabled || !initial.policy.modes.read || !initial.allowedToolNames.includes("read")) return reply.code(403).send({ code: "workspace_read_forbidden", error: "Workspace access is forbidden." });
		if (roomBoxComputer() === "unknown") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		const access = browserWorkspaceAccess(id, conversationId, initial);
		if (/\.doc$/i.test(requestedPath)) { access.binding(); return reply.code(415).send({ code: "legacy_doc", error: "Save this file as .docx to preview it here." }); }
		const spreadsheet = /\.xlsx$/i.test(requestedPath);
		const pdf = /\.pdf$/i.test(requestedPath);
		const word = /\.docx$/i.test(requestedPath);
		const html = /\.html?$/i.test(requestedPath);
		const presentation = /\.pptx$/i.test(requestedPath);
		if (!spreadsheet && !pdf && !word && !html && !presentation && !/\.(txt|json|md)$/i.test(requestedPath)) { access.binding(); return reply.code(415).send({ code: "unsupported_file_type", error: "This file type cannot be previewed here." }); }
		const controller = new AbortController();
		const disconnected = () => controller.abort();
		reply.raw.once("close", disconnected);
		try {
			return await readWorkspaceForBrowser(access.current, requestedPath, spreadsheet || pdf || word || presentation ? 26_214_400 : 16_777_216, fileToolsWait(), access.binding, controller.signal, async (snapshot) => {
			await snapshot.recheck();
			if (presentation) {
				if (query.frame !== "1") return reply.type("application/octet-stream").send(snapshot.bytes);
				const assets = path.join(WEB_UI_DIST, "assets");
				const file = fs.existsSync(assets) ? fs.readdirSync(assets).find((name) => /^pptx-frame-entry-[\w-]+\.js$/.test(name)) : undefined;
				if (!file) return reply.code(503).send({ code: "renderer_unavailable", error: "Preview is unavailable." });
				const script = fs.readFileSync(path.join(assets, file), "utf8").replaceAll("</script", "<\\/script");
				await snapshot.recheck();
				return reply.header("Content-Security-Policy", "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'").type("text/html; charset=utf-8").send(`<!doctype html><html><head><style>html, body { margin: 0; background: #f3f0ea; } #slides { padding: 16px; box-sizing: border-box; }</style></head><body><div id="slides"></div><script>${script}</script></body></html>`);
			}
			if (spreadsheet || pdf || word) {
				const result = spreadsheet ? await runWorkspaceSpreadsheetSnapshot(snapshot.bytes, controller.signal) : pdf ? await runWorkspacePdfSnapshot(snapshot.bytes, controller.signal) : await runWorkspaceWordSnapshot(snapshot.bytes, controller.signal);
				await snapshot.recheck();
				if (!result.ok || !result.result) {
					const code = result.code ?? "preview_failed";
					const status = ["file_too_large", "preview_too_complex", "expanded_content_too_large", "decoded_image_too_large"].includes(code) ? 413 : ["damaged_file", "encrypted_file", "unsupported_document_feature"].includes(code) ? 422 : ["renderer_unavailable", "preview_busy"].includes(code) ? 503 : code === "preview_timeout" ? 504 : code === "file_changed" ? 409 : 500;
					return reply.code(status).send({ code, error: "This file could not be previewed." });
				}
				return { schemaVersion: 1, agentId: id, conversationId, path: requestedPath, notices: result.notices, ...result.result };
			}
			if (html) {
				const body = snapshot.bytes.toString("utf8");
				if (query.frame === "1") return reply.header("Content-Security-Policy", "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'").type("text/html; charset=utf-8").send(body);
				return { schemaVersion: 1, agentId: id, conversationId, path: requestedPath, kind: "html", notices: [], html: body };
			}
			return { schemaVersion: 1, agentId: id, conversationId, path: requestedPath, kind: "text", notices: [], text: snapshot.bytes.toString("utf8") };
			});
		} finally { reply.raw.removeListener("close", disconnected); }
	} catch (error) {
		const code = (error as { code?: string })?.code;
		if (code === "grant_changed") return reply.code(403).send({ code, error: "Workspace access changed." });
		if (code === "workspace_unavailable") return reply.code(503).send({ code, error: "Workspace is unavailable." });
		if (code === "box_failed") return reply.code(503).send({ code, error: "Workspace is unavailable." });
		if (code === "folder_moved" || code === "not_readable" || code === "not_permitted") return reply.code(503).send({ code: "workspace_unavailable", error: "Workspace is unavailable." });
		if (code === "link" || code === "folder_refused" || code === "box_refused") return reply.code(403).send({ code: "blocked_by_policy", error: "Workspace access is forbidden." });
		if (code === "file_changed") return reply.code(409).send({ code, error: "File changed while it was read." });
		if (code === "file_too_large") return reply.code(413).send({ code, error: "File is too large." });
		if (code === "file_not_found" || code === "path_not_found") return reply.code(404).send({ code: "file_not_found", error: "File not found." });
		if (code === "not_file") return reply.code(400).send({ code, error: "Not a file." });
		if (code === "outside_workspace" || code === "blocked_by_policy") return reply.code(403).send({ code, error: "Workspace access is forbidden." });
		if (code === "invalid_name") return reply.code(400).send({ code: "invalid_path", error: "Invalid workspace path." });
		return reply.code(500).send({ code: "preview_failed", error: "Preview is unavailable." });
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
			// The note is the Windows line, so a shared server never looks; nor does a room whose commands run in Windows' box, where Git isn't used.
			shellMissingNote: isSharedServer() || persistentRoomWindowsBoxed(id) || persistentRoomShellFound() ? null : PERSISTENT_ROOM_SHELL_MISSING_SENTENCE,
			commandsStartOn: persistentRoomCommandsStartOn(id),
			// Judged afresh too: a folder saved before the rule, or one that became a closed place since.
			folderRefused: policy ? roomFence(policy, () => []).refused : false,
			...protectionView(id),
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
		// Left out, the room keeps whether it can change files: its folder's, or for its next folder what Clear kept.
		const toolSelectionSent = Object.prototype.hasOwnProperty.call(body, "toolSelection");
		let policy;
		if (root) {
			const workspaceAccessMode = normalizePersistentRoomWorkspaceAccessModeInput(body.workspaceAccessMode);
			const toolSelection = toolSelectionSent ? normalizePersistentRoomWorkspaceToolSelectionInput(body.toolSelection, { defaultToStandard: true, workspaceAccessMode }) : undefined;
			policy = createPersistentRoomDefaultCapabilityPolicy({
				agentId: id,
				repoRoot: REPO_ROOT,
				root,
				workspaceAccessMode,
				source: "manual",
				displayLabel: typeof body.displayLabel === "string" ? body.displayLabel : undefined,
				toolSelection,
				// Left out, the switch was never touched: a new room's first folder takes the start-on default.
				bashEnabled: typeof body.bashEnabled === "boolean" ? body.bashEnabled : undefined,
			});
			refuseUnusableRoomFolder(policy);
		} else {
			const existingDefault = readPersistentRoomDefaultCapabilityPolicy(id);
			if (!existingDefault) throw new Error("Choose a folder for this room.");
			const workspaceAccessMode = normalizePersistentRoomWorkspaceAccessModeInput(body.workspaceAccessMode, { defaultMode: existingDefault.workspaceAccessMode });
			const toolSelection = toolSelectionSent
				? normalizePersistentRoomWorkspaceToolSelectionInput(body.toolSelection, { defaultToStandard: true, workspaceAccessMode })
				: undefined;
			policy = updatePersistentRoomCapabilityPolicyWorkspaceSettings(existingDefault, { workspaceAccessMode, ...(toolSelection ? { toolSelection } : {}), ...(Object.prototype.hasOwnProperty.call(body, "bashEnabled") ? { bashEnabled: body.bashEnabled === true } : {}) });
		}
		assertPersistentRoomWorkspaceDefaultMutable(status.activeThread, "Save");
		writePersistentRoomDefaultCapabilityPolicy(policy);
		// The answer is the room as the next read gives it: folded, and with its commands as they now stand.
		const saved = readPersistentRoomDefaultCapabilityPolicy(id);
		return {
			agentId: id,
			storage: { kind: PERSISTENT_ROOM_WORKSPACE_DEFAULT_STORAGE_SOURCE },
			policy: saved ? workspacePolicyViewFor(req, saved) : null,
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
		assertPersistentRoomWorkspaceDefaultMutable(status.activeThread, "Clear");
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

/** A room's protection as the reads carry it. None on a shared server, where no room's commands are boxed. */
function protectionView(roomId: string): { protection?: PersistentRoomProtection } {
	return isSharedServer() ? {} : { protection: persistentRoomProtection(roomId) };
}

const PROTECTION_UNAVAILABLE_LINES: Record<PersistentRoomProtectionCause, string> = {
	computer: PROTECTION_UNAVAILABLE_COMPUTER,
	folder: PROTECTION_UNAVAILABLE_FOLDER,
	unknown: PROTECTION_UNAVAILABLE,
};

/** The protection route's request: the room from the path, the state from the body, checked below. */
type ProtectionRequest = { idRaw: string; state: unknown };

// A room's protection, turned off or on by the person at the computer: the
// app's own control is the one way. Refused while the room answers, and where
// a cause stands, since then nothing she chooses would change what runs.
app.put("/api/persistent-agents/:id/protection", async (req, reply) => {
	const { idRaw, state }: ProtectionRequest = {
		idRaw: String((req.params as { id?: string }).id ?? "").trim(),
		state: ((req.body ?? {}) as { state?: unknown }).state,
	};
	try {
		const status = getUsablePersistentAgentStatusForNormalUse(idRaw);
		const id = status.id;
		if (isSharedServer()) throw listError(403, "protection_unavailable", PROTECTION_UNAVAILABLE);
		if (state !== "on" && state !== "off") throw listError(400, "invalid_protection", "state must be \"on\" or \"off\"");
		refuseWhileAnswering(id);
		const now = persistentRoomProtection(id);
		if (now.state === "off" && now.cause !== undefined) throw listError(409, "protection_unavailable", PROTECTION_UNAVAILABLE_LINES[now.cause]);
		writePersistentRoomProtection(id, state);
		// Seen in its new state at once: a yes of the other state is no longer honoured, and one given without protection is dropped.
		readPersistentRoomBashSettings(id);
		return { agentId: id, ...protectionView(id) };
	} catch (e) {
		return persistentAgentNormalUseErrorReply(reply, e);
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
		refuseUnusableRoomFolder(policy);
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
