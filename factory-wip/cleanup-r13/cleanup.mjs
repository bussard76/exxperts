// Controller cleanup, run at the end of EVERY cycle, per worker host: removes worktrees that no running worker uses
// and whose branch is MERGED into origin/<main> (or, with --pushed, identical to its origin branch). A worktree with
// any uncommitted or untracked change is kept. If worker state cannot be verified (terminal list failed), nothing is
// removed or forgotten on that host. Release requires a settled worker and its read completion message.
// --dry changes nothing: no fetch, no journal, no removals, no releases.
// Usage: node cleanup.mjs [--on <host>|--all] [--dry] [--pushed] [--prune-remote]
import { posix } from "node:path";
import { HOSTS, file, sh, MAIN, ORCA, RUNNER, argHost, journal, onHost, orcaEnvArgsOn, projectDirOn, readJson, workspacesOn, worktreeRefOn, writeJson } from "./lib.mjs";

const dry = process.argv.includes("--dry"), allowPushed = process.argv.includes("--pushed"), cleanInstallNoise = process.argv.includes("--install-noise");
const protectedBranches = new Set(["agents/t4-design", "agents/workspace-file-tabs-draft"]);
const hosts = process.argv.includes("--all") ? HOSTS : [argHost(process.argv)];
const workers = readJson("workers.json", {});
const q = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
let removed = 0, kept = 0, pruned = 0, released = 0, closedWaves = 0, noiseCleaned = 0, before = 0, after = 0;
let beforeKnown = true, afterKnown = true;
const failedReleases = [];
const confirmedReleases = new Set(), incompleteInboxes = new Set(), invalidIdentityHosts = new Map();
const worktreeMappings = new Map();
const terminalsOf = (host) => {   // null when terminal state cannot be verified
  if (RUNNER !== "orca") return [];
  if (invalidIdentityHosts.has(host.name)) return null;
  try {
    const r = parseEvidence(sh(ORCA, ["terminal", "list", ...orcaEnvArgsOn(host), "--json"])), t = r.result?.terminals;
    if (!(r.ok === true && Array.isArray(t) && completeInventory(r, t.length) && r.result.truncated === false && Array.isArray(r.result.hostScope?.hostIds) && r.result.hostScope.hostIds.length > 0 && Array.isArray(r.result.hostScope.omittedHostIds) && r.result.hostScope.omittedHostIds.length === 0 && Number.isSafeInteger(r.result.totalCount) && r.result.totalCount === t.length)) return null;
    if (!terminalIdentities(t, host)) { invalidIdentityHosts.set(host.name, true); return null; }
    return t;
  } catch { return null; }
};
// A supplied contradiction keeps this host untrusted for this invocation; true preserves terminal-inventory error status.
function invalidIdentity(host) { invalidIdentityHosts.set(host.name, invalidIdentityHosts.get(host.name) ?? false); return false; }
// Correlate only supplied associations, across inventories and observations on the same host.
function associateWorktree(host, id, path) {
  if (!worktreeMappings.has(host.name)) worktreeMappings.set(host.name, { ids: new Map(), paths: new Map() });
  const { ids, paths } = worktreeMappings.get(host.name);
  if ((ids.has(id) && ids.get(id) !== path) || (paths.has(path) && paths.get(path) !== id)) return invalidIdentity(host);
  ids.set(id, path); paths.set(path, id);
  return true;
}
function identity(value) { return typeof value === "string" && value.length > 0 && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value); }

// Reject aliases, including symlinked ancestors, before comparing resource identities.
function canonicalPath(value, host) {
  if (!identity(value) || !posix.isAbsolute(value) || value === "/" || posix.normalize(value) !== value) return false;
  try { return strictHost(host, `realpath -m -- ${q(value)}`).trimEnd() === value; } catch { return false; }
}

// Legacy opaque IDs are supported; documented path IDs must name this canonical resource.
function worktreeIdentity(value, host, path) {
  if (!identity(value)) return false;
  const separator = value.indexOf("::");
  if (separator < 0) return !value.includes("/");
  const embedded = value.slice(separator + 2);
  return identity(host.orcaRepoId) && value.slice(0, separator) === host.orcaRepoId && canonicalPath(embedded, host) && (path === undefined || embedded === path);
}

function terminalIdentities(terminals, host) {
  const handles = new Set();
  for (const t of terminals) {
    if (!identity(t?.handle) || handles.has(t.handle) || !canonicalPath(t.worktreePath, host) || (Object.hasOwn(t, "worktreeId") && !worktreeIdentity(t.worktreeId, host, t.worktreePath)) || (Object.hasOwn(t, "branch") && !identity(t.branch))) return invalidIdentity(host);
    if (Object.hasOwn(t, "worktreeId") && !associateWorktree(host, t.worktreeId, t.worktreePath)) return false;
    handles.add(t.handle);
  }
  if (!terminals.length) return true;
  const entries = strictHost(host, `git -C ${q(projectDirOn(host))} worktree list --porcelain`).split("\n\n").map(block => ({ path: /^worktree (.*)$/m.exec(block)?.[1], branch: /^branch refs\/heads\/(.*)$/m.exec(block)?.[1] }));
  const branches = new Set(strictHost(host, `git -C ${q(projectDirOn(host))} for-each-ref --format='%(refname:short)' refs/heads/`).trim().split("\n"));
  return terminals.every(t => {
    if (Object.values(workers).some(w => (w.host ?? "local") === host.name && w.worktree === t.worktreePath) && !entries.some(w => w.path === t.worktreePath)) return invalidIdentity(host);
    if (t.branch && branches.has(t.branch) && !entries.some(w => w.path === t.worktreePath && w.branch === t.branch)) return invalidIdentity(host);
    return !t.branch || entries.every(w => (t.worktreePath !== w.path || t.branch === w.branch) && (t.branch !== w.branch || t.worktreePath === w.path));
  }) || invalidIdentity(host);
}

// Release only the exact settled worker whose completion message has been read.
if (!dry && RUNNER === "orca") for (const host of hosts) {
  const terms = terminalsOf(host);
  if (!terms) continue;
  const hostWorkers = Object.values(workers).filter((worker) => (worker.host ?? "local") === host.name && worker.terminal);
  if (!hostWorkers.length) continue;
  let messages;
  try {
    const receipt = parseEvidence(sh(ORCA, ["orchestration", "inbox", "--limit", "1000", "--full", ...orcaEnvArgsOn(host), "--json"]));
    if (!completeInbox(receipt)) throw new Error("invalid inbox receipt");
    messages = receipt.result.messages;
  } catch { incompleteInboxes.add(host.name); process.exitCode = 1; console.error(`[${host.name}] inbox read failed or returned an invalid receipt`); continue; }
  for (const worker of hostWorkers) {
    if ((worker.host ?? "local") !== host.name || !worker.terminal || !settledWorker(worker, host)) continue;
    const workspaceRoot = workspacesOn(host);
    const workspaceTail = workspaceRoot.split("/").filter(Boolean).slice(-2).join("/");
    const suffix = worker.worktree?.split(`/${workspaceTail}/`);
    if (!suffix || suffix.length !== 2 || !suffix[1] || suffix[1].includes("/") || (host.kind === "local" && !worker.worktree.startsWith(workspaceRoot))) continue;
    try {
      const entries = strictHost(host, `git -C ${q(projectDirOn(host))} worktree list --porcelain`).split("\n\n");
      const entry = entries.find((block) => block.split("\n").includes(`worktree ${worker.worktree}`));
      if (entry) {
        const branch = /^branch refs\/heads\/(.*)$/m.exec(entry)?.[1];
        if (worker.worktree.split("/").pop() === "coordinator-integration" || !branch?.startsWith("agents/") || protectedBranches.has(branch)) continue;
      }
    } catch { continue; }
    let shown;
    try { shown = parseEvidence(sh(ORCA, ["orchestration", "worker-show", "--dispatch", worker.dispatch, ...orcaEnvArgsOn(host), "--full", "--json"])); } catch { continue; }
    const d = shown.result?.dispatch;
    if (shown.ok !== true || !completeInventory(shown, 1) || !suppliedWorkerIdentity(worker, host, shown) || shown.result?.terminal?.handle !== worker.terminal || (!releasedIdentity(worker, host, shown) && shown.result?.terminal?.worktreePath !== worker.worktree) || d?.id !== worker.dispatch || d.status !== "completed" || !Number.isFinite(Date.parse(d.completedAt)) || !["reclaimable", "released"].includes(shown.result?.projection?.resource?.terminalState) || typeof d.runId !== "string" || typeof d.taskId !== "string") continue;
    if (!readCompletion(messages, worker, d)) continue;
    try {
      const result = parseEvidence(sh(ORCA, ["orchestration", "worker-release", "--dispatch", worker.dispatch, ...orcaEnvArgsOn(host), "--json"]));
      if (result.ok !== true) throw new Error("worker-release failed");
      const after = parseEvidence(sh(ORCA, ["orchestration", "worker-show", "--dispatch", worker.dispatch, ...orcaEnvArgsOn(host), "--full", "--json"]));
      if (after.ok !== true || !completeInventory(after, 1)) throw new Error("release not confirmed");
      if (!suppliedWorkerIdentity(worker, host, after)) {
        throw new Error("release identity contradicted");
      }
      if (after.result?.projection?.resource?.terminalState !== "released") throw new Error("release not confirmed");
      if (shown.result?.projection?.resource?.terminalState !== "released") released++;
      confirmedReleases.add(`${host.name}:${worker.dispatch}`);
    } catch (e) { failedReleases.push(worker.dispatch); process.exitCode = 1; console.error(`[${host.name}] release failed: ${e.message}`); }
  }
}
const hostTerms = new Map(hosts.map((h) => [h.name, terminalsOf(h)]));
for (const host of hosts) {
  const WS = workspacesOn(host), PD = projectDirOn(host);
  const g = (...a) => strictHost(host, `git -C ${q(PD)} ${a.map(q).join(" ")}`).trim();
  let countedBefore = false;
  try {
  const wsTail = WS.split("/").filter(Boolean).slice(-2).join("/");
  const wts = g("worktree", "list", "--porcelain").split("\n\n").map((b) => ({ path: /^worktree (.*)$/m.exec(b)?.[1], branch: /^branch refs\/heads\/(.*)$/m.exec(b)?.[1] })).filter((w) => w.path && w.path.includes(`/${wsTail}/`));
  before += wts.length; countedBefore = true;
  if (invalidIdentityHosts.has(host.name)) {
    kept += wts.length;
    if (invalidIdentityHosts.get(host.name)) { process.exitCode = 1; console.error(`[${host.name}] cannot list terminals; removing nothing here`); }
    continue;
  }
  if (incompleteInboxes.has(host.name)) { kept += wts.length; continue; }
  if (!dry) g("fetch", "-q", "--prune", "origin");
  const terms = hostTerms.get(host.name);
  if (terms === null) { console.error(`[${host.name}] cannot list terminals; removing nothing here`); kept += wts.length; process.exitCode = 1; continue; }
  const busy = new Set([
    ...terms.map((t) => t.worktreePath),
    ...Object.values(workers).filter((w) => (w.host ?? "local") === host.name && ((w.pid && alive(w.pid)) || (w.terminal && terms.some((t) => t.handle === w.terminal)))).map((w) => w.worktree),
  ]);
  for (const w of wts) {
    try {
    const name = w.path.split("/").pop();
    const records = Object.values(workers).filter((worker) => worker.worktree === w.path && (worker.host ?? "local") === host.name);
    const settled = () => records.length > 0 && records.every((worker) => settledWorker(worker, host));
    if (!settled()) { kept++; continue; }
    if (strictHost(host, `find ${q(w.path)} -mindepth 2 -name .git -print -quit`).trim()) { kept++; continue; }
    let dirty = strictHost(host, `git -C ${q(w.path)} status --porcelain --ignored=matching`).trim();   // includes untracked files
    const merged = w.branch && strictHost(host, `git -C ${q(PD)} merge-base --is-ancestor ${q(w.branch)} ${q(`origin/${MAIN}`)}; rc=$?; if [ "$rc" -eq 0 ]; then echo yes; elif [ "$rc" -eq 1 ]; then echo no; else exit "$rc"; fi`).trim() === "yes";
    const local = w.branch ? g("rev-parse", "-q", "--verify", w.branch) : "", remote = w.branch ? g("rev-parse", "-q", "--verify", `origin/${w.branch}`) : "";
    const advertised = w.branch ? g("ls-remote", "--heads", "origin", `refs/heads/${w.branch}`).split(/\s+/)[0] : "";
    const pushed = Boolean(local) && local === remote && local === advertised;
    const stillIdle = () => {
      const currentTerms = terminalsOf(host);
      if (currentTerms === null || currentTerms.some((t) => t.worktreePath === w.path) || !settled()) return false;
      try {
        if (strictHost(host, `find ${q(w.path)} -mindepth 2 -name .git -print -quit`).trim()) return false;
        const status = strictHost(host, `git -C ${q(w.path)} status --porcelain=v1 --untracked-files=normal --ignored=matching`);
        const head = strictHost(host, `git -C ${q(w.path)} rev-parse --verify HEAD`).trim();
        const branch = strictHost(host, `git -C ${q(w.path)} symbolic-ref --short HEAD`).trim();
        const remoteHead = g("ls-remote", "--heads", "origin", `refs/heads/${w.branch}`).split(/\s+/)[0];
        const mainHead = g("rev-parse", "--verify", `refs/remotes/origin/${MAIN}`);
        const remoteMain = g("ls-remote", "--heads", "origin", `refs/heads/${MAIN}`).split(/\s+/)[0];
        return status === rawStatus && head === local && branch === w.branch && remoteHead === local && mainHead === remoteMain;
      } catch { return false; }
    };
    // Only known install noise in a finished, already-safe worktree may be discarded.
    // Keep staged lockfile changes, symlinks, any other tracked/untracked change, unpushed work and active worktrees.
    let rawStatus = strictHost(host, `git -C ${q(w.path)} status --porcelain=v1 --untracked-files=normal --ignored=matching`);
    const statusLines = rawStatus.split("\n").filter(Boolean);
    const onlyInstallNoise = statusLines.length > 0 && statusLines.every((line) => line === " M package-lock.json" || line === "?? .npm-review-cache/");
    const protectedWorktree = !w.branch?.startsWith("agents/") || protectedBranches.has(w.branch);
    if (cleanInstallNoise && name !== "coordinator-integration" && !protectedWorktree && !busy.has(w.path) && (pushed && (merged || allowPushed)) && onlyInstallNoise && stillIdle()) {
      const hasLock = statusLines.includes(" M package-lock.json"), hasCache = statusLines.includes("?? .npm-review-cache/");
      const cache = `${w.path}/.npm-review-cache`;
      const safeLock = !hasLock || lockNoise(host, w.path);
      const safeCache = !hasCache || cacheNoise(host, cache);
      if (safeLock && safeCache) {
        if (dry) { console.log(`[${host.name}] would clean install noise in ${name}`); noiseCleaned++; dirty = ""; }
        else {
          if (hasLock) {
            if (!stillIdle() || !lockNoise(host, w.path)) { kept++; continue; }
            strictHost(host, `git -C ${q(w.path)} restore --worktree -- package-lock.json`);
            const after = strictHost(host, `git -C ${q(w.path)} status --porcelain=v1 --untracked-files=normal --ignored=matching`);
            if (after !== rawStatus.replace(" M package-lock.json\n", "")) { kept++; continue; }
            rawStatus = after;
          }
          if (hasCache) {
            if (!stillIdle() || !cacheNoise(host, cache)) { kept++; continue; }
            strictHost(host, `rm -rf -- ${q(cache)}`);
            const after = strictHost(host, `git -C ${q(w.path)} status --porcelain=v1 --untracked-files=normal --ignored=matching`);
            if (after !== rawStatus.replace("?? .npm-review-cache/\n", "")) { kept++; continue; }
            rawStatus = after;
          }
          noiseCleaned++; dirty = rawStatus.trim();
        }
      }
    }
    const removable = !busy.has(w.path) && !dirty && (pushed && (merged || allowPushed));
    if (name === "coordinator-integration" || protectedWorktree || !removable) { kept++; continue; }
    if (!stillIdle()) { kept++; continue; }
    if (dry) { console.log(`[${host.name}] would remove ${name} (${merged ? "merged" : "pushed"})`); removed++; continue; }
    try {
      if (RUNNER === "orca") {
        const r = parseEvidence(sh(ORCA, ["worktree", "rm", "--worktree", worktreeRefOn(host, name), ...orcaEnvArgsOn(host), "--json"]));
        if (r.ok !== true) throw new Error("orca worktree rm failed");
      } else {
        const r = onHost(host, `git -C ${q(PD)} worktree remove ${q(w.path)} && echo removed`);
        if (!/removed/.test(r)) throw new Error("git worktree remove failed");
      }
      removed++;
    } catch (e) { kept++; process.exitCode = 1; console.error(`[${host.name}] worktree removal failed for ${name}: ${e.message}`); }
    } catch (e) { kept++; process.exitCode = 1; console.error(`[${host.name}] worktree action failed: ${e.message}`); }
  }
  const fork = /^(?:https:\/\/github\.com\/bussard76\/exxperts(?:\.git)?|git@github\.com:bussard76\/exxperts(?:\.git)?)$/;
  if (process.argv.includes("--prune-remote") && fork.test(g("remote", "get-url", "origin")) && fork.test(g("remote", "get-url", "--push", "--all", "origin"))) {
    for (const b of g("branch", "-r", "--merged", `origin/${MAIN}`).split("\n").map((s) => s.trim()).filter((s) => s.startsWith("origin/agents/") && !protectedBranches.has(s.slice("origin/".length)))) {
      const branch = b.slice("origin/".length);
      const currentTerms = terminalsOf(host);
      if (currentTerms === null || currentTerms.some((t) => typeof t.branch !== "string" || t.branch === branch)) continue;
      const entries = g("worktree", "list", "--porcelain").split("\n\n");
      const checkedOut = entries.some((entry) => entry.split("\n").includes(`branch refs/heads/${branch}`));
      const knownPaths = new Set(entries.filter((entry) => /^branch refs\/heads\//m.test(entry)).map((entry) => /^worktree (.*)$/m.exec(entry)?.[1]).filter(Boolean));
      const unknown = Object.values(workers).some((w) => (w.host ?? "local") === host.name && !knownPaths.has(w.worktree) && !settledWorker(w, host));
      if (checkedOut || unknown) continue;
      const sha = g("rev-parse", "--verify", `refs/remotes/origin/${branch}`);
      const localRefs = g("for-each-ref", "--format=%(objectname)", `refs/heads/${branch}`);
      if (localRefs && localRefs !== sha) continue;
      const advertised = g("ls-remote", "--heads", "origin", `refs/heads/${branch}`).split(/\s+/)[0];
      const main = g("rev-parse", "--verify", `refs/remotes/origin/${MAIN}`);
      const advertisedMain = g("ls-remote", "--heads", "origin", `refs/heads/${MAIN}`).split(/\s+/)[0];
      if (!sha || sha !== advertised || main !== advertisedMain || !fork.test(g("remote", "get-url", "origin")) || !fork.test(g("remote", "get-url", "--push", "--all", "origin"))) continue;
      try { g("merge-base", "--is-ancestor", sha, main); } catch { continue; }
      if (!dry) g("push", "-q", "origin", `--force-with-lease=refs/heads/${branch}:${sha}`, `:refs/heads/${branch}`);
      pruned++;
    }
  }
  } catch (e) { if (!countedBefore) beforeKnown = false; process.exitCode = 1; console.error(`[${host.name}] cleanup failed: ${e.message}`); }
  finally {
    try { const tail = WS.split("/").filter(Boolean).slice(-2).join("/"); after += g("worktree", "list", "--porcelain").split("\n\n").filter((b) => { const p = /^worktree (.*)$/m.exec(b)?.[1]; return p && p.includes(`/${tail}/`); }).length; }
    catch (e) { afterKnown = false; process.exitCode = 1; console.error(`[${host.name}] after count failed: ${e.message}`); }
  }
}
// Every cycle also corrects automatic names: a failure here must not hide what cleanup did.
if (!dry && RUNNER === "orca") for (const host of hosts) try { process.stdout.write(sh("node", [file("names.mjs"), "--on", host.name])); } catch (e) { process.exitCode = 1; console.error(`naming entries on ${host.name} failed: ${e.message}`); }
// Keep records until the exact release is confirmed and the worktree is gone.
if (!dry) {
  for (const host of hosts) {
    const terms = terminalsOf(host);
    if (RUNNER !== "orca" || terms === null) continue;
    for (const [k, w] of Object.entries(workers)) {
      if ((w.host ?? "local") !== host.name || !confirmedReleases.has(`${host.name}:${w.dispatch}`) || !settledWorker(w, host) || terms.some((t) => t.handle === w.terminal || t.worktreePath === w.worktree)) continue;
      try {
        const listing = strictHost(host, `git -C ${q(projectDirOn(host))} worktree list --porcelain`);
        if (!listing.split("\n").includes(`worktree ${w.worktree}`)) delete workers[k];
      } catch { /* Keep the record for a later retry. */ }
    }
  }
  try { writeJson("workers.json", workers); } catch (e) { process.exitCode = 1; console.error(`worker record write failed: ${e.message}`); }
  try { journal("cleanup", "controller", { note: `before ${beforeKnown ? before : "unknown"}, after ${afterKnown ? after : "unknown"}, removed ${removed}, kept ${kept}, pruned ${pruned}, released ${released}, errors ${process.exitCode ? "yes" : "no"}${failedReleases.length ? `, release failed ${failedReleases.join(" ")}` : ""}` }); }
  catch (e) { process.exitCode = 1; console.error(`cleanup journal failed: ${e.message}`); }
}
console.log(`cleanup${dry ? " (dry)" : ""}: before ${beforeKnown ? before : "unknown"} worktrees, after ${afterKnown ? after : "unknown"} worktrees; removed ${removed} worktrees, kept ${kept}, pruned ${pruned} remote branches, released ${released} dispatches, closed ${closedWaves} finished wave terminals, cleaned ${noiseCleaned} install-noise worktrees${failedReleases.length ? `; release FAILED for ${failedReleases.join(", ")}` : ""}`);
function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }

function strictHost(host, command) { return host.kind === "local" ? sh("sh", ["-c", command]) : sh("ssh", [...(host.sshConfig ? ["-F", host.sshConfig] : []), host.ssh, command]); }

function lockNoise(host, worktree) {
  const code = String.raw`const fs = require("node:fs"), cp = require("node:child_process"), util = require("node:util");
const p = process.argv[1];
try {
  if (!fs.lstatSync(p + "/package-lock.json").isFile()) process.exit(1);
  const oldText = cp.execFileSync("git", ["-C", p, "show", "HEAD:package-lock.json"], { encoding: "utf8" });
  const currentText = fs.readFileSync(p + "/package-lock.json", "utf8");
  const old = JSON.parse(oldText), current = JSON.parse(currentText);
  if (oldText !== JSON.stringify(old, null, 2) + "\n" || currentText !== JSON.stringify(current, null, 2) + "\n") process.exit(1);
  if (!old.packages || !current.packages) process.exit(1);
  let dropped = false;
  for (const [name, entry] of Object.entries(old.packages)) {
    if (entry && typeof entry === "object" && Object.hasOwn(entry, "libc") && current.packages[name] && !Object.hasOwn(current.packages[name], "libc")) {
      delete entry.libc; dropped = true;
    }
  }
  process.exit(dropped && util.isDeepStrictEqual(old, current) ? 0 : 1);
} catch { process.exit(1); }`;
  try { strictHost(host, `node -e ${q(code)} ${q(worktree)}`); return true; } catch { return false; }
}

function cacheNoise(host, cache) {
  const code = String.raw`const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const root = process.argv[1], contents = new Set(), references = new Set();
function walk(dir, rel) {
  if (!fs.lstatSync(dir).isDirectory()) throw Error("not a directory");
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name), next = rel ? rel + "/" + name : name, st = fs.lstatSync(file);
    if (st.isSymbolicLink() || name === ".git") throw Error("unsafe");
    if (st.isDirectory()) {
      if (!/^(?:_logs|_cacache|_cacache\/tmp|_cacache\/content-v2|_cacache\/content-v2\/sha512|_cacache\/content-v2\/sha512\/[0-9a-f]{2}|_cacache\/content-v2\/sha512\/[0-9a-f]{2}\/[0-9a-f]{2}|_cacache\/index-v5|_cacache\/index-v5\/[0-9a-f]{2}|_cacache\/index-v5\/[0-9a-f]{2}\/[0-9a-f]{2})$/.test(next)) throw Error("unknown directory");
      walk(file, next); continue;
    }
    if (!st.isFile() || st.nlink !== 1) throw Error("not a regular file");
    if (/^_logs\/\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}_\d{3}Z-debug-\d+\.log$/.test(next)) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      if (!/^0 verbose cli /.test(lines[0]) || !/^1 info using npm@/.test(lines[1]) || !/^2 info using node@/.test(lines[2])) throw Error("bad npm log");
      continue;
    }
    const m = /^_cacache\/content-v2\/sha512\/([0-9a-f]{2})\/([0-9a-f]{2})\/([0-9a-f]{124})$/.exec(next);
    if (m) {
      if (crypto.createHash("sha512").update(fs.readFileSync(file)).digest("hex") !== m.slice(1).join("")) throw Error("bad content");
      contents.add(m.slice(1).join("")); continue;
    }
    if (/^_cacache\/index-v5\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{60}$/.test(next)) {
      for (const line of fs.readFileSync(file, "utf8").split("\n").filter(Boolean)) {
        const i = line.indexOf("\t"), body = line.slice(i + 1);
        if (i !== 40 || crypto.createHash("sha1").update(body).digest("hex") !== line.slice(0, i)) throw Error("bad index");
        const entry = JSON.parse(body); if (!entry || typeof entry.key !== "string" || typeof entry.integrity !== "string") throw Error("bad entry");
        const keyHash = crypto.createHash("sha256").update(entry.key).digest("hex");
        if (next !== "_cacache/index-v5/" + keyHash.slice(0, 2) + "/" + keyHash.slice(2, 4) + "/" + keyHash.slice(4)) throw Error("bad key");
        const match = /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(entry.integrity);
        if (!match) throw Error("bad integrity");
        const digest = Buffer.from(match[1], "base64");
        if (digest.length !== 64 || digest.toString("base64") !== match[1]) throw Error("bad digest");
        references.add(digest.toString("hex"));
      }
      continue;
    }
    throw Error("unknown file");
  }
}
try { walk(root, ""); process.exit(contents.size && references.size && [...contents].every((h) => references.has(h)) && [...references].every((h) => contents.has(h)) ? 0 : 1); } catch { process.exit(1); }`;
  try { strictHost(host, `node -e ${q(code)} ${q(cache)}`); return true; } catch { return false; }
}

// Minimal direct receipts may omit worker evidence; supplied identities must agree.
function suppliedWorkerIdentity(worker, host, receipt) {
  if (invalidIdentityHosts.has(host.name)) return false;
  const result = receipt.result, dispatch = result.dispatch, terminal = result.terminal;
  if (!identity(worker.dispatch) || !identity(worker.terminal) || !canonicalPath(worker.worktree, host) || !identity(dispatch?.runId) || !identity(dispatch?.taskId)) return invalidIdentity(host);
  if (dispatch.id !== worker.dispatch || terminal?.handle !== worker.terminal) return invalidIdentity(host);
  if (terminal?.worktreePath != null && terminal.worktreePath !== "" && terminal.worktreePath !== worker.worktree) return invalidIdentity(host);
  const w = result.worker, resource = result.projection?.resource, workspace = result.projection?.workspace;
  for (const [object, key] of [[result, "worker"], [result.projection, "workspace"]]) {
    if (object && Object.hasOwn(object, key) && (!object[key] || typeof object[key] !== "object" || Array.isArray(object[key]))) return invalidIdentity(host);
  }
  for (const [object, fields] of [
    [w, [["dispatchId", worker.dispatch], ["agentTerminalHandle", worker.terminal], ["runId", dispatch.runId], ["taskId", dispatch.taskId], ["dispatchStatus", dispatch.status], ["worktreePath", worker.worktree]]],
    [resource, [["terminalHandle", worker.terminal], ["ownerDispatchId", worker.dispatch], ["originDispatchId", worker.dispatch], ["worktreePath", worker.worktree]]],
    [workspace, [["path", worker.worktree]]]
  ]) for (const [key, expected] of fields) if (object && Object.hasOwn(object, key) && object[key] !== expected) return invalidIdentity(host);
  const ids = [];
  for (const [object, key] of [[w, "worktreeId"], [resource, "worktreeId"], [workspace, "id"], [terminal, "worktreeId"]]) {
    if (!object || !Object.hasOwn(object, key)) continue;
    if (!worktreeIdentity(object[key], host, worker.worktree) || (ids.length && object[key] !== ids[0]) || !associateWorktree(host, object[key], worker.worktree)) return invalidIdentity(host);
    ids.push(object[key]);
  }
  if (w && Object.hasOwn(w, "startOptions")) {
    const options = w.startOptions;
    if (!options || typeof options !== "object" || Array.isArray(options)) return invalidIdentity(host);
    if (Object.hasOwn(options, "name") && options.name !== posix.basename(worker.worktree)) return invalidIdentity(host);
    if (Object.hasOwn(options, "repo") && options.repo !== `id:${host.orcaRepoId}`) return invalidIdentity(host);
  }
  if (terminal && Object.hasOwn(terminal, "branch") && !terminalIdentities([terminal], host)) return invalidIdentity(host);
  return true;
}

function settledWorker(worker, host) {
  if (!worker.dispatch || RUNNER !== "orca" || invalidIdentityHosts.has(host.name)) return false;
  try {
    const receipt = parseEvidence(sh(ORCA, ["orchestration", "worker-show", "--dispatch", worker.dispatch, ...orcaEnvArgsOn(host), "--full", "--json"]));
    const dispatch = receipt.result?.dispatch, resource = receipt.result?.projection?.resource;
    if (receipt.ok !== true || !completeInventory(receipt, 1) || !suppliedWorkerIdentity(worker, host, receipt) || receipt.result?.terminal?.handle !== worker.terminal || !worker.terminal || !(receipt.result?.terminal?.worktreePath === worker.worktree || releasedIdentity(worker, host, receipt)) || dispatch?.id !== worker.dispatch || dispatch.status !== "completed" || typeof dispatch.runId !== "string" || !dispatch.runId || typeof dispatch.taskId !== "string" || !dispatch.taskId || typeof dispatch.completedAt !== "string" || !Number.isFinite(Date.parse(dispatch.completedAt)) || !["reclaimable", "released"].includes(resource?.terminalState)) return false;
    const inbox = parseEvidence(sh(ORCA, ["orchestration", "inbox", "--limit", "1000", "--full", ...orcaEnvArgsOn(host), "--json"]));
    return completeInbox(inbox) && readCompletion(inbox.result.messages, worker, dispatch);
  } catch { return false; }
}

function worktreeIdentities(trees, host) {
  const ids = new Set(), paths = new Set();
  for (const tree of trees) {
    if (!worktreeIdentity(tree?.id, host, tree?.path) || ids.has(tree.id) || !canonicalPath(tree.path, host) || paths.has(tree.path) || !associateWorktree(host, tree.id, tree.path)) return invalidIdentity(host);
    ids.add(tree.id); paths.add(tree.path);
  }
  return true;
}

// Every row must identify its resource; another live owner contradicts settlement.
function releasedRowAllowsCleanup(row, worktreeId, path, terminal, runId, host) {
  const resource = row.resource, workspace = row.projection?.workspace;
  if (row.runId !== runId || !identity(row.taskId) || !identity(row.agentTerminalHandle) || row.agentTerminalHandle !== resource?.terminalHandle || !identity(resource?.ownerDispatchId) || !identity(resource.originDispatchId)) return invalidIdentity(host);
  if (!worktreeIdentity(resource.worktreeId, host) || !worktreeIdentity(workspace?.id, host) || resource.worktreeId !== workspace.id || (Object.hasOwn(row, "worktreeId") && row.worktreeId !== resource.worktreeId)) return invalidIdentity(host);
  const paths = resource.worktreeId.includes("::") ? [resource.worktreeId.slice(resource.worktreeId.indexOf("::") + 2)] : [];
  for (const [object, key] of [[row, "worktreePath"], [resource, "worktreePath"], [workspace, "path"]]) {
    if (!Object.hasOwn(object, key)) continue;
    if (!canonicalPath(object[key], host) || (object[key] === path) !== (resource.worktreeId === worktreeId) || (paths.length && object[key] !== paths[0])) return invalidIdentity(host);
    paths.push(object[key]);
  }
  if (paths.length && !associateWorktree(host, resource.worktreeId, paths[0])) return false;
  if (resource.worktreeId !== worktreeId && row.agentTerminalHandle !== terminal) return true;
  return (row.dispatchStatus === "completed" && row.terminalState === "released" && (!Object.hasOwn(resource, "terminalState") || resource.terminalState === "released") && resource.ownershipState === "released" && resource.releaseState === "released" && Number.isFinite(Date.parse(resource.releaseCompletedAt))) || invalidIdentity(host);
}

// A controller start records the dispatch, terminal and original worktree path together.
function releasedIdentity(worker, host, shown) {
  try {
    const d = shown.result?.dispatch, w = shown.result?.worker, options = w?.startOptions;
    const root = workspacesOn(host), path = worker.worktree;
    if ((shown.result?.terminal?.worktreePath != null && shown.result.terminal.worktreePath !== "") || !worker.terminal || typeof path !== "string" || !path.startsWith(root) || !path.slice(root.length) || path.slice(root.length).includes("/") || !host.orcaRepoId || !["new-child", "new-top-level"].includes(options?.worktree) || options.name !== path.slice(root.length) || options.repo !== `id:${host.orcaRepoId}` || w.dispatchId !== worker.dispatch || w.agentTerminalHandle !== worker.terminal || !w.worktreeId || d?.id !== worker.dispatch || d.status !== "completed" || !d.runId || !d.taskId || !Number.isFinite(Date.parse(d.completedAt)) || shown.result?.terminal?.handle !== worker.terminal || shown.result?.projection?.resource?.terminalState !== "released") return false;
    const terms = terminalsOf(host);
    if (!terms || terms.some(t => t.handle === worker.terminal || t.worktreePath === path)) return false;
    const rows = [], cursors = new Set();
    let cursor, total, traversalScope, count = 0;
    const ids = new Set();
    for (;;) {
      const list = parseEvidence(sh(ORCA, ["orchestration", "worker-list", "--run", d.runId, "--limit", "100", "--full", ...(cursor ? ["--cursor", cursor] : []), ...orcaEnvArgsOn(host), "--json"]));
      const page = list.result?.page, batch = list.result?.workers;
      if (list.ok !== true || !Array.isArray(batch) || batch.length === 0 || batch.length > 100 || !Number.isSafeInteger(page?.total) || page.total < 0 || typeof page.hasMore !== "boolean" || (total !== undefined && total !== page.total)) return false;
      if (!completeInventory(list, batch.length, page.total, page.hasMore, page.nextCursor ?? null, cursor ?? null, count)) return false;
      const scope = list.result.hostScope ?? list.hostScope ?? page.hostScope ?? list.page?.hostScope;
      const scopeKey = scope ? JSON.stringify([...scope.hostIds].sort()) : null;
      if (count > 0 && scopeKey !== traversalScope) return false;
      traversalScope = scopeKey;
      total = page.total;
      count += batch.length;
      if (count > total) return false;
      for (const r of batch) {
        if (!identity(r?.dispatchId) || ids.has(r.dispatchId) || !releasedRowAllowsCleanup(r, w.worktreeId, path, worker.terminal, d.runId, host)) return invalidIdentity(host);
        ids.add(r.dispatchId);
      }
      rows.push(...batch.filter(r => r.dispatchId === worker.dispatch));
      if (!page.hasMore) { if (page.nextCursor != null || count !== total) return false; break; }
      if (count >= total) return false;
      cursor = list.result.page.nextCursor;
      if (typeof cursor !== "string" || !cursor || cursors.has(cursor) || cursors.size >= 100) return false;
      cursors.add(cursor);
    }
    if (rows.length !== 1) return false;
    const r = rows[0], resource = r.resource;
    if (r.runId !== d.runId || r.taskId !== d.taskId || r.dispatchStatus !== "completed" || r.agentTerminalHandle !== worker.terminal || r.terminalState !== "released" || resource?.terminalHandle !== worker.terminal || resource.worktreeId !== w.worktreeId || resource.originDispatchId !== worker.dispatch || resource.ownerDispatchId !== worker.dispatch || resource.ownershipState !== "released" || resource.releaseState !== "released" || !Number.isFinite(Date.parse(resource.releaseCompletedAt)) || r.projection?.workspace?.id !== w.worktreeId || r.projection?.evidence?.durable !== true) return invalidIdentity(host);
    const entries = strictHost(host, `git -C ${q(projectDirOn(host))} worktree list --porcelain`).split("\n");
    if (entries.includes(`worktree ${path}`)) {
      const trees = parseEvidence(sh(ORCA, ["worktree", "list", "--repo", `id:${host.orcaRepoId}`, "--limit", "1000", ...orcaEnvArgsOn(host), "--json"]));
      const result = trees.result;
      if (trees.ok !== true || !Array.isArray(result?.worktrees) || !worktreeIdentities(result.worktrees, host) || !completeInventory(trees, result.worktrees.length) || !Number.isSafeInteger(result.totalCount) || result.truncated !== false || result.totalCount !== result.worktrees.length || !Array.isArray(result.hostScope?.hostIds) || !result.hostScope.hostIds.length || !Array.isArray(result.hostScope.omittedHostIds) || result.hostScope.omittedHostIds.length || result.worktrees.filter(t => t.path === path && t.id === w.worktreeId).length !== 1 || result.worktrees.filter(t => t.path === path || t.id === w.worktreeId).length !== 1) return false;
    }
    const inbox = parseEvidence(sh(ORCA, ["orchestration", "inbox", "--limit", "1000", "--full", ...orcaEnvArgsOn(host), "--json"]));
    return completeInbox(inbox) && readCompletion(inbox.result.messages, worker, d);
  } catch { return false; }
}

// Optional metadata must agree at every supplied receipt level.
function completeInventory(receipt, count, total = count, hasMore = false, nextCursor = null, cursor = null, offset = 0) {
  let scopeIds;
  const complete = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
    if (Object.hasOwn(metadata, "hostScope")) {
      const scope = metadata.hostScope;
      if (!scope || !Array.isArray(scope.hostIds) || !scope.hostIds.length || !scope.hostIds.every(id => typeof id === "string" && id.trim() === id && id.length > 0) || !Array.isArray(scope.omittedHostIds) || scope.omittedHostIds.length) return false;
      const ids = new Set(scope.hostIds);
      if (ids.size !== scope.hostIds.length || (scopeIds && (ids.size !== scopeIds.size || scope.hostIds.some(id => !scopeIds.has(id))))) return false;
      scopeIds = ids;
    }
    for (const [key, expected] of [["truncated", false], ["hasMore", hasMore], ["complete", true], ["count", count], ["total", total], ["totalCount", total], ["nextCursor", nextCursor], ["cursor", cursor], ["offset", offset]]) {
      if (Object.hasOwn(metadata, key) && metadata[key] !== expected) return false;
    }
    return true;
  };
  for (const metadata of [receipt, receipt.result]) {
    if (!complete(metadata)) return false;
    if (Object.hasOwn(metadata, "page")) {
      const page = metadata.page;
      if (!complete(page) || !Object.hasOwn(page, "total") || page.hasMore !== hasMore) return false;
    }
  }
  return true;
}

function completeInbox(receipt) {
  const result = receipt.result;
  if (receipt.ok !== true || !Array.isArray(result?.messages) || !Number.isSafeInteger(result.count) || result.count !== result.messages.length || result.count >= 1000) return false;
  return completeInventory(receipt, result.count);
}

function readCompletion(messages, worker, dispatch) {
  const matches = [];
  for (const m of messages) {
    if (!m || typeof m.type !== "string" || !m.type || m.type.trim() !== m.type) return false;
    if (m.type !== "worker_done") continue;
    const sameSource = m.from_handle === worker.terminal && m.run_id === dispatch.runId;
    if (typeof m.payload !== "string") return false;
    let payload;
    try { payload = parseEvidence(m.payload); } catch { return false; }
    // Unreadable identities cannot prove that a completion belongs to another worker.
    if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
        ![payload.taskId, payload.dispatchId, m.from_handle, m.run_id].every(id => typeof id === "string" && id.trim() === id && id.length > 0)) return false;
    if (payload.dispatchId === worker.dispatch) {
      if (!sameSource || payload.taskId !== dispatch.taskId) return false;
      matches.push(m);
    }
  }
  return matches.length === 1 && matches[0].read === 1 && Math.floor(Date.parse(matches[0].created_at) / 1000) === Math.floor(Date.parse(dispatch.completedAt) / 1000);
}

// Check decoded keys before JSON.parse can discard contradictory evidence.
function parseEvidence(text) {
  try {
    if (typeof text !== "string" || Buffer.byteLength(text, "utf8") > 8 * 1024 * 1024) throw new Error();
    const stack = [];
    let previous, count = 0;
    for (let i = 0; i < text.length;) {
      if (/\s/.test(text[i])) { i++; continue; }
      const start = i;
      if (text[i] === '"') {
        let closed = false;
        i++;
        while (i < text.length) {
          const char = text[i++];
          if (char === "\\") i++;
          else if (char === '"') { closed = true; break; }
        }
        if (!closed) throw new Error();
      } else if ('{}[]:,'.includes(text[i])) i++;
      else while (i < text.length && !/[\s{}\[\]:,"]/.test(text[i])) i++;
      const token = text.slice(start, i);
      if (++count > 250000) throw new Error();
      if (token === "{" || token === "[") {
        if (stack.length >= 64) throw new Error();
        stack.push(token === "{" ? new Set() : null);
      } else if (token === "}" || token === "]") stack.pop();
      else if (token === ":") {
        const keys = stack.at(-1), key = JSON.parse(previous);
        if (!(keys instanceof Set) || typeof key !== "string" || keys.has(key)) throw new Error();
        keys.add(key);
      }
      previous = token;
    }
    return JSON.parse(text);
  } catch { throw new Error("invalid or ambiguous JSON evidence"); }
}
