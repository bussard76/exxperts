import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, symlinkSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

const source = path.resolve(import.meta.dirname, 'cleanup.mjs');
function git(cwd, ...args) { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'cleanup-synthetic-'));
  const project = path.join(dir, 'project'), remote = path.join(dir, 'remote.git');
  const ws = path.join(dir, 'workspaces', 'demo'), wt = path.join(ws, 'finished'), ctl = path.join(dir, 'controller');
  for (const p of [project, ws, ctl]) mkdirSync(p, { recursive: true });
  git(project, 'init', '-b', 'main'); git(project, 'config', 'user.email', 'demo@example.invalid'); git(project, 'config', 'user.name', 'Demo');
  writeFileSync(path.join(project, 'file'), 'demo\n'); writeFileSync(path.join(project, 'package-lock.json'), JSON.stringify({packages:{'node_modules/demo':{libc:['glibc']}}}, null, 2) + '\n'); git(project, 'add', 'file', 'package-lock.json'); git(project, 'commit', '-m', 'initial');
  execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore' });
  git(project, 'remote', 'add', 'origin', remote); git(project, 'push', '-u', 'origin', 'main');
  git(project, 'worktree', 'add', '-b', 'agents/demo', wt); git(wt, 'push', '-u', 'origin', 'agents/demo');
  copyFileSync(source, path.join(ctl, 'cleanup.mjs'));
  const cfg = { project: { name: 'demo', mainBranch: 'main' }, agents: { runner: 'orca' }, hosts: { controller: { host: 'local' }, workers: [{ name: 'local', kind: 'local', orcaRepoId: 'demo', projectDir: project, workspacesDir: path.join(dir, 'workspaces') }] } };
  writeFileSync(path.join(ctl, 'factory.config.json'), JSON.stringify(cfg));
  copyFileSync(path.resolve(import.meta.dirname, '../../lib.mjs'), path.join(ctl, 'lib.mjs'));
  writeFileSync(path.join(ctl, 'workers.json'), '{}');
  writeFileSync(path.join(ctl, 'names.mjs'), '');
  const orca = path.join(dir, 'orca');
  writeFileSync(orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ \"$2\" = worker-show ]; then printf '%s\\n' '{\"ok\":true,\"result\":{\"dispatch\":{\"id\":\"demo-dispatch\",\"taskId\":\"task_demo\",\"runId\":\"run_demo\",\"status\":\"completed\",\"completedAt\":\"2026-01-01T00:00:00.000Z\"},\"terminal\":{\"handle\":\"term_demo\",\"worktreePath\":\"${wt}\"},\"projection\":{\"resource\":{\"terminalState\":\"released\"}}}}'; else printf '%s\\n' '{\"ok\":true,\"result\":{\"terminals\":[],\"totalCount\":0,\"truncated\":false,\"hostScope\":{\"hostIds\":[\"host_demo\"],\"omittedHostIds\":[]}}}'; fi\n`, { mode: 0o755 });
  return { dir, project, wt, ctl, orca };
}
test('unknown worker history keeps a pushed worktree', () => {
  const f = fixture();
  try {
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /removed 0 worktrees, kept 1/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a live setup terminal protects its worktree', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ \"$2\" = worker-show ]; then printf '%s\\n' '{\"ok\":true,\"result\":{\"dispatch\":{\"id\":\"demo-dispatch\",\"taskId\":\"task_demo\",\"runId\":\"run_demo\",\"status\":\"completed\",\"completedAt\":\"2026-01-01T00:00:00.000Z\"},\"terminal\":{\"handle\":\"term_demo\",\"worktreePath\":\"${f.wt}\"},\"projection\":{\"resource\":{\"terminalState\":\"released\"}}}}'; else printf '%s\\n' '${JSON.stringify({ok:true,result:{terminals:[{handle:'term_setup',title:'Demo · Setup',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}})}'; fi\n`, { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /removed 0 worktrees, kept 1/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('ignored artifacts protect a worktree', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.project, '.git', 'info', 'exclude'), 'private-output\n');
    writeFileSync(path.join(f.wt, 'private-output'), 'invented work\n');
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /removed 0 worktrees, kept 1/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a worker record without proven settlement does not authorize cleanup', () => {
  const f = fixture();
  try {
    writeFileSync(f.orca, '#!/bin/sh\nprintf \'{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}\\n\'\n', { mode: 0o755 });
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /removed 0 worktrees, kept 1/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed git status never permits a removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" status "*) exit 42;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a merged branch with unpushed commits is kept', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'file'), 'new invented work\n'); git(f.wt, 'commit', '-am', 'work');
    git(f.project, 'merge', '--ff-only', 'agents/demo'); git(f.project, 'push', 'origin', 'main');
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('failed fetch stops cleanup before worktree removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" fetch "*) exit 42;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.notEqual(r.status, 0, r.stdout);
    assert.doesNotMatch(r.stdout, /removed 1 worktrees/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('remote pruning refuses an unverified destination', () => {
  const f = fixture();
  try {
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--prune-remote'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /pruned [1-9]/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a remote branch that moved after the snapshot is kept', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const old = git(f.wt, 'rev-parse', 'HEAD');
    writeFileSync(path.join(f.wt, 'file'), 'new invented work\n'); git(f.wt, 'commit', '-am', 'work'); git(f.wt, 'push', 'origin', 'HEAD:refs/heads/agents/demo');
    git(f.wt, 'reset', '--hard', old); git(f.project, 'update-ref', 'refs/remotes/origin/agents/demo', old);
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('an attached live terminal protects its merged remote branch', () => {
  const f = fixture();
  try {
    writeFileSync(f.orca, `#!/bin/sh\nprintf '%s\\n' '${JSON.stringify({ok:true,result:{terminals:[{handle:'term_setup',title:'Demo · Setup',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}})}'\n`, { mode: 0o755 });
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--prune-remote'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /pruned [1-9]/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('unknown worker state protects a merged remote branch', () => {
  const f = fixture();
  try {
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--prune-remote'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /pruned [1-9]/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('dry run counts validated install noise and its subsequent removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'package-lock.json'), JSON.stringify({packages:{'node_modules/demo':{}}}, null, 2) + '\n');
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.match(r.stdout, /removed 1 worktrees, kept 0/);
    assert.match(r.stdout, /cleaned 1 install-noise worktrees/);
    assert.match(git(f.wt, 'status', '--porcelain'), /package-lock.json/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a regular lockfile containing other changes is kept', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'package-lock.json'), '{"name":"invented user change","packages":{}}\n');
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would clean|would remove/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a cache containing symlinks is preserved', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const cache = path.join(f.wt, '.npm-review-cache'); mkdirSync(cache);
    symlinkSync('invented-target', path.join(cache, 'user-link'));
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would clean|would remove/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
function addCacheIndex(wt, hash) {
  const key = 'demo-cache-key', k = createHash('sha256').update(key).digest('hex');
  const dir = path.join(wt, '.npm-review-cache', '_cacache', 'index-v5', k.slice(0, 2), k.slice(2, 4));
  mkdirSync(dir, {recursive:true});
  const body = JSON.stringify({key, integrity:'sha512-' + Buffer.from(hash, 'hex').toString('base64')});
  writeFileSync(path.join(dir, k.slice(4)), '\n' + createHash('sha1').update(body).digest('hex') + '\t' + body + '\n');
}
test('a content-addressed disposable npm cache can be simulated', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const data = 'invented cache content', hash = createHash('sha512').update(data).digest('hex');
    const cache = path.join(f.wt, '.npm-review-cache', '_cacache', 'content-v2', 'sha512', hash.slice(0, 2), hash.slice(2, 4));
    mkdirSync(cache, { recursive: true }); writeFileSync(path.join(cache, hash.slice(4)), data);
    addCacheIndex(f.wt, hash);
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.match(r.stdout, /removed 1 worktrees, kept 0/);
    assert.match(r.stdout, /cleaned 1 install-noise worktrees/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a terminal appearing after the first observation stops removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const flag = path.join(f.dir, 'seen');
    const live = JSON.stringify({ok:true,result:{terminals:[{handle:'term_shell',title:'Demo · Shell',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}});
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; elif [ -e '${flag}' ]; then echo '${live}'; else touch '${flag}'; echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('an unverifiable dispatch is not released or forgotten', () => {
  const f = fixture();
  try {
    writeFileSync(f.orca, '#!/bin/sh\nprintf \'{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}\\n\'\n', { mode: 0o755 });
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'demo-terminal', dispatch: 'demo-dispatch' } }));
    spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.ok(JSON.parse(readFileSync(path.join(f.ctl, 'workers.json'), 'utf8')).demo);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('worktree changes after the first status check stop removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const flag = path.join(f.dir, 'seen');
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then if [ -e '${flag}' ]; then echo work > '${f.wt}/new-user-file'; else touch '${flag}'; fi; echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed restore is reported as failure and never counts as clean', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'package-lock.json'), JSON.stringify({packages:{'node_modules/demo':{}}}, null, 2) + '\n');
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" restore "*) exit 42;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.notEqual(r.status, 0, r.stdout);
    assert.doesNotMatch(r.stdout, /cleaned 1 install-noise/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a merged remote branch is deleted with its expected SHA lease', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const existingFake = readFileSync(f.orca, 'utf8');
    writeFileSync(f.orca, existingFake.replace('if [ "$2" = worker-show ]', `if [ "$1" = worktree ]; then /usr/bin/git -C '${f.project}' worktree remove '${f.wt}' || exit $?; echo '{"ok":true}'; elif [ "$2" = worker-show ]`), {mode:0o755});
    const sha = git(f.wt, 'rev-parse', 'HEAD'), log = path.join(f.dir, 'git-calls');
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), `#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\necho "$*" >> '${log}'\nexec /usr/bin/git "$@"\n`, { mode: 0o755 });
    spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--prune-remote'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.match(readFileSync(log, 'utf8'), new RegExp(`--force-with-lease=refs/heads/agents/demo:${sha}`));
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a remote branch moved just before push survives the SHA lease', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const existingFake = readFileSync(f.orca, 'utf8');
    writeFileSync(f.orca, existingFake.replace('if [ "$2" = worker-show ]', `if [ "$1" = worktree ]; then /usr/bin/git -C '${f.project}' worktree remove '${f.wt}' || exit $?; echo '{"ok":true}'; elif [ "$2" = worker-show ]`), {mode:0o755});
    const tree = git(f.project, 'rev-parse', 'HEAD^{tree}');
    const newSha = execFileSync('git', ['-C', f.project, 'commit-tree', tree, '-p', 'HEAD', '-m', 'invented new commit'], { encoding: 'utf8' }).trim();
    git(f.project, 'push', 'origin', `${newSha}:refs/heads/invented`);
    const bare = path.join(f.dir, 'remote.git'); const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), `#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; *" push "*) /usr/bin/git -C '${bare}' update-ref refs/heads/agents/demo '${newSha}';; esac\nexec /usr/bin/git "$@"\n`, { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--prune-remote'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.notEqual(r.status, 0);
    assert.equal(git(bare, 'rev-parse', 'refs/heads/agents/demo'), newSha);
    assert.doesNotMatch(r.stdout, /pruned 1 remote/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a new file after lockfile restore prevents subsequent cache deletion', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'package-lock.json'), JSON.stringify({packages:{'node_modules/demo':{}}}, null, 2) + '\n');
    const data = 'invented cache content', hash = createHash('sha512').update(data).digest('hex');
    const root = path.join(f.wt, '.npm-review-cache'), cache = path.join(root, '_cacache', 'content-v2', 'sha512', hash.slice(0, 2), hash.slice(2, 4));
    mkdirSync(cache, { recursive: true }); writeFileSync(path.join(cache, hash.slice(4)), data);
    addCacheIndex(f.wt, hash);
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), `#!/bin/sh\ncase " $* " in *" restore "*) /usr/bin/git "$@" || exit $?; echo user-work > '${f.wt}/new-file'; exit 0;; esac\nexec /usr/bin/git "$@"\n`, {mode:0o755});
    spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.ok(existsSync(root));
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed worktree removal is reported as failure', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; elif [ "$1" = worktree ]; then echo '{"ok":false}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /removed 1 worktrees/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed merge-base command does not count as a valid ancestry check', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" merge-base "*) exit 42;; esac\nexec /usr/bin/git "$@"\n', { mode: 0o755 });
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('staged lockfile changes and a lockfile symlink are preserved', () => {
  for (const kind of ['staged', 'symlink']) {
    const f = fixture();
    try {
      writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
      const lock = path.join(f.wt, 'package-lock.json');
      if (kind === 'staged') { writeFileSync(lock, '{"packages":{"node_modules/demo":{}}}\n'); git(f.wt, 'add', 'package-lock.json'); }
      else { rmSync(lock); symlinkSync('invented-target', lock); }
      const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
      assert.doesNotMatch(r.stdout, /would clean|would remove/, kind);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});
test('hidden files and nested Git repositories in the cache are preserved', () => {
  for (const kind of ['hidden', 'nested']) {
    const f = fixture();
    try {
      writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
      const cache = path.join(f.wt, '.npm-review-cache'); mkdirSync(cache);
      if (kind === 'hidden') writeFileSync(path.join(cache, '.work'), 'invented work');
      else { mkdirSync(path.join(cache, '.git')); writeFileSync(path.join(cache, '.git', 'HEAD'), 'invented'); }
      const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
      assert.doesNotMatch(r.stdout, /would clean|would remove/, kind);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});
test('the two protected branches are never removed', () => {
  for (const branch of ['agents/t4-design', 'agents/workspace-file-tabs-draft']) {
    const f = fixture();
    try {
      git(f.wt, 'branch', '-m', branch); git(f.wt, 'push', 'origin', branch);
      writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
      const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
      assert.doesNotMatch(r.stdout, /would clean|would remove/, branch);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});
test('a failed terminal-list receipt never grants permission to remove', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":false,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
    assert.match(r.stdout, /removed 0 worktrees, kept 1/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a live integration terminal is not closed based on old output', () => {
  const f = fixture();
  try {
    const log = path.join(f.dir, 'orca-calls'), integration = path.join(f.dir, 'workspaces', 'demo', 'coordinator-integration');
    const terms = JSON.stringify({ok:true,result:{terminals:[{handle:'integration',title:'Coordinator Demo',worktreePath:integration}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}});
    writeFileSync(f.orca, `#!/bin/sh\necho "$*" >> '${log}'\nif [ "$2" = list ]; then echo '${terms}'; elif [ "$2" = read ]; then echo WAVE-END; else echo '{"ok":true}'; fi\n`, {mode:0o755});
    spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(readFileSync(log, 'utf8'), /terminal close/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed worktree receipt cannot be masked by nested ok data', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; elif [ "$1" = worktree ]; then echo '{"ok":false,"result":{"ok":true}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /removed 1 worktrees/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('lockfile formatting outside normal npm output is preserved', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(path.join(f.wt, 'package-lock.json'), '{ "packages": { "node_modules/demo": {} } }\n');
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would clean|would remove/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a live terminal without a verified worktree makes state unknown', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[{"status":"running","title":"Demo · Shell"}]}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a reclaimable terminal is not proof that its dispatch is settled', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"terminalState":"released","dispatch":{"status":"dispatched","completedAt":null},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.doesNotMatch(r.stdout, /would remove finished/);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('a failed release receipt cannot erase the worker record', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'demo-terminal', dispatch: 'demo-dispatch' } }));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; elif [ "$2" = worker-release ]; then echo '{"ok":false,"result":{"ok":true}}'; elif [ "$1" = worktree ]; then echo '{"ok":true}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], { encoding: 'utf8', env: { ...process.env, ORCA_CLI_COMMAND: f.orca } });
    assert.ok(JSON.parse(readFileSync(path.join(f.ctl, 'workers.json'), 'utf8')).demo);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
test('remote branches outside agents are preserved', () => {
  const f = fixture();
  try {
    git(f.project, 'push', 'origin', 'HEAD:refs/heads/feat/demo');
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
    writeFileSync(path.join(bin, 'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--prune-remote'], {encoding:'utf8', env:{...process.env, PATH:`${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND:f.orca}});
    assert.equal(r.status, 0, r.stderr);
    assert.ok(git(path.join(f.dir, 'remote.git'), 'rev-parse', '--verify', 'refs/heads/feat/demo'));
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});
test('a cache-shaped blob without a valid index is preserved', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({ demo: { host: 'local', worktree: f.wt, terminal: 'term_demo', dispatch: 'demo-dispatch' } }));
    const data = 'invented user artifact', hash = createHash('sha512').update(data).digest('hex');
    const cache = path.join(f.wt, '.npm-review-cache', '_cacache', 'content-v2', 'sha512', hash.slice(0, 2), hash.slice(2, 4));
    mkdirSync(cache, { recursive: true }); writeFileSync(path.join(cache, hash.slice(4)), data);
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--dry', '--pushed', '--install-noise'], {encoding:'utf8', env:{...process.env, ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(r.stdout, /would clean|would remove/);
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});
test('failed cache deletion is reported and the cache is preserved', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local', worktree:f.wt, terminal:'term_demo', dispatch:'demo-dispatch'}}));
    const data = 'invented cache', hash = createHash('sha512').update(data).digest('hex');
    const cache = path.join(f.wt, '.npm-review-cache', '_cacache', 'content-v2', 'sha512', hash.slice(0, 2), hash.slice(2, 4));
    mkdirSync(cache, {recursive:true}); writeFileSync(path.join(cache, hash.slice(4)), data); addCacheIndex(f.wt, hash);
    const bin = path.join(f.dir, 'bin'); mkdirSync(bin); writeFileSync(path.join(bin, 'rm'), '#!/bin/sh\nexit 42\n', {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed', '--install-noise'], {encoding:'utf8', env:{...process.env, PATH:`${bin}:${process.env.PATH}`, ORCA_CLI_COMMAND:f.orca}});
    assert.notEqual(r.status, 0); assert.ok(existsSync(cache)); assert.doesNotMatch(r.stdout, /cleaned 1 install-noise/);
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});
test('a clean settled and pushed worktree is actually removed in the synthetic repository', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local', worktree:f.wt, terminal:'term_demo', dispatch:'demo-dispatch'}}));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; elif [ "$1" = worktree ]; then /usr/bin/git -C '${f.project}' worktree remove '${f.wt}' || exit $?; echo '{"ok":true}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), '--pushed'], {encoding:'utf8', env:{...process.env, ORCA_CLI_COMMAND:f.orca}});
    assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /removed 1 worktrees/); assert.equal(existsSync(f.wt), false);
  } finally { rmSync(f.dir, {recursive:true, force:true}); }
});
test('protected remote refs remain even when merged', () => {
  const f = fixture();
  try {
    for (const branch of ['agents/t4-design','agents/workspace-file-tabs-draft']) git(f.project, 'push', 'origin', `HEAD:refs/heads/${branch}`);
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local', worktree:f.wt, terminal:'term_demo', dispatch:'demo-dispatch'}}));
    const bin = path.join(f.dir,'bin'); mkdirSync(bin); writeFileSync(path.join(bin,'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', {mode:0o755});
    const r = spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--prune-remote'],{encoding:'utf8',env:{...process.env,PATH:`${bin}:${process.env.PATH}`,ORCA_CLI_COMMAND:f.orca}});
    assert.equal(r.status,0,r.stderr);
    for (const branch of ['agents/t4-design','agents/workspace-file-tabs-draft']) assert.ok(git(path.join(f.dir,'remote.git'),'rev-parse','--verify',`refs/heads/${branch}`));
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('a real npm cache generated offline from an invented package can be simulated', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local', worktree:f.wt, terminal:'term_demo', dispatch:'demo-dispatch'}}));
    const pkg = path.join(f.dir, 'package'); mkdirSync(pkg); writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({name:'invented-cleanup-fixture',version:'1.0.0'}));
    const env = {...process.env,HOME:f.dir,npm_config_update_notifier:'false'};
    execFileSync('npm', ['pack',pkg,'--offline','--pack-destination',f.dir,'--cache',path.join(f.dir,'pack-cache')], {stdio:'pipe',env});
    execFileSync('npm', ['cache','add',path.join(f.dir,'invented-cleanup-fixture-1.0.0.tgz'),'--cache',path.join(f.wt,'.npm-review-cache'),'--offline'], {stdio:'pipe',env});
    const r = spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed','--install-noise'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.match(r.stdout,/cleaned 1 install-noise worktrees/);
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('a settled dispatch for a different worktree cannot authorize removal', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const receipt = JSON.stringify({ok:true,result:{dispatch:{id:'demo-dispatch',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'},terminal:{worktreePath:f.project},projection:{resource:{terminalState:'reclaimable'}}}});
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '${receipt}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`,{mode:0o755});
    const r = spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(r.stdout,/would remove finished/);
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('a new hidden artifact inside the cache during recheck is not deleted', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const data='invented cache', hash=createHash('sha512').update(data).digest('hex'), root=path.join(f.wt,'.npm-review-cache');
    const cache=path.join(root,'_cacache','content-v2','sha512',hash.slice(0,2),hash.slice(2,4)); mkdirSync(cache,{recursive:true}); writeFileSync(path.join(cache,hash.slice(4)),data); addCacheIndex(f.wt,hash);
    const counter=path.join(f.dir,'count'), receipt=JSON.stringify({ok:true,result:{dispatch:{id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'},terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:'reclaimable'}}}});
    writeFileSync(f.orca,`#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then n=0; [ ! -f '${counter}' ] || n=$(cat '${counter}'); n=$((n+1)); echo "$n" > '${counter}'; if [ "$n" -eq 3 ]; then echo invented > '${root}/.user-work'; fi; echo '${receipt}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`,{mode:0o755});
    spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed','--install-noise'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.ok(existsSync(path.join(root,'.user-work')));
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('complete real-shaped live terminal receipt without status permits a settled pushed worktree', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[{"handle":"term_other","worktreePath":"/demo/other"}],"totalCount":1,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/would remove finished/);
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('truncated real-shaped terminal list never permits cleanup', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    writeFileSync(f.orca, `#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":1,"truncated":true}}'; fi\n`, {mode:0o755});
    const r = spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.notEqual(r.status,0); assert.doesNotMatch(r.stdout,/would remove finished/);
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});
test('forbidden local branch prefixes are never cleaned or removed', () => {
  for (const branch of ['exxeta/demo','feat/demo','implement-demo','factory/demo']) {
    const f=fixture();
    try {
      git(f.wt,'branch','-m',branch); git(f.wt,'push','origin',branch);
      writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
      writeFileSync(f.orca,`#!/bin/sh\nif [ "$2" = inbox ]; then echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_demo","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"demo-dispatch\\"}"}],"count":1}}'; exit 0; fi\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","taskId":"task_demo","runId":"run_demo","status":"completed","completedAt":"2026-01-01T00:00:00.000Z"},"terminal":{"handle":"term_demo","worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"released"}}}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; fi\n`,{mode:0o755});
      const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed','--install-noise'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
      assert.equal(r.status,0,r.stderr); assert.doesNotMatch(r.stdout,/would clean|would remove/,branch);
    } finally {rmSync(f.dir,{recursive:true,force:true});}
  }
});
test('a settled worker terminal is released only after its done message was read', () => {
  for (const variant of ['unread','read','saturated','missing-count','duplicate']) {
    const read = variant === 'unread' ? 0 : 1;
    const f=fixture(), calls=path.join(f.dir,'calls');
    try {
      writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
      const show={ok:true,result:{dispatch:{id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'},terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:'reclaimable'}}}};
      const list={ok:true,result:{terminals:[{handle:'term_demo',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}};
      const inbox={ok:true,result:{messages:[{type:'worker_done',read,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00.000Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
      if (variant==='saturated') { while (inbox.result.messages.length<1000) inbox.result.messages.push({type:'other'}); inbox.result.count=1000; }
      if (variant==='missing-count') delete inbox.result.count;
      if (variant==='duplicate') { inbox.result.messages.push({...inbox.result.messages[0],read:0}); inbox.result.count=2; }
      writeFileSync(f.orca,`#!/bin/sh\necho "$*" >> '${calls}'\ncase "$2" in worker-show) echo '${JSON.stringify(show)}';; inbox) echo '${JSON.stringify(inbox)}';; list) echo '${JSON.stringify(list)}';; worker-release) echo '{"ok":true,"result":{"status":"released"}}';; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
      spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
      const log=readFileSync(calls,'utf8'); if(variant==='read') assert.match(log,/orchestration worker-release/); else assert.doesNotMatch(log,/orchestration worker-release/,variant);
    } finally {rmSync(f.dir,{recursive:true,force:true});}
  }
});
test('a retained release receipt is not counted as a closed terminal', () => {
  const f=fixture();
  try {
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const show={ok:true,result:{dispatch:{id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'},terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:'reclaimable'}}}};
    const list={ok:true,result:{terminals:[{handle:'term_demo',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}};
    const inbox={ok:true,result:{messages:[{type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00.000Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
    writeFileSync(f.orca,`#!/bin/sh\ncase "$2" in worker-show) echo '${JSON.stringify(show)}';; inbox) echo '${JSON.stringify(inbox)}';; list) echo '${JSON.stringify(list)}';; worker-release) echo '{"ok":true,"result":{"status":"retained"}}';; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(r.stdout,/released 1 dispatches/); assert.ok(JSON.parse(readFileSync(path.join(f.ctl,'workers.json'),'utf8')).demo);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('action errors retain partial success and before/after worktree counts', () => {
  const f=fixture();
  try {
    const second=path.join(path.dirname(f.wt),'second'); git(f.project,'worktree','add','-b','agents/second',second); git(second,'push','-u','origin','agents/second');
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({a:{host:'local',worktree:f.wt,terminal:'term_a',dispatch:'a'},b:{host:'local',worktree:second,terminal:'term_b',dispatch:'b'}}));
    writeFileSync(f.orca,`#!/bin/sh\ncase "$2" in worker-show) if [ "$4" = a ]; then id=a; wt='${f.wt}'; else id=b; wt='${second}'; fi; echo "{\\"ok\\":true,\\"result\\":{\\"dispatch\\":{\\"id\\":\\"$id\\",\\"taskId\\":\\"task_demo\\",\\"runId\\":\\"run_demo\\",\\"status\\":\\"completed\\",\\"completedAt\\":\\"2026-01-01T00:00:00Z\\"},\\"terminal\\":{\\"handle\\":\\"term_$id\\",\\"worktreePath\\":\\"$wt\\"},\\"projection\\":{\\"resource\\":{\\"terminalState\\":\\"released\\"}}}}";; inbox) echo '{"ok":true,"result":{"messages":[{"type":"worker_done","read":1,"from_handle":"term_a","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"a\\"}"},{"type":"worker_done","read":1,"from_handle":"term_b","run_id":"run_demo","created_at":"2026-01-01T00:00:00Z","payload":"{\\"taskId\\":\\"task_demo\\",\\"dispatchId\\":\\"b\\"}"}],"count":2}}';; list) echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}';; rm) /usr/bin/git -C '${f.project}' worktree remove '${f.wt}' && echo '{"ok":true}';; *) echo '{"ok":true,"result":{"messages":[]}}';; esac\n`,{mode:0o755});
    const bin=path.join(f.dir,'bin');mkdirSync(bin);writeFileSync(path.join(bin,'git'),`#!/bin/sh\ncase "$*" in *'${second} status'*) exit 42;; esac\nexec /usr/bin/git "$@"\n`,{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,PATH:`${bin}:${process.env.PATH}`,ORCA_CLI_COMMAND:f.orca}});
    assert.notEqual(r.status,0); assert.match(r.stdout,/removed 1 worktrees/); assert.match(r.stdout,/before 2.*after 1/); assert.match(r.stderr,/failed|error/i);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('an already removed worktree permits independent pruning of its merged agents branch', () => {
  const f=fixture();
  try {
    git(f.project,'worktree','remove',f.wt);
    const bin=path.join(f.dir,'bin');mkdirSync(bin);writeFileSync(path.join(bin,'git'),'#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n',{mode:0o755});
    writeFileSync(f.orca,`#!/bin/sh\nif [ "$2" = list ]; then echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; else echo '{"ok":true,"result":{"messages":[]}}'; fi\n`,{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--prune-remote'],{encoding:'utf8',env:{...process.env,PATH:`${bin}:${process.env.PATH}`,ORCA_CLI_COMMAND:f.orca}});
    assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/pruned 1 remote branches/);assert.equal(git(f.project,'ls-remote','--heads','origin','refs/heads/agents/demo'),'');
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('a stale completion message cannot authorize closing a resumed worker', () => {
  const f=fixture(),calls=path.join(f.dir,'calls');
  try {
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const show={ok:true,result:{dispatch:{id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-02T00:00:00.000Z'},terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:'reclaimable'}}}};
    const list={ok:true,result:{terminals:[{handle:'term_demo',worktreePath:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:["host_demo"],omittedHostIds:[]}}};
    const inbox={ok:true,result:{messages:[{type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
    writeFileSync(f.orca,`#!/bin/sh\necho "$*" >> '${calls}'\ncase "$2" in worker-show) echo '${JSON.stringify(show)}';; inbox) echo '${JSON.stringify(inbox)}';; list) echo '${JSON.stringify(list)}';; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
    spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(readFileSync(calls,'utf8'),/orchestration worker-release/);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('release is retried when its worktree was removed in an earlier cycle', () => {
  const f=fixture(),calls=path.join(f.dir,'calls'),flag=path.join(f.dir,'released');
  try {
    git(f.project,'worktree','remove',f.wt);
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const dispatch={id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'};
    const show=(state)=>JSON.stringify({ok:true,result:{dispatch,terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:state}}}});
    const inbox={ok:true,result:{messages:[{type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
    writeFileSync(f.orca,`#!/bin/sh\necho "$*" >> '${calls}'\ncase "$2" in worker-show) if [ -e '${flag}' ]; then echo '${show('released')}'; else echo '${show('reclaimable')}'; fi;; inbox) echo '${JSON.stringify(inbox)}';; list) echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}';; worker-release) if [ -e '${calls}.failed' ]; then touch '${flag}'; echo '{"ok":true}'; else touch '${calls}.failed'; echo '{"ok":false}'; fi;; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
    const run=()=>spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    const first=run();assert.notEqual(first.status,0);assert.ok(JSON.parse(readFileSync(path.join(f.ctl,'workers.json'),'utf8')).demo);
    const second=run();assert.equal(second.status,0,second.stderr);assert.match(second.stdout,/released 1 dispatches/);assert.equal((readFileSync(calls,'utf8').match(/orchestration worker-release/g)||[]).length,2);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('even settled read workers on forbidden worktrees are not released', () => {
  const f=fixture(),calls=path.join(f.dir,'calls');
  try {
    git(f.wt,'branch','-m','feat/demo');git(f.wt,'push','origin','feat/demo');
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const show={ok:true,result:{dispatch:{id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00.000Z'},terminal:{handle:'term_demo',worktreePath:f.wt},projection:{resource:{terminalState:'reclaimable'}}}};
    const inbox={ok:true,result:{messages:[{type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
    writeFileSync(f.orca,`#!/bin/sh\necho "$*" >> '${calls}'\ncase "$2" in worker-show) echo '${JSON.stringify(show)}';; inbox) echo '${JSON.stringify(inbox)}';; list) echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}';; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
    spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(readFileSync(calls,'utf8'),/orchestration worker-release/);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('a worktree count failure is reported as unknown instead of zero', () => {
  const f=fixture();
  try {
    const bin=path.join(f.dir,'bin');mkdirSync(bin);writeFileSync(path.join(bin,'git'),'#!/bin/sh\ncase " $* " in *" worktree list "*) exit 42;; esac\nexec /usr/bin/git "$@"\n',{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed'],{encoding:'utf8',env:{...process.env,PATH:`${bin}:${process.env.PATH}`,ORCA_CLI_COMMAND:f.orca}});
    assert.notEqual(r.status,0);assert.match(r.stdout,/before unknown.*after unknown/);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('a terminal list omitting an execution host cannot authorize removal', () => {
  const f=fixture();
  try {
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,dispatch:'demo-dispatch'}}));
    writeFileSync(f.orca,`#!/bin/sh\nif [ "$2" = worker-show ]; then echo '{"ok":true,"result":{"dispatch":{"id":"demo-dispatch","status":"completed","completedAt":"2026-01-01T00:00:00Z"},"terminal":{"worktreePath":"${f.wt}"},"projection":{"resource":{"terminalState":"reclaimable"}}}}'; else echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":["host_omitted"]},"topologyRevisions":{}}}'; fi\n`,{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--dry','--pushed'],{encoding:'utf8',env:{...process.env,ORCA_CLI_COMMAND:f.orca}});
    assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/would remove finished/);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('an unknown worker without a registered worktree blocks independent pruning', () => {
  const f=fixture();
  try {
    git(f.project,'worktree','remove',f.wt);
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,dispatch:'unknown'}}));
    const bin=path.join(f.dir,'bin');mkdirSync(bin);writeFileSync(path.join(bin,'git'),'#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n',{mode:0o755});
    writeFileSync(f.orca,`#!/bin/sh\nif [ "$2" = list ]; then echo '{"ok":true,"result":{"terminals":[],"totalCount":0,"truncated":false,"hostScope":{"hostIds":["host_demo"],"omittedHostIds":[]}}}'; else echo '{"ok":false}'; fi\n`,{mode:0o755});
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--prune-remote'],{encoding:'utf8',env:{...process.env,PATH:`${bin}:${process.env.PATH}`,ORCA_CLI_COMMAND:f.orca}});
    assert.doesNotMatch(r.stdout,/pruned 1 remote branches/);assert.ok(git(path.join(f.dir,'remote.git'),'rev-parse','--verify','refs/heads/agents/demo'));
  } finally {rmSync(f.dir,{recursive:true,force:true});}
});
test('auto-released workers retain durable same-worktree evidence', () => {
  for (const variant of [...['direct','released'].flatMap(route => ['run','task','terminal'].flatMap(field => ['worktree','noise','prune'].map(action => `${route}-conflict-${field}-${action}`))), 'valid','wrong-path','wrong-name','wrong-repo','wrong-run','wrong-task','wrong-dispatch','wrong-terminal','wrong-worktree','unread','live','incomplete','not-released','replaced-worktree','removed','removed-unknown','paged','duplicate','missing-total','invalid-total','premature','inconsistent-total','repeated-page','empty-page','missing-count','wrong-count','saturated','hidden-duplicate','visible-duplicate','ambiguous-completion','terminal-cursor','overfull-page','direct-saturated','direct-duplicate','direct-malformed','direct-unread','direct-missing','direct-valid','direct-noise-duplicate','direct-removed-duplicate','direct-wrong-task','direct-wrong-run']) {
  const f=fixture();
  try {
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const dispatch={id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00Z'};
    const resource={terminalHandle:'term_demo',worktreeId:'wt_demo',originDispatchId:'demo-dispatch',ownerDispatchId:'demo-dispatch',ownershipState:'released',releaseState:'released',releaseCompletedAt:'2026-01-01T00:01:00Z'};
    const show={ok:true,result:{dispatch,worker:{dispatchId:'demo-dispatch',agentTerminalHandle:'term_demo',worktreeId:'wt_demo',startOptions:{worktree:'new-child',name:'finished',repo:'id:demo'}},terminal:{handle:'term_demo',worktreePath:''},projection:{resource:{terminalState:'released'}}}};
    const row={dispatchId:'demo-dispatch',taskId:'task_demo',runId:'run_demo',dispatchStatus:'completed',agentTerminalHandle:'term_demo',terminalState:'released',resource,projection:{workspace:{id:'wt_demo'},evidence:{durable:true}}};
    const inbox={ok:true,result:{messages:[{type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})}],count:1}};
    const list={ok:true,result:{workers:[row],page:{total:1,hasMore:false,nextCursor:null}}};
    if (variant==='wrong-path') show.result.terminal.worktreePath='/demo/other';
    if (variant.startsWith('direct-')) show.result.terminal.worktreePath=f.wt;
    if (variant==='wrong-name') show.result.worker.startOptions.name='other';
    if (variant==='wrong-repo') show.result.worker.startOptions.repo='id:other';
    if (variant==='wrong-run') row.runId='run_other';
    if (variant==='wrong-task') row.taskId='task_other';
    if (variant==='wrong-dispatch') row.resource.originDispatchId='other';
    if (variant==='wrong-terminal') row.resource.terminalHandle='term_other';
    if (variant==='wrong-worktree' || variant==='removed-unknown') row.resource.worktreeId='wt_other';
    if (variant==='unread' || variant==='direct-unread') inbox.result.messages[0].read=0;
    if (variant==='direct-wrong-task') inbox.result.messages[0].payload=JSON.stringify({taskId:'other',dispatchId:'demo-dispatch'});
    if (variant==='direct-wrong-run') inbox.result.messages[0].run_id='run_other';
    if (variant==='direct-missing') { inbox.result.messages=[]; inbox.result.count=0; }
    if (variant==='incomplete') list.result.page.hasMore=true;
    if (['paged','duplicate','inconsistent-total','repeated-page','empty-page'].includes(variant)) { list.result.workers=[variant==='paged' || variant==='inconsistent-total' ? {...row,dispatchId:'other'} : row]; list.result.page={total:2,hasMore:true,nextCursor:'cursor_demo'}; }
    const nextList={ok:true,result:{workers:variant==='empty-page'?[]:[row],page:{total:variant==='inconsistent-total'?3:2,hasMore:false,nextCursor:null}}};
    if (variant==='missing-total') delete list.result.page.total;
    if (variant==='invalid-total') list.result.page.total=-1;
    if (variant==='premature') list.result.page.total=2;
    if (variant==='terminal-cursor') list.result.page.nextCursor='unexpected';
    if (variant==='overfull-page') list.result.page.total=0;
    if (variant==='ambiguous-completion' || variant==='direct-malformed') { inbox.result.messages.push({...inbox.result.messages[0],payload:'invalid'}); inbox.result.count=2; }
    if (variant.includes('-conflict-')) {
      const conflict={...inbox.result.messages[0],read:0};
      if (variant.includes('-run-')) conflict.run_id='run_other';
      if (variant.includes('-task-')) conflict.payload=JSON.stringify({taskId:'task_other',dispatchId:'demo-dispatch'});
      if (variant.includes('-terminal-')) conflict.from_handle='term_other';
      inbox.result.messages.push(conflict); inbox.result.count=2;
    }
    if (variant==='missing-count') delete inbox.result.count;
    if (variant==='wrong-count') inbox.result.count=2;
    if (variant==='visible-duplicate' || variant==='direct-duplicate' || variant==='direct-noise-duplicate' || variant==='direct-removed-duplicate') { inbox.result.messages.push({...inbox.result.messages[0],read:0}); inbox.result.count=2; }
    if (variant==='saturated' || variant==='hidden-duplicate' || variant==='direct-saturated') { while(inbox.result.messages.length<1000) inbox.result.messages.push({type:'other'}); if (variant==='hidden-duplicate') { const all=[...inbox.result.messages,{...inbox.result.messages[0],read:0}]; inbox.result.messages=all.slice(0,1000); } inbox.result.count=1000; }

    if (variant==='not-released') row.resource.releaseState='retained';
    const trees={ok:true,result:{worktrees:[{id:variant==='replaced-worktree'?'wt_other':'wt_demo',path:f.wt}],totalCount:1,truncated:false,hostScope:{hostIds:['host_demo'],omittedHostIds:[]}}};
    const terms={ok:true,result:{terminals:[],totalCount:0,truncated:false,hostScope:{hostIds:['host_demo'],omittedHostIds:[]}}};
    if (variant==='live') { terms.result.terminals=[{handle:'term_demo',worktreePath:f.wt}]; terms.result.totalCount=1; }
    writeFileSync(f.orca,`#!/bin/sh\ncase "$2" in worker-show) echo '${JSON.stringify(show)}';; worker-list) case " $* " in *" --cursor cursor_demo "*) echo '${JSON.stringify(nextList)}';; *) echo '${JSON.stringify(list)}';; esac;; inbox) echo '${JSON.stringify(inbox)}';; list) if [ "$1" = worktree ]; then echo '${JSON.stringify(trees)}'; else echo '${JSON.stringify(terms)}'; fi;; rm) /usr/bin/git -C '${f.project}' worktree remove '${f.wt}'; echo '{"ok":true}';; *) echo '{"ok":true}';; esac\n`,{mode:0o755});
    let env={...process.env,ORCA_CLI_COMMAND:f.orca};
    if (variant.startsWith('removed') || variant==='direct-removed-duplicate' || variant.endsWith('-prune')) {
      git(f.project,'worktree','remove',f.wt);
      const bin=path.join(f.dir,'bin'); mkdirSync(bin);
      writeFileSync(path.join(bin,'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', {mode:0o755});
      env.PATH=`${bin}:${process.env.PATH}`;
    }
    if (variant==='direct-noise-duplicate' || variant.endsWith('-noise')) writeFileSync(path.join(f.wt,'package-lock.json'), JSON.stringify({packages:{'node_modules/demo':{}}}, null, 2)+'\n');
    const r=spawnSync(process.execPath,[path.join(f.ctl,'cleanup.mjs'),'--pushed',...(variant.startsWith('removed') || variant==='direct-removed-duplicate' || variant.endsWith('-prune')?['--prune-remote']:[]),...(variant==='direct-noise-duplicate' || variant.endsWith('-noise')?['--install-noise']:[])],{encoding:'utf8',env});
    assert.equal(r.status,['missing-count','wrong-count','saturated','hidden-duplicate','direct-saturated'].includes(variant)?1:0,r.stderr);
    if (variant==='removed') { assert.match(r.stdout,/pruned 1 remote branches/); assert.equal(JSON.parse(readFileSync(path.join(f.ctl,'workers.json'),'utf8')).demo,undefined); }
    else if (variant==='removed-unknown' || variant==='direct-removed-duplicate' || variant.endsWith('-prune')) { assert.doesNotMatch(r.stdout,/pruned 1 remote branches/); assert.ok(JSON.parse(readFileSync(path.join(f.ctl,'workers.json'),'utf8')).demo); assert.ok(git(path.join(f.dir,'remote.git'),'rev-parse','--verify','refs/heads/agents/demo')); }
    else if (variant==='valid' || variant==='paged' || variant==='direct-valid') { assert.match(r.stdout,/removed 1 worktrees/); assert.equal(existsSync(f.wt),false); }
    else { if (variant==='direct-noise-duplicate' || variant.endsWith('-noise')) assert.match(git(f.wt,'status','--porcelain'),/package-lock.json/); assert.doesNotMatch(r.stdout,/removed 1 worktrees/,variant); assert.equal(existsSync(f.wt),true,variant); }
  } finally {rmSync(f.dir,{recursive:true,force:true});}
  }
});

// Exercise settlement through the CLI; every mutation stays in this disposable fixture.
function completionEvidenceCase(route, action, extra, eligible = false, options = {}) {
  const f = fixture();
  try {
    writeFileSync(path.join(f.ctl, 'workers.json'), JSON.stringify({demo:{host:'local',worktree:f.wt,terminal:'term_demo',dispatch:'demo-dispatch'}}));
    const dispatch = {id:'demo-dispatch',taskId:'task_demo',runId:'run_demo',status:'completed',completedAt:'2026-01-01T00:00:00Z'};
    const resource = {terminalHandle:'term_demo',worktreeId:'wt_demo',originDispatchId:'demo-dispatch',ownerDispatchId:'demo-dispatch',ownershipState:'released',releaseState:'released',releaseCompletedAt:'2026-01-01T00:01:00Z'};
    const show = {ok:true,result:{dispatch,worker:{dispatchId:'demo-dispatch',agentTerminalHandle:'term_demo',worktreeId:'wt_demo',startOptions:{worktree:'new-child',name:'finished',repo:'id:demo'}},terminal:{handle:'term_demo',worktreePath:route === 'direct' ? f.wt : ''},projection:{resource:{terminalState:'released'}}}};
    const row = {dispatchId:'demo-dispatch',taskId:'task_demo',runId:'run_demo',dispatchStatus:'completed',agentTerminalHandle:'term_demo',terminalState:'released',resource,projection:{workspace:{id:'wt_demo'},evidence:{durable:true}}};
    const completion = {type:'worker_done',read:1,from_handle:'term_demo',run_id:'run_demo',created_at:'2026-01-01T00:00:00Z',payload:JSON.stringify({taskId:'task_demo',dispatchId:'demo-dispatch'})};
    const messages = [completion, {...completion, read:0, ...extra}];
    const scope = {totalCount:0,truncated:false,hostScope:{hostIds:['host_demo'],omittedHostIds:[]}};
    const receipts = {
      'worker-show':show,
      'worker-list':{ok:true,result:{workers:[row],page:{total:1,hasMore:false,nextCursor:null}}},
      inbox:{ok:true,result:{messages,count:messages.length}},
      terminals:{ok:true,result:{...scope,terminals:[]}},
      worktrees:{ok:true,result:{...scope,totalCount:1,worktrees:[{id:'wt_demo',path:f.wt}]}}
    };
    const raw = options.raw ? options.raw(receipts, f) : {};
    writeFileSync(path.join(f.dir, 'receipts.json'), JSON.stringify(receipts));
    writeFileSync(path.join(f.dir, 'raw.json'), JSON.stringify(raw));
    const calls = path.join(f.dir, 'calls.jsonl');
    writeFileSync(f.orca, `#!/usr/bin/env node
const fs = require('node:fs'), cp = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify(args) + '\\n');
const receipts = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(f.dir, 'receipts.json'))}, 'utf8'));
if (args[0] === 'worktree' && args[1] === 'rm') cp.execFileSync('/usr/bin/git', ['-C', ${JSON.stringify(f.project)}, 'worktree', 'remove', ${JSON.stringify(f.wt)}]);
let key = args[1] === 'list' ? (args[0] === 'worktree' ? 'worktrees' : 'terminals') : args[1];
if (args.includes('--cursor')) key += ':' + args[args.indexOf('--cursor')+1];
const raw = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(f.dir, 'raw.json'))}, 'utf8'));
let value = raw[key];
if (Array.isArray(value)) {
  const seen = fs.readFileSync(${JSON.stringify(calls)}, 'utf8').trim().split('\\n').map(line => JSON.parse(line)).filter(call => call[0] === args[0] && call[1] === args[1]).length;
  value = value[Math.min(seen - 1, value.length - 1)];
}
process.stdout.write(value ?? JSON.stringify(receipts[key] || {ok:true}));
`, {mode:0o755});
    const env = {...process.env, FACTORY_CONFIG:'', ORCA_CLI_COMMAND:f.orca};
    const args = ['--pushed'];
    let lock, cacheFile;
    if (action === 'noise') {
      lock = JSON.stringify({packages:{'node_modules/demo':{}}}, null, 2) + '\n';
      writeFileSync(path.join(f.wt, 'package-lock.json'), lock);
      const data = 'invented cache content', hash = createHash('sha512').update(data).digest('hex');
      const cache = path.join(f.wt, '.npm-review-cache', '_cacache', 'content-v2', 'sha512', hash.slice(0,2), hash.slice(2,4));
      mkdirSync(cache, {recursive:true}); cacheFile = path.join(cache, hash.slice(4));
      writeFileSync(cacheFile, data); addCacheIndex(f.wt, hash);
      args.push('--install-noise');
    }
    if (action === 'prune') {
      git(f.project, 'worktree', 'remove', f.wt);
      const bin = path.join(f.dir, 'bin'); mkdirSync(bin);
      writeFileSync(path.join(bin,'git'), '#!/bin/sh\ncase " $* " in *" remote get-url "*) echo https://github.com/bussard76/exxperts.git; exit 0;; esac\nexec /usr/bin/git "$@"\n', {mode:0o755});
      env.PATH = `${bin}:${process.env.PATH}`; args.push('--prune-remote');
    }
    const started = performance.now();
    const result = spawnSync(process.execPath, [path.join(f.ctl, 'cleanup.mjs'), ...args], {encoding:'utf8',env,timeout:options.timeout});
    const elapsed = performance.now()-started;
    const record = JSON.parse(readFileSync(path.join(f.ctl, 'workers.json'), 'utf8')).demo;
    const log = readFileSync(calls, 'utf8');
    if (eligible) {
      assert.equal(record, undefined);
      assert.match(log, /worker-release/);
      if (action === 'prune') assert.equal(git(f.project,'ls-remote','--heads','origin','refs/heads/agents/demo'),'');
      else assert.equal(existsSync(f.wt),false);
      assert.match(result.stdout, action === 'prune' ? /pruned 1 remote branches/ : /removed 1 worktrees/);
      if (action === 'noise') assert.match(result.stdout, /cleaned 1 install-noise worktrees/);
    } else {
      assert.ok(record, 'ambiguous completion must preserve worker record');
      assert.doesNotMatch(log, options.allowRelease ? /"rm"/ : /worker-release|"rm"/);
      assert.match(result.stdout, /removed 0 worktrees, kept \d+, pruned 0 remote branches/);
      if (action === 'prune') assert.ok(git(path.join(f.dir, 'remote.git'), 'rev-parse', '--verify', 'refs/heads/agents/demo'));
      else assert.equal(existsSync(f.wt), true);
      if (action === 'noise') {
        assert.equal(readFileSync(path.join(f.wt, 'package-lock.json'), 'utf8'), lock);
        assert.equal(readFileSync(cacheFile, 'utf8'), 'invented cache content');
        assert.match(result.stdout, /cleaned 0 install-noise worktrees/);
      }
    }
    assert.equal(result.status, options.status ?? 0, result.stderr);
    return elapsed;
  } finally { rmSync(f.dir, {recursive:true,force:true}); }
}

test('R8 direct removal retains truncated completion with conflicting run', () => {
  completionEvidenceCase('direct', 'worktree', {run_id:'run_other',payload:'{"dispatchId":"demo-dispatch",'});
});

test('R8 released removal retains missing dispatch identity from conflicting sources', () => {
  completionEvidenceCase('released', 'worktree', {from_handle:'term_other',run_id:'run_other',payload:JSON.stringify({taskId:'task_demo'})});
});

test('R8 direct pruning retains duplicate dispatch keys hiding a conflicting completion', () => {
  completionEvidenceCase('direct', 'prune', {from_handle:'term_other',run_id:'run_other',payload:'{"taskId":"task_other","dispatchId":"demo-dispatch","dispatchId":"other-dispatch"}'});
});

test('R8 released noise retains completion evidence missing its message type', () => {
  completionEvidenceCase('released', 'noise', {type:undefined,from_handle:'term_other',run_id:'run_other'});
});

const sourceConflicts = [
  ['expected-source', {}],
  ['different-run', {run_id:'run_other'}],
  ['different-terminal', {from_handle:'term_other'}],
  ['different-run-and-terminal', {run_id:'run_other',from_handle:'term_other'}],
  ['missing-source', {run_id:undefined,from_handle:undefined}]
];
const malformedPayloads = [
  ['truncated-dispatch', '{"dispatchId":"demo-dispatch",'],
  ['unparseable', 'invalid'],
  ['missing-payload', undefined],
  ['empty-payload', '']
];
const ambiguousEvidence = sourceConflicts.flatMap(([source, fields]) =>
  malformedPayloads.map(([payload, value]) => [`${payload}-${source}`, {...fields,payload:value}])
);
const conflictingSource = {run_id:'run_other',from_handle:'term_other'};
for (const [name, payload] of [
  ['missing-dispatch', {taskId:'task_demo'}],
  ['missing-task', {dispatchId:'demo-dispatch'}],
  ['no-identities', {}],
  ['null-object', null],
  ['array', [{taskId:'task_demo',dispatchId:'demo-dispatch'}]],
  ['scalar-string', 'demo-dispatch'],
  ['scalar-number', 42],
  ['empty-dispatch', {taskId:'task_demo',dispatchId:''}],
  ['blank-dispatch', {taskId:'task_demo',dispatchId:'  '}],
  ['padded-dispatch', {taskId:'task_demo',dispatchId:' demo-dispatch '}],
  ['wrong-dispatch-type', {taskId:'task_demo',dispatchId:42}],
  ['null-dispatch', {taskId:'task_demo',dispatchId:null}],
  ['empty-task-unrelated-dispatch', {taskId:'',dispatchId:'other-dispatch'}],
  ['wrong-task-type-unrelated-dispatch', {taskId:42,dispatchId:'other-dispatch'}],
  ['blank-task-unrelated-dispatch', {taskId:' ',dispatchId:'other-dispatch'}]
]) ambiguousEvidence.push([name, {...conflictingSource,payload:JSON.stringify(payload)}]);
for (const [name, payload] of [
  ['duplicate-dispatch-key', '{"taskId":"task_other","dispatchId":"demo-dispatch","dispatchId":"other-dispatch"}'],
  ['duplicate-task-key', '{"taskId":"task_demo","taskId":"task_other","dispatchId":"other-dispatch"}'],
  ['escaped-duplicate-dispatch-key', String.raw`{"taskId":"task_other","dispatchId":"demo-dispatch","dispatch\u0049d":"other-dispatch"}`],
  ['escaped-duplicate-task-key', String.raw`{"taskId":"task_demo","task\u0049d":"task_other","dispatchId":"other-dispatch"}`],
  ['nested-identities-only', '{"details":{"taskId":"task_demo","dispatchId":"demo-dispatch"}}']
]) ambiguousEvidence.push([name, {...conflictingSource,payload}]);
for (const [name, extra] of [
  ['payload-array-coercion', {payload:['{"taskId":"task_other","dispatchId":"other-dispatch"}']}],
  ['payload-object', {payload:{taskId:'task_demo',dispatchId:'demo-dispatch'}}],
  ['missing-run', {run_id:undefined}],
  ['missing-terminal', {from_handle:undefined}],
  ['blank-run', {run_id:' '}],
  ['wrong-terminal-type', {from_handle:42}],
  ['missing-message-type', {type:undefined}],
  ['blank-message-type', {type:' '}],
  ['padded-message-type', {type:' worker_done '}],
  ['wrong-message-type', {type:42}]
]) ambiguousEvidence.push([name, {...conflictingSource,payload:'{"taskId":"task_other","dispatchId":"other-dispatch"}',...extra}]);

for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, extra] of ambiguousEvidence) {
    test(`R8 ${route} ${action} retains ${name}`, () => completionEvidenceCase(route, action, extra));
  }
  for (const [name, extra] of [
    ['complete-other-dispatch', {...conflictingSource,payload:'{"taskId":"task_other","dispatchId":"other-dispatch"}'}],
    ['same-source-other-dispatch', {payload:'{"taskId":"task_other","dispatchId":"other-dispatch"}'}],
    ['escaped-and-nested-other-payload', {...conflictingSource,payload:JSON.stringify({body:'"dispatchId":"demo-dispatch" \\ { } [ ]',details:{taskId:'nested',dispatchId:'demo-dispatch'},taskId:'task_other',dispatchId:'other-dispatch'})}],
    ['escaped-unique-identity-keys', {...conflictingSource,payload:String.raw`{"task\u0049d":"task_other","dispatch\u0049d":"other-dispatch"}`}],
    ['non-completion-message', {type:'heartbeat',payload:'not a completion payload'}]
  ]) test(`R8 ${route} ${action} permits ${name}`, () => completionEvidenceCase(route, action, extra, true));
}

// Supply raw JSON at the process boundary so duplicate keys survive fixture setup.
test('R9 direct worktree retains raw duplicate message type', () => {
  completionEvidenceCase('direct', 'worktree', {}, false, {status:1,raw:r => ({inbox:JSON.stringify(r.inbox).replace('"read":0', '"type":"heartbeat","read":0')})});
});
test('R9 direct worktree retains explicit truncated inbox', () => {
  completionEvidenceCase('direct', 'worktree', {type:'heartbeat'}, false, {status:1,raw:r => {
    r.inbox.result.truncated = true;
    return {inbox:JSON.stringify(r.inbox)};
  }});
});

function rawMessages(r, messages) {
  return '{"ok":true,"result":{"count":'+messages.length+',"messages":['+messages.join(',')+']}}';
}
function duplicateLast(object, key, last, escaped = false) {
  const alias = escaped ? '"'+key[0]+'\\u'+key.charCodeAt(1).toString(16).padStart(4,'0')+key.slice(2)+'"' : JSON.stringify(key);
  return JSON.stringify(object).slice(0,-1)+','+alias+':'+JSON.stringify(last)+'}';
}
const rawDuplicates = [
  ['outer-type', r => rawMessages(r, [JSON.stringify(r.inbox.result.messages[0]), duplicateLast(r.inbox.result.messages[1],'type','heartbeat')])],
  ['escaped-outer-type', r => rawMessages(r, [JSON.stringify(r.inbox.result.messages[0]), duplicateLast(r.inbox.result.messages[1],'type','heartbeat',true)])],
  ['outer-payload', r => rawMessages(r, [JSON.stringify(r.inbox.result.messages[0]), duplicateLast(r.inbox.result.messages[1],'payload','{"taskId":"task_other","dispatchId":"other-dispatch"}')])],
  ['escaped-outer-payload', r => rawMessages(r, [JSON.stringify(r.inbox.result.messages[0]), duplicateLast(r.inbox.result.messages[1],'payload','{"taskId":"task_other","dispatchId":"other-dispatch"}',true)])],
  ['outer-read', r => rawMessages(r, [duplicateLast({...r.inbox.result.messages[0],read:0},'read',1)])],
  ['escaped-outer-source', r => rawMessages(r, [duplicateLast({...r.inbox.result.messages[0],from_handle:'term_other'},'from_handle','term_demo',true)])],
  ['outer-run', r => rawMessages(r, [duplicateLast({...r.inbox.result.messages[0],run_id:'run_other'},'run_id','run_demo')])],
  ['outer-time', r => rawMessages(r, [duplicateLast({...r.inbox.result.messages[0],created_at:'2026-01-02T00:00:00Z'},'created_at','2026-01-01T00:00:00Z')])],
  ['receipt-ok', r => duplicateLast({ok:false,result:{...r.inbox.result,messages:[r.inbox.result.messages[0]],count:1}},'ok',true)],
  ['escaped-receipt-result', r => duplicateLast({ok:true,result:r.inbox.result},'result',{messages:[r.inbox.result.messages[0]],count:1},true)],
  ['result-messages', r => '{"ok":true,"result":'+duplicateLast({...r.inbox.result,count:1},'messages',[r.inbox.result.messages[0]])+'}'],
  ['escaped-result-count', r => '{"ok":true,"result":'+duplicateLast({messages:[r.inbox.result.messages[0]],count:2},'count',1,true)+'}'],
  ['nested-extension', r => rawMessages(r,[JSON.stringify(r.inbox.result.messages[0]).slice(0,-1)+',"extension":{"__proto__":1,"__proto__":2}}'])]
];
for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, raw] of rawDuplicates) test(`R9 ${route} ${action} retains raw duplicate ${name}`, () => {
    completionEvidenceCase(route, action, {}, false, {status:1,raw:r => ({inbox:raw(r)})});
  });
}

const incompleteMetadata = [
  ['truncated', {truncated:true}],
  ['malformed-truncated', {truncated:'false'}],
  ['null-truncated', {truncated:null}],
  ['incomplete', {complete:false}],
  ['malformed-complete', {complete:1}],
  ['remaining-results', {hasMore:true}],
  ['malformed-has-more', {hasMore:'false'}],
  ['remaining-cursor', {nextCursor:'next_demo'}],
  ['malformed-cursor', {nextCursor:false}],
  ['empty-cursor', {nextCursor:''}],
  ['inconsistent-total', {total:2}],
  ['inconsistent-total-count', {totalCount:0}],
  ['malformed-total', {total:'1'}],
  ['unsafe-total', {total:9007199254740992}],
  ['negative-total', {total:-1}],
  ['fractional-total', {total:1.5}],
  ['page-with-omitted-message', {page:{total:2,hasMore:true,nextCursor:'next_demo'}}],
  ['page-total-mismatch', {page:{total:2,hasMore:false,nextCursor:null}}],
  ['page-remaining-cursor', {page:{total:1,hasMore:false,nextCursor:'next_demo'}}],
  ['page-malformed-total', {page:{total:'1',hasMore:false,nextCursor:null}}],
  ['page-malformed-has-more', {page:{total:1,hasMore:'false',nextCursor:null}}],
  ['page-missing-total', {page:{hasMore:false,nextCursor:null}}],
  ['page-missing-has-more', {page:{total:1,nextCursor:null}}],
  ['null-page', {page:null}],
  ['array-page', {page:[]}],
  ['scalar-page', {page:1}],
  ['empty-page', {page:{}}],
  ['nested-page-truncation', {page:{total:1,hasMore:false,truncated:true}}],
  ['earlier-page-offset', {page:{total:1,hasMore:false,offset:1}}],
  ['malformed-offset', {offset:'0'}],
  ['earlier-page-cursor', {page:{total:1,hasMore:false,cursor:'previous_demo'}}],
  ['malformed-current-cursor', {cursor:0}]
];
for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, metadata] of incompleteMetadata) test(`R9 ${route} ${action} retains incomplete metadata ${name}`, () => {
    completionEvidenceCase(route, action, {type:'heartbeat'}, false, {status:1,raw:r => {
      // One visible valid completion, with explicit evidence that it is not a complete inbox.
      r.inbox.result.messages.length=1; r.inbox.result.count=1;
      Object.assign(r.inbox.result, metadata);
      return {inbox:JSON.stringify(r.inbox)};
    }});
  });
  for (const [name, metadata] of incompleteMetadata.filter(([name]) => ['truncated','page-with-omitted-message','malformed-total'].includes(name))) {
    test(`R9 ${route} ${action} retains envelope metadata ${name}`, () => {
      completionEvidenceCase(route, action, {type:'heartbeat'}, false, {status:1,raw:r => {
        r.inbox.result.messages.length=1; r.inbox.result.count=1;
        Object.assign(r.inbox,metadata);
        return {inbox:JSON.stringify(r.inbox)};
      }});
    });
  }
}

// Probe every other receipt used as positive cleanup evidence at the raw CLI boundary.
for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, status, raw] of [
    ['worker-show-status',0,r => ({'worker-show':JSON.stringify(r['worker-show']).replace('"status":"completed"','"status":"running","status":"completed"')})],
    ['worker-show-worktree',0,r => ({'worker-show':JSON.stringify(r['worker-show']).replace('"worktreePath":','"worktreePath":"/invented/other","worktreePath":')})],
    ['terminal-list-rows',1,r => ({terminals:'{"ok":true,"result":'+duplicateLast({...r.terminals.result,terminals:[{handle:'term_demo',worktreePath:'/invented/other'}]},'terminals',[],true)+'}'})],
    ...(route === 'released' ? [
      ['worker-list-total',0,r => ({'worker-list':JSON.stringify(r['worker-list']).replace('"total":1','"total":2,"to\\u0074al":1')})],
      ...(action !== 'prune' ? [['worktree-list-path',0,r => ({worktrees:JSON.stringify(r.worktrees).replace('"path":','"path":"/invented/other","pa\\u0074h":')})]] : [])
    ] : [])
  ]) test(`R9 ${route} ${action} retains raw duplicate ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{status,raw});
  });
}

for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, raw] of [
    ['complete-explicit-metadata', r => {
      const metadata = {truncated:false,complete:true,hasMore:false,nextCursor:null,total:1,totalCount:1,page:{total:1,hasMore:false,nextCursor:null}};
      r.inbox.result.messages.length=1; r.inbox.result.count=1;
      Object.assign(r.inbox.result,metadata); Object.assign(r.inbox,metadata);
      return {inbox:JSON.stringify(r.inbox)};
    }],
    ['unique-escaped-outer-keys', r => ({inbox:JSON.stringify(r.inbox).replaceAll('"type":','"ty\\u0070e":').replaceAll('"payload":','"pay\\u006coad":')})],
    ['repeated-keys-in-separate-objects', r => {
      r.inbox.result.extension=[{same:1},{same:2}];
      r.inbox.result.messages[0].extension={nested:{same:3},same:4,details:'"type":"worker_done" \\ { [ : }'};
      return {inbox:JSON.stringify(r.inbox)};
    }]
  ]) test(`R9 ${route} ${action} permits raw ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},true,{raw});
  });
}


test('R9 direct worktree retains earlier omitted inbox pages', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:r => {
    r.inbox.result.page={total:2,hasMore:false,nextCursor:null,offset:1};
    return {inbox:JSON.stringify(r.inbox)};
  }});
});


// Bounds apply to the actual raw receipt, including otherwise ignorable extension data.
const boundedReceipts = [
  ['over-byte-budget', r => JSON.stringify(r.inbox)+' '.repeat(8*1024*1024)],
  ['over-depth-budget', r => JSON.stringify(r.inbox).slice(0,-1)+',"extension":'+'['.repeat(65)+'0'+']'.repeat(65)+'}'],
  ['over-item-budget', r => JSON.stringify(r.inbox).slice(0,-1)+',"extension":['+'0,'.repeat(125001)+'0]}']
];
for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name,raw] of boundedReceipts) test(`R9 ${route} ${action} retains bounded ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{status:1,raw:r => ({inbox:raw(r)})});
  });
}

for (const route of ['direct','released']) {
  for (const [name,raw] of [
    ['unsaturated-999-message-inbox', r => {
      while(r.inbox.result.messages.length<999) r.inbox.result.messages.push({type:'heartbeat'});
      r.inbox.result.count=999;
      return {inbox:JSON.stringify(r.inbox)};
    }],
    ['ordinary-large-body', r => {
      r.inbox.result.messages[0].body='Invented text. '.repeat(10000);
      return {inbox:JSON.stringify(r.inbox)};
    }],
    ['quoted-and-unicode-extension-keys', r => {
      r.inbox.result.extension={'quoted"key':1,'back\\key':2,'😀':3,'__proto__':'invented'};
      return {inbox:JSON.stringify(r.inbox)};
    }]
  ]) test(`R9 ${route} worktree permits raw ${name}`, () => {
    completionEvidenceCase(route,'worktree',{type:'heartbeat'},true,{raw});
  });
  for (const [name,raw] of [
    ['trailing-second-receipt',r => JSON.stringify(r.inbox)+'{}'],
    ['unclosed-receipt',r => JSON.stringify(r.inbox).slice(0,-1)],
    ['scalar-receipt',() => 'null'],
    ['non-json-number',r => JSON.stringify(r.inbox).replace('"count":2','"count":NaN')],
    ['unicode-duplicate-key',r => JSON.stringify(r.inbox).slice(0,-1)+',"extension":{"😀":1,"\\ud83d\\ude00":2}}']
  ]) test(`R9 ${route} worktree retains malformed raw ${name}`, () => {
    completionEvidenceCase(route,'worktree',{type:'heartbeat'},false,{status:1,raw:r => ({inbox:raw(r)})});
  });
}

test('R10 terminal contradictory page retains direct worktree', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:r => {
    r.terminals.result.page={total:1,hasMore:true,nextCursor:'omitted_demo'};
    return {terminals:JSON.stringify(r.terminals)};
  }});
});

test('R10 worker-list page truncation retains released noise', () => {
  completionEvidenceCase('released','noise',{type:'heartbeat'},false,{raw:r => {
    r['worker-list'].result.page.truncated=true;
    return {'worker-list':JSON.stringify(r['worker-list'])};
  }});
});

test('R10 worktree envelope truncation retains released worktree', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:r => {
    r.worktrees.truncated=true;
    return {worktrees:JSON.stringify(r.worktrees)};
  }});
});

test('R10 bounded malformed string returns accounting within deadline', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,timeout:4000,raw:r => ({
    inbox:JSON.stringify(r.inbox).slice(0,-1)+',"extension":"'+'\\"'.repeat(80000)
  })});
});

test('R10 incomplete singleton worker-show retains direct worktree', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:r => {
    r['worker-show'].result.complete=false;
    return {'worker-show':JSON.stringify(r['worker-show'])};
  }});
});

// Full inventories permit no omitted page; optional metadata must agree at all levels.
const inventoryMetadata = count => [
  ['truncated',{truncated:true}], ['malformed-truncated',{truncated:'false'}],
  ['incomplete',{complete:false}], ['malformed-complete',{complete:'true'}],
  ['has-more',{hasMore:true}], ['malformed-has-more',{hasMore:0}],
  ['count-mismatch',{count:count+1}], ['malformed-count',{count:String(count)}],
  ['total-mismatch',{total:count+1}], ['malformed-total',{total:String(count)}],
  ['total-count-mismatch',{totalCount:count+1}], ['unsafe-total',{total:9007199254740992}],
  ['next-cursor',{nextCursor:'omitted_demo'}], ['malformed-next-cursor',{nextCursor:false}],
  ['current-cursor',{cursor:'previous_demo'}], ['malformed-current-cursor',{cursor:0}],
  ['offset',{offset:1}], ['malformed-offset',{offset:'0'}]
];
const inventoryCases = [
  ...['direct','released'].flatMap(route => ['worktree','noise','prune'].map(action => ['terminals',route,action,0,1])),
  ...['worktree','noise','prune'].map(action => ['worker-list','released',action,1,0]),
  ...['worktree','noise'].map(action => ['worktrees','released',action,1,0]),
  ...['direct','released'].flatMap(route => ['worktree','noise','prune'].map(action => ['worker-show',route,action,1,0])),
  ...['direct','released'].flatMap(route => ['worktree','noise','prune'].map(action => ['inbox',route,action,2,1]))
];
for (const [family,route,action,count,status] of inventoryCases) {
  for (const level of ['envelope','result','page']) {
    for (const [name,metadata] of inventoryMetadata(count)) {
      test(`R10 ${family} ${route} ${action} retains ${level} ${name}`, () => {
        completionEvidenceCase(route,action,{type:'heartbeat'},false,{status,raw:r => {
          const receipt=r[family];
          const base={total:count,hasMore:false,nextCursor:null};
          const target=level === 'envelope' ? receipt : level === 'result' ? receipt.result : (receipt.result.page ??= base);
          Object.assign(target,metadata);
          return {[family]:JSON.stringify(receipt)};
        }});
      });
    }
    if (level !== 'page') for (const [name,page] of [
      ['null',null],['array',[]],['scalar',1],['empty',{}],
      ['missing-total',{hasMore:false,nextCursor:null}],['missing-has-more',{total:count,nextCursor:null}],
      ['omitted-page',{total:count+1,hasMore:true,nextCursor:'omitted_demo'}]
    ]) test(`R10 ${family} ${route} ${action} retains ${level} malformed page ${name}`, () => {
      completionEvidenceCase(route,action,{type:'heartbeat'},false,{status,raw:r => {
        (level === 'envelope' ? r[family] : r[family].result).page=page;
        return {[family]:JSON.stringify(r[family])};
      }});
    });
  }
  test(`R10 ${family} ${route} ${action} permits complete metadata at every level`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},true,{raw:r => {
      const metadata={truncated:false,complete:true,hasMore:false,count,total:count,totalCount:count,nextCursor:null,cursor:null,offset:0};
      Object.assign(r[family],metadata,{page:{...metadata}});
      Object.assign(r[family].result,metadata,{page:{...metadata}});
      return {[family]:JSON.stringify(r[family])};
    }});
  });
}

// The requested cursor selects a raw CLI page, including later-page adversaries.
function threeWorkerPages(r, explicit = true) {
  const target=r['worker-list'].result.workers[0], raw={};
  for (let i=0;i<3;i++) {
    const hasMore=i<2, nextCursor=hasMore ? `cursor_demo_${i+1}` : null, cursor=i ? `cursor_demo_${i}` : null;
    const metadata={total:3,hasMore,nextCursor};
    if (explicit) Object.assign(metadata,{count:1,totalCount:3,truncated:false,complete:true,cursor,offset:i});
    const row=i===2 ? target : {...target,dispatchId:`other_demo_${i}`};
    const receipt={ok:true,result:{workers:[row],page:{...metadata}}};
    if (explicit) { Object.assign(receipt,metadata,{page:{...metadata}}); Object.assign(receipt.result,metadata); }
    raw[i ? `worker-list:cursor_demo_${i}` : 'worker-list']=JSON.stringify(receipt);
  }
  return raw;
}
for (const action of ['worktree','noise','prune']) {
  for (const explicit of [false,true]) test(`R10 released ${action} permits three worker pages ${explicit ? 'explicit' : 'real-shaped'}`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},true,{raw:r => threeWorkerPages(r,explicit)});
  });
  for (const level of ['envelope','result','page']) for (const [name,metadata] of [
    ['truncated',{truncated:true}],['incomplete',{complete:false}],
    ['has-more',{hasMore:false}],['count',{count:2}],['total',{total:4}],['total-count',{totalCount:4}],
    ['next-cursor',{nextCursor:'different_demo'}],['current-cursor',{cursor:'wrong_demo'}],['offset',{offset:0}]
  ]) test(`R10 released ${action} retains middle worker page ${level} ${name}`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
      const raw=threeWorkerPages(r), receipt=JSON.parse(raw['worker-list:cursor_demo_1']);
      Object.assign(level === 'envelope' ? receipt : level === 'result' ? receipt.result : receipt.result.page,metadata);
      raw['worker-list:cursor_demo_1']=JSON.stringify(receipt);
      return raw;
    }});
  });
  test(`R10 released ${action} retains late worker total drift`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
      const raw=threeWorkerPages(r), receipt=JSON.parse(raw['worker-list:cursor_demo_2']);
      for (const target of [receipt,receipt.page,receipt.result,receipt.result.page]) Object.assign(target,{total:4,totalCount:4});
      raw['worker-list:cursor_demo_2']=JSON.stringify(receipt);
      return raw;
    }});
  });
}

// Inapplicable inventories must not turn into a new requirement on direct/missing-tree paths.
for (const action of ['worktree','noise','prune']) test(`R10 direct ${action} permits unused released inventories`, () => {
  completionEvidenceCase('direct',action,{type:'heartbeat'},true,{raw:() => ({'worker-list':'invalid',worktrees:'invalid'})});
});
test('R10 released prune permits absent worktree inventory after Git removal', () => {
  completionEvidenceCase('released','prune',{type:'heartbeat'},true,{raw:() => ({worktrees:'invalid'})});
});

for (const [family,route,action,status] of [
  ['terminals','direct','noise',1],['worker-list','released','noise',0],['worktrees','released','noise',0],['worker-show','direct','prune',0],['inbox','released','prune',1]
]) test(`R10 malformed string in ${family} retains actual resources`, () => {
  completionEvidenceCase(route,action,{type:'heartbeat'},false,{status,timeout:4000,raw:r => ({
    [family]:JSON.stringify(r[family]).slice(0,-1)+',"extension":"'+'\\"'.repeat(80000)
  })});
});

test('R10 malformed string scaling stays bounded through public CLI', t => {
  const timings=[];
  for (const size of [40000,80000,160000,320000,640000]) {
    const elapsed=completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,timeout:4000,raw:r => ({
      inbox:JSON.stringify(r.inbox).slice(0,-1)+',"extension":"'+'\\"'.repeat(size)
    })});
    timings.push(elapsed);
    t.diagnostic(`${size} escaped quotes (${size*2} suffix bytes): ${elapsed.toFixed(1)} ms`);
  }
  // Sixteen times the input may not approach quadratic growth; allow process-start/load noise.
  assert.ok(timings[4] < 6*Math.max(timings[0],250), `unexpected scaling: ${timings.map(x=>x.toFixed(1))}`);
});

// Self-review checks host omission metadata at optional receipt levels too.
test('R10 host-scope page omission retains direct worktree', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:r => {
    r.terminals.result.page={total:0,hasMore:false,hostScope:{hostIds:['host_demo'],omittedHostIds:['host_omitted_demo']}};
    return {terminals:JSON.stringify(r.terminals)};
  }});
});

for (const [family,route,action,count,status] of inventoryCases) {
  for (const level of ['envelope','result','envelope-page','result-page']) {
    for (const [name,scope] of [
      ['omitted-host',{hostIds:['host_demo'],omittedHostIds:['host_omitted_demo']}],
      ['null',null],['missing-hosts',{omittedHostIds:[]}],['missing-omissions',{hostIds:['host_demo']}],
      ['malformed-hosts',{hostIds:[null],omittedHostIds:[]}],['malformed-omissions',{hostIds:['host_demo'],omittedHostIds:'none'}],
      ['different-hosts',{hostIds:['host_other_demo'],omittedHostIds:[]}]
    ]) test(`R10 host-scope ${family} ${route} ${action} retains ${level} ${name}`, () => {
      completionEvidenceCase(route,action,{type:'heartbeat'},false,{status,raw:r => {
        const receipt=r[family], valid={hostIds:['host_demo'],omittedHostIds:[]};
        receipt.hostScope=structuredClone(valid); receipt.result.hostScope=structuredClone(valid);
        receipt.page={total:count,hasMore:false,nextCursor:null,hostScope:structuredClone(valid)};
        receipt.result.page ??= {total:count,hasMore:false,nextCursor:null};
        receipt.result.page.hostScope=structuredClone(valid);
        const target=level==='envelope' ? receipt : level==='result' ? receipt.result : level==='envelope-page' ? receipt.page : receipt.result.page;
        target.hostScope=scope;
        return {[family]:JSON.stringify(receipt)};
      }});
    });
  }
  test(`R10 host-scope ${family} ${route} ${action} permits complete consistent scopes`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},true,{raw:r => {
      const receipt=r[family], scope={hostIds:['host_demo','host_second_demo'],omittedHostIds:[]};
      receipt.hostScope=structuredClone(scope); receipt.result.hostScope={...scope,hostIds:[...scope.hostIds].reverse()};
      receipt.page={total:count,hasMore:false,nextCursor:null,hostScope:structuredClone(scope)};
      receipt.result.page ??= {total:count,hasMore:false,nextCursor:null};
      receipt.result.page.hostScope=structuredClone(scope);
      return {[family]:JSON.stringify(receipt)};
    }});
  });
}

test('R11 terminal identity direct worktree retains dot alias', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:r => {
    const p=r.worktrees.result.worktrees[0].path;
    r.terminals.result.terminals=[{handle:'term_other',worktreePath:p+'/.',branch:'agents/demo'}];
    r.terminals.result.totalCount=1;
    return {terminals:JSON.stringify(r.terminals)};
  }});
});

const terminalVariants = [
  ['dot-alias',p => p+'/.'], ['null-path',() => null], ['missing-path',() => undefined], ['numeric-path',() => 42],
  ['parent-alias',p => p+'/../finished'], ['double-slash',p => p+'//child'],
  ['trailing-slash',p => p+'/'], ['empty',() => ''], ['relative',() => 'finished'],
  ['nul',p => p+'\0'], ['newline',p => p+'\n'],
  ['symlink', (p,f) => { const alias=path.join(f.dir,'alias'); symlinkSync(p,alias); return alias; }],
  ['ancestor-symlink',(p,f) => { const alias=path.join(f.dir,'alias'); symlinkSync(path.dirname(p),alias); return path.join(alias,'finished'); }],
  ['branch-other-path',() => '/invented/distinct'],
  ['path-other-branch',p => p], ['blank-handle',() => '/invented/distinct'],
  ['padded-handle',() => '/invented/distinct'], ['duplicate-handle',() => '/invented/distinct'],
  ['null-branch',() => '/invented/distinct']
];
for (const route of ['direct','released']) for (const action of ['worktree','noise','prune']) {
  for (const [name, makePath] of terminalVariants) test(`R11 terminal identity ${route} ${action} retains ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{status:1,raw:(r,f) => {
      const row={handle:'term_other',worktreePath:makePath(r.worktrees.result.worktrees[0].path,f),branch:'agents/demo'};
      if(name==='path-other-branch') row.branch='agents/other';
      if(name==='blank-handle') row.handle='';
      if(name==='padded-handle') row.handle=' term_other ';
      if(name==='null-branch') row.branch=null;
      r.terminals.result.terminals=[row];
      if(name==='duplicate-handle') r.terminals.result.terminals.push({...row,worktreePath:'/invented/second'});
      r.terminals.result.totalCount=r.terminals.result.terminals.length;
      return {terminals:JSON.stringify(r.terminals)};
    }});
  });
  for(const branch of [true,...(action==='prune'?[]:[false])]) test(`R11 terminal identity ${route} ${action} permits distinct terminal branch ${branch}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},true,{raw:r => {
      r.terminals.result.terminals=[{handle:'term_other',worktreePath:'/invented/distinct',...(branch?{branch:'agents/other'}:{})}];
      r.terminals.result.totalCount=1;
      return {terminals:JSON.stringify(r.terminals)};
    }});
  });
}
for(const action of ['worktree','noise','prune']) test(`R11 final terminal identity direct ${action} retains late alias`, () => {
  completionEvidenceCase('direct',action,{type:'heartbeat'},false,{allowRelease:true,raw:r => {
    const empty=JSON.stringify(r.terminals);
    r.terminals.result.terminals=[{handle:'term_other',branch:'agents/demo',worktreePath:r.worktrees.result.worktrees[0].path+'/.'}];
    r.terminals.result.totalCount=1;
    return {terminals:[empty,empty,JSON.stringify(r.terminals)]};
  }});
});

test('R11 direct worker identity worktree retains different terminal', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:r => {
    r['worker-show'].result.worker.agentTerminalHandle='term_other';
    return {'worker-show':JSON.stringify(r['worker-show'])};
  }});
});

test('R11 worker ownership released worktree retains active owner', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:r => {
    const list=r['worker-list'].result, other=structuredClone(list.workers[0]);
    other.dispatchId='other_dispatch'; other.agentTerminalHandle='term_other'; other.dispatchStatus='dispatched'; other.terminalState='running';
    Object.assign(other.resource,{terminalHandle:'term_other',ownerDispatchId:'other_dispatch',originDispatchId:'other_dispatch',ownershipState:'owned',releaseState:'retained'});
    list.workers.push(other); list.page.total=2;
    return {'worker-list':JSON.stringify(r['worker-list'])};
  }});
});

test('R11 worktree inventory released worktree retains aliased row', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:r => {
    r.worktrees.result.worktrees.push({id:'wt_other',path:r.worktrees.result.worktrees[0].path+'/.'});
    r.worktrees.result.totalCount=2;
    return {worktrees:JSON.stringify(r.worktrees)};
  }});
});

const directContradictions = [
  ['different-dispatch',s => {s.worker.dispatchId='other_dispatch';}],
  ['null-worker',s => {s.worker=null;}], ['array-worker',s => {s.worker=[];}],
  ['different-run',s => {s.worker.runId='run_other';}],
  ['different-task',s => {s.worker.taskId='task_other';}],
  ['different-name',s => {s.worker.startOptions.name='other';}],
  ['different-repo',s => {s.worker.startOptions.repo='id:other';}],
  ['null-options',s => {s.worker.startOptions=null;}],
  ['different-resource-terminal',s => {s.projection.resource.terminalHandle='term_other';}],
  ['different-resource-owner',s => {s.projection.resource.ownerDispatchId='other_dispatch';}],
  ['different-resource-origin',s => {s.projection.resource.originDispatchId='other_dispatch';}],
  ['conflicting-worktree-ids',s => {s.projection.workspace={id:'wt_other'};}],
  ['conflicting-worktree-path',s => {s.projection.workspace={id:'wt_demo',path:'/invented/other'};}],
  ['blank-worktree-id',s => {s.worker.worktreeId='';}],
  ['terminal-branch-path',s => {s.terminal.branch='agents/other';}]
];
for(const action of ['worktree','noise','prune']) {
  for(const [name,mutate] of directContradictions) test(`R11 direct supplied identity ${action} retains ${name}`, () => {
    completionEvidenceCase('direct',action,{type:'heartbeat'},false,{raw:r => {
      mutate(r['worker-show'].result);
      return {'worker-show':JSON.stringify(r['worker-show'])};
    }});
  });
  for(const variant of ['minimal','matching-extra-identities']) test(`R11 direct supplied identity ${action} permits ${variant}`, () => {
    completionEvidenceCase('direct',action,{type:'heartbeat'},true,{raw:r => {
      const s=r['worker-show'].result;
      if(variant==='minimal') delete s.worker;
      else {
        Object.assign(s.worker,{runId:'run_demo',taskId:'task_demo'});
        Object.assign(s.projection.resource,{terminalHandle:'term_demo',ownerDispatchId:'demo-dispatch',originDispatchId:'demo-dispatch',worktreeId:'wt_demo'});
        s.projection.workspace={id:'wt_demo',path:r.worktrees.result.worktrees[0].path};
      }
      return {'worker-show':JSON.stringify(r['worker-show'])};
    }});
  });
}

function otherWorker(r, same = true, historical = false) {
  const row=structuredClone(r['worker-list'].result.workers[0]);
  Object.assign(row,{dispatchId:'other_dispatch',agentTerminalHandle:'term_other',dispatchStatus:historical?'completed':'dispatched',terminalState:historical?'released':'running'});
  Object.assign(row.resource,{terminalHandle:'term_other',originDispatchId:'other_dispatch',ownerDispatchId:'other_dispatch',ownershipState:historical?'released':'owned',releaseState:historical?'released':'retained'});
  if(!same) {row.resource.worktreeId='wt_other'; row.projection.workspace.id='wt_other';}
  return row;
}
function inventoryWithOther(r, other, placement) {
  const target=r['worker-list'].result.workers[0];
  if(placement==='single') {
    r['worker-list'].result.workers.push(other); r['worker-list'].result.page.total=2;
    return {'worker-list':JSON.stringify(r['worker-list'])};
  }
  const distinct=otherWorker(r,false,true); distinct.dispatchId='historical_distinct';
  const rows=placement==='first'?[other,distinct,target]:placement==='middle'?[distinct,other,target]:[target,distinct,other];
  const raw={};
  rows.forEach((row,i) => {
    raw[i?`worker-list:cursor_demo_${i}`:'worker-list']=JSON.stringify({ok:true,result:{workers:[row],page:{total:3,hasMore:i<2,nextCursor:i<2?`cursor_demo_${i+1}`:null}}});
  });
  return raw;
}
for(const action of ['worktree','noise','prune']) for(const placement of ['single','first','middle','last']) {
  for(const [name, same, historical] of [['active-owner',true,false],['distinct-active',false,false],['historical-released',true,true]]) {
    test(`R11 worker ownership ${action} ${placement} ${name}`, () => {
      completionEvidenceCase('released',action,{type:'heartbeat'},name!=='active-owner',{raw:r => inventoryWithOther(r,otherWorker(r,same,historical),placement)});
    });
  }
}
const malformedOtherWorkers = [
  ['missing-resource',row => {delete row.resource;}],
  ['missing-worktree-id',row => {delete row.resource.worktreeId;}],
  ['blank-worktree-id',row => {row.resource.worktreeId='';}],
  ['padded-dispatch',row => {row.dispatchId=' other_dispatch ';}],
  ['conflicting-workspace-id',row => {row.projection.workspace.id='wt_third';}],
  ['active-terminal-only',row => {row.terminalState='running';}],
  ['active-dispatch-only',row => {row.dispatchStatus='dispatched';}],
  ['owned-only',row => {row.resource.ownershipState='owned';}],
  ['retained-only',row => {row.resource.releaseState='retained';}],
  ['missing-release-date',row => {delete row.resource.releaseCompletedAt;}],
  ['top-level-conflicting-id',row => {row.worktreeId='wt_third';}],
  ['different-id-target-path', (row,r) => {row.projection.workspace.path=r.worktrees.result.worktrees[0].path; row.resource.worktreeId='wt_other'; row.projection.workspace.id='wt_other';}],
  ['aliased-target-path',(row,r) => {row.projection.workspace.path=r.worktrees.result.worktrees[0].path+'/.';}]
];
for(const action of ['worktree','noise','prune']) for(const [name,mutate] of malformedOtherWorkers) test(`R11 worker row identity ${action} retains ${name} middle page`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
    const other=otherWorker(r,true,true); mutate(other,r);
    return inventoryWithOther(r,other,'middle');
  }});
});

const malformedWorktrees = [
  ['null-row',() => null], ['missing-id',p => ({path:p+'/other'})],
  ['null-path',() => ({id:'wt_other',path:null})], ['missing-path',() => ({id:'wt_other'})],
  ['empty-id',p => ({id:'',path:p+'/other'})], ['padded-id',p => ({id:' wt_other ',path:p+'/other'})],
  ['relative-path',() => ({id:'wt_other',path:'finished'})], ['empty-path',() => ({id:'wt_other',path:''})],
  ['parent-alias',p => ({id:'wt_other',path:p+'/../finished'})],
  ['duplicate-id',p => ({id:'wt_demo',path:p+'/other'})], ['duplicate-path',p => ({id:'wt_other',path:p})],
  ['symlink-path',(p,f) => {const alias=path.join(f.dir,'alias');symlinkSync(p,alias);return {id:'wt_other',path:alias};}]
];
for(const action of ['worktree','noise']) {
  for(const [name,makeRow] of malformedWorktrees) test(`R11 worktree inventory ${action} retains ${name}`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:(r,f) => {
      r.worktrees.result.worktrees.push(makeRow(r.worktrees.result.worktrees[0].path,f));
      r.worktrees.result.totalCount=2;
      return {worktrees:JSON.stringify(r.worktrees)};
    }});
  });
  test(`R11 worktree inventory ${action} permits distinct valid row`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},true,{raw:r => {
      r.worktrees.result.worktrees.push({id:'wt_other',path:'/invented/distinct'}); r.worktrees.result.totalCount=2;
      return {worktrees:JSON.stringify(r.worktrees)};
    }});
  });
}

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  test(`R11 malformed dispatch identity ${route} ${action} retains padded run`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{raw:r => {
      r['worker-show'].result.dispatch.runId=' run_demo ';
      r['worker-list'].result.workers[0].runId=' run_demo ';
      r.inbox.result.messages[0].run_id=' run_demo ';
      return {'worker-show':JSON.stringify(r['worker-show']),'worker-list':JSON.stringify(r['worker-list']),inbox:JSON.stringify(r.inbox)};
    }});
  });
}
for(const route of ['direct','released']) for(const alias of ['dot','symlink']) test(`R11 controller identity ${route} prune retains ${alias} path`, () => {
  completionEvidenceCase(route,'prune',{type:'heartbeat'},false,{raw:(r,f) => {
    const original=r.worktrees.result.worktrees[0].path;
    const aliasPath=alias==='dot'?original+'/.':path.join(f.dir,'alias');
    if(alias==='symlink') symlinkSync(original,aliasPath);
    const records=JSON.parse(readFileSync(path.join(f.ctl,'workers.json'),'utf8')); records.demo.worktree=aliasPath;
    writeFileSync(path.join(f.ctl,'workers.json'),JSON.stringify(records));
    if(route==='direct') r['worker-show'].result.terminal.worktreePath=aliasPath;
    return {'worker-show':JSON.stringify(r['worker-show'])};
  }});
});
for(const action of ['worktree','noise','prune']) {
  test(`R11 worker inventory ${action} retains changed page scope`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
      const raw=threeWorkerPages(r,false);
      for(const [key,value] of Object.entries(raw)) {
        const page=JSON.parse(value); page.result.hostScope={hostIds:[key.endsWith('_1')?'host_other':'host_demo'],omittedHostIds:[]};
        raw[key]=JSON.stringify(page);
      }
      return raw;
    }});
  });
}

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  for(const [name,mutate] of [
    ['terminal-worktree-id',s => {s.terminal.worktreeId='wt_other';}],
    ['malformed-workspace',s => {s.projection.workspace=null;}]
  ]) test(`R11 extended supplied identity ${route} ${action} retains ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{raw:r => {
      mutate(r['worker-show'].result);
      return {'worker-show':JSON.stringify(r['worker-show'])};
    }});
  });
}
for(const action of ['worktree','noise','prune']) for(const [name,mutate] of [
  ['missing-run',row => {delete row.runId;}],
  ['different-run',row => {row.runId='run_other';}],
  ['malformed-owner',row => {row.resource.ownerDispatchId=null;}],
  ['contradictory-terminal',row => {row.resource.terminalHandle='term_third';}],
  ['resource-running',row => {row.resource.terminalState='running';}],
  ['distinct-active-same-terminal', (row,r) => {
    row.resource.worktreeId='wt_other'; row.projection.workspace.id='wt_other'; row.dispatchStatus='dispatched'; row.terminalState='running';
    row.agentTerminalHandle='term_demo'; row.resource.terminalHandle='term_demo'; row.resource.ownershipState='owned'; row.resource.releaseState='retained';
  }],
  ['conflicting-distinct-paths',row => {
    row.resource.worktreeId='wt_other'; row.projection.workspace.id='wt_other'; row.resource.worktreePath='/invented/first'; row.projection.workspace.path='/invented/second';
  }]
]) test(`R11 extended worker identity ${action} retains ${name}`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
    const other=otherWorker(r,true,true); mutate(other,r);
    return inventoryWithOther(r,other,'last');
  }});
});

for(const action of ['worktree','noise','prune']) {
  test(`R11 final terminal identity released ${action} retains late alias`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{allowRelease:true,raw:r => {
      const empty=JSON.stringify(r.terminals);
      r.terminals.result.terminals=[{handle:'term_other',branch:'agents/demo',worktreePath:r.worktrees.result.worktrees[0].path+'/.'}]; r.terminals.result.totalCount=1;
      return {terminals:[...Array(action==='prune'?4:5).fill(empty),JSON.stringify(r.terminals)]};
    }});
  });
  test(`R11 terminal identity direct ${action} permits registered distinct resource`, () => {
    completionEvidenceCase('direct',action,{type:'heartbeat'},true,{raw:(r,f) => {
      const other=path.join(path.dirname(f.wt),'distinct'); git(f.project,'worktree','add','-b','agents/distinct',other);
      r.terminals.result.terminals=[{handle:'term_other',branch:'agents/distinct',worktreePath:other}]; r.terminals.result.totalCount=1;
      return {terminals:JSON.stringify(r.terminals)};
    }});
  });
  test(`R11 worker inventory ${action} permits stable reordered scope and absent final cursor`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},true,{raw:r => {
      const raw=threeWorkerPages(r,false);
      for(const [key,value] of Object.entries(raw)) {
        const page=JSON.parse(value); page.result.hostScope={hostIds:key.endsWith('_1')?['host_other','host_demo']:['host_demo','host_other'],omittedHostIds:[]};
        if(!page.result.page.hasMore) delete page.result.page.nextCursor;
        raw[key]=JSON.stringify(page);
      }
      return raw;
    }});
  });
}
for(const action of ['worktree','noise','prune']) test(`R11 final worker ownership ${action} retains reassignment`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{allowRelease:true,raw:r => {
    const valid=JSON.stringify(r['worker-list']);
    const conflict=inventoryWithOther(r,otherWorker(r,true,false),'single')['worker-list'];
    return {'worker-list':[...Array(action==='prune'?2:3).fill(valid),conflict]};
  }});
});

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  for(const [name,mutate] of [
    ['different-worker-terminal',s => {s.worker.agentTerminalHandle='term_other';}],
    ['different-worker-dispatch',s => {s.worker.dispatchId='other_dispatch';}]
  ]) test(`R11 worker-show correlation ${route} ${action} retains ${name}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{raw:r => {
      mutate(r['worker-show'].result);
      return {'worker-show':JSON.stringify(r['worker-show'])};
    }});
  });
}
for(const action of ['worktree','noise','prune']) test(`R11 final direct identity ${action} retains contradiction`, () => {
  completionEvidenceCase('direct',action,{type:'heartbeat'},false,{allowRelease:true,raw:r => {
    const valid=JSON.stringify(r['worker-show']);
    r['worker-show'].result.worker.dispatchId='other_dispatch';
    return {'worker-show':[valid,valid,valid,JSON.stringify(r['worker-show'])]};
  }});
});
for(const action of ['worktree','noise']) test(`R11 final worktree inventory ${action} retains contradiction`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{allowRelease:true,raw:r => {
    const valid=JSON.stringify(r.worktrees);
    r.worktrees.result.worktrees.push({id:'wt_other',path:null}); r.worktrees.result.totalCount=2;
    return {worktrees:[valid,valid,JSON.stringify(r.worktrees)]};
  }});
});
for(const action of ['worktree','noise','prune']) for(const variant of ['omitted-middle','new-middle']) test(`R11 worker inventory ${action} retains ${variant} scope`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{raw:r => {
    const raw=threeWorkerPages(r,false);
    for(const [key,value] of Object.entries(raw)) {
      const page=JSON.parse(value), middle=key.endsWith('_1');
      if(variant==='omitted-middle'?!middle:middle) page.result.hostScope={hostIds:['host_demo'],omittedHostIds:[]};
      raw[key]=JSON.stringify(page);
    }
    return raw;
  }});
});

// R12 uses documented path-bearing IDs and actual distinct Git worktrees.
function r12FullIds(r, f, id = `demo::${f.wt}`) {
  Object.assign(r, JSON.parse(JSON.stringify(r).replaceAll('"wt_demo"', JSON.stringify(id))));
}
function r12Raw(r) { return Object.fromEntries(Object.entries(r).map(([key,value]) => [key,JSON.stringify(value)])); }
function r12DistinctTerminal(r, f, id) {
  const distinct=path.join(path.dirname(f.wt),'distinct');
  git(f.project,'worktree','add','-b','agents/distinct',distinct);
  r.terminals.result.terminals=[{handle:'term_other',branch:'agents/distinct',worktreePath:distinct,worktreeId:id ?? `demo::${distinct}`}];
  r.terminals.result.totalCount=1;
}
test('R12 terminal ID direct worktree retains contradictory path', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:(r,f) => {
    r12FullIds(r,f); r12DistinctTerminal(r,f,`demo::${f.wt}`); return r12Raw(r);
  }});
});
for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  for(const phase of ['initial','final']) for(const variant of ['contradictory-path','wrong-repo','dot-alias','parent-alias','symlink-alias','absent','distinct']) {
    test(`R12 terminal ID ${route} ${action} ${phase} ${variant}`, () => {
      const eligible=['absent','distinct'].includes(variant);
      completionEvidenceCase(route,action,{type:'heartbeat'},eligible,{status:eligible || phase==='final'?0:1,allowRelease:phase==='final',raw:(r,f) => {
        r12FullIds(r,f);
        const empty=JSON.stringify(r.terminals);
        r12DistinctTerminal(r,f);
        const terminal=r.terminals.result.terminals[0], distinct=terminal.worktreePath;
        if(variant==='contradictory-path') terminal.worktreeId=`demo::${f.wt}`;
        if(variant==='wrong-repo') terminal.worktreeId=`other::${distinct}`;
        if(variant==='dot-alias') terminal.worktreeId=`demo::${distinct}/.`;
        if(variant==='parent-alias') terminal.worktreeId=`demo::${distinct}/../distinct`;
        if(variant==='symlink-alias') { const alias=path.join(f.dir,'alias'); symlinkSync(distinct,alias); terminal.worktreeId=`demo::${alias}`; }
        if(variant==='absent') delete terminal.worktreeId;
        const raw=r12Raw(r);
        if(phase==='final') raw.terminals=[...Array(route==='direct'?2:action==='prune'?4:5).fill(empty),raw.terminals];
        return raw;
      }});
    });
  }
}

test('R12 supplied ID direct worktree retains consistent aliased ID', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    r12FullIds(r,f,`demo::${f.wt}/.`); return r12Raw(r);
  }});
});

test('R12 owner ID worktree middle retains aliased active owner', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    r12FullIds(r,f);
    const other=otherWorker(r,true,false);
    other.resource.worktreeId+= '/.'; other.projection.workspace.id=other.resource.worktreeId;
    return {...r12Raw(r),...inventoryWithOther(r,other,'middle')};
  }});
});

test('R12 worktree ID worktree retains embedded target at distinct path', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    r12FullIds(r,f);
    r.worktrees.result.worktrees.push({id:`demo::${f.wt}/.`,path:'/invented/distinct'});
    r.worktrees.result.totalCount=2;
    return r12Raw(r);
  }});
});

test('R12 owner ID worktree last retains encoded target with legacy target ID', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    const other=otherWorker(r,false,false);
    other.resource.worktreeId=`demo::${f.wt}`; other.projection.workspace.id=other.resource.worktreeId;
    return inventoryWithOther(r,other,'last');
  }});
});

test('R12 release confirmation direct worktree retains contradictory supplied ID', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,allowRelease:true,raw:(r,f) => {
    r12FullIds(r,f); const valid=JSON.stringify(r['worker-show']);
    r['worker-show'].result.worker.worktreeId=`other::${f.wt}`;
    return {...r12Raw(r),'worker-show':[valid,valid,JSON.stringify(r['worker-show']),valid]};
  }});
});

const r12BadIds=[
  ['dot-alias',(p) => `demo::${p}/.`], ['parent-alias',p => `demo::${p}/../finished`],
  ['wrong-repo',p => `other::${p}`], ['conflicting-path',() => 'demo::/invented/distinct'],
  ['relative',() => 'demo::finished'], ['missing-repo',p => `::${p}`],
  ['missing-path',() => 'demo::'], ['bare-path',p => p],
  ['symlink-alias',(p,f) => {const alias=path.join(f.dir,'alias');symlinkSync(p,alias);return `demo::${alias}`;}]
];
for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  for(const phase of ['initial','final']) for(const [name,makeId] of r12BadIds) {
    test(`R12 supplied ID ${route} ${action} ${phase} ${name}`, () => {
      completionEvidenceCase(route,action,{type:'heartbeat'},false,{allowRelease:phase==='final',raw:(r,f) => {
        r12FullIds(r,f); const valid=JSON.stringify(r['worker-show']);
        const badId=makeId(f.wt,f);
        // Change all supplied worker-show IDs together: raw equality alone cannot catch this.
        const bad=JSON.stringify(r['worker-show']).replaceAll(JSON.stringify(`demo::${f.wt}`),JSON.stringify(badId));
        return {...r12Raw(r),'worker-show':phase==='initial'?bad:[valid,valid,valid,bad]};
      }});
    });
  }
  for(const variant of (route==='direct'?['canonical','opaque','minimal']:['canonical','opaque'])) test(`R12 supplied ID ${route} ${action} permits ${variant}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},true,{raw:(r,f) => {
      if(variant!=='opaque') {
        r12FullIds(r,f); const s=r['worker-show'].result;
        s.projection.resource.worktreeId=`demo::${f.wt}`; s.projection.workspace={id:`demo::${f.wt}`,path:f.wt}; s.terminal.worktreeId=`demo::${f.wt}`;
      }
      if(variant==='minimal') { delete r['worker-show'].result.worker; r['worker-show'].result.terminal.worktreeId=`demo::${f.wt}`; }
      return {...r12Raw(r),...(route==='direct'?{'worker-list':'invalid',worktrees:'invalid'}:{})};
    }});
  });
  for(const field of ['worker','resource','workspace','terminal']) test(`R12 supplied ID ${route} ${action} validates ${field} independently`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{raw:(r,f) => {
      const s=r['worker-show'].result;
      if(route==='direct') delete s.worker.worktreeId;
      if(field==='worker') s.worker.worktreeId=`other::${f.wt}`;
      if(field==='resource') s.projection.resource.worktreeId=`other::${f.wt}`;
      if(field==='workspace') s.projection.workspace={id:`other::${f.wt}`};
      if(field==='terminal') s.terminal.worktreeId=`other::${f.wt}`;
      return r12Raw(r);
    }});
  });
  for(const variant of ['wrong-repo','alias','conflicting-path']) test(`R12 release confirmation ${route} ${action} ${variant}`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{status:1,allowRelease:true,raw:(r,f) => {
      r12FullIds(r,f); const valid=JSON.stringify(r['worker-show']);
      const bad=structuredClone(r['worker-show']);
      bad.result.terminal.worktreeId=variant==='wrong-repo'?`other::${f.wt}`:variant==='alias'?`demo::${f.wt}/.`:'demo::/invented/distinct';
      return {...r12Raw(r),'worker-show':[valid,valid,JSON.stringify(bad),valid]};
    }});
  });
}

for(const action of ['worktree','noise','prune']) for(const placement of ['single','first','middle','last']) {
  for(const variant of ['same-active','alias-active','parent-active','wrong-repo','conflicting-path','distinct-active','historical-released','historical-distinct','encoded-vs-opaque']) {
    test(`R12 owner ID ${action} ${placement} ${variant}`, () => {
      const eligible=['distinct-active','historical-released','historical-distinct'].includes(variant);
      completionEvidenceCase('released',action,{type:'heartbeat'},eligible,{raw:(r,f) => {
        if(variant!=='encoded-vs-opaque') r12FullIds(r,f);
        const distinct=['distinct-active','historical-distinct','conflicting-path'].includes(variant);
        const historical=variant.startsWith('historical');
        const other=otherWorker(r,!distinct,historical);
        let id=distinct?'demo::/invented/distinct':`demo::${f.wt}`;
        if(variant==='alias-active') id+='/.';
        if(variant==='parent-active') id+='/../finished';
        if(variant==='wrong-repo') id=`other::${f.wt}`;
        other.resource.worktreeId=id; other.projection.workspace.id=id;
        if(variant==='conflicting-path') other.projection.workspace.path=f.wt;
        return {...r12Raw(r),...inventoryWithOther(r,other,placement)};
      }});
    });
  }
  test(`R12 final owner ID ${action} ${placement} retains aliased active owner`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{allowRelease:true,raw:(r,f) => {
      r12FullIds(r,f);
      const valid=inventoryWithOther(structuredClone(r),otherWorker(r,false,true),placement);
      const other=otherWorker(r,true,false);
      other.resource.worktreeId+='/.'; other.projection.workspace.id=other.resource.worktreeId;
      const conflict=inventoryWithOther(r,other,placement), pages=placement==='single'?1:3;
      const raw=r12Raw(r);
      for(const key of Object.keys(conflict)) raw[key]=[...Array((action==='prune'?2:3)*pages).fill(valid[key]),conflict[key]];
      return raw;
    }});
  });
}

for(const action of ['worktree','noise']) for(const phase of ['initial','final']) {
  for(const variant of ['alias-id','wrong-repo','contradictory-path','malformed-id','distinct','duplicate-id','duplicate-path']) {
    test(`R12 worktree ID ${action} ${phase} ${variant}`, () => {
      const eligible=variant==='distinct';
      completionEvidenceCase('released',action,{type:'heartbeat'},eligible,{allowRelease:phase==='final',raw:(r,f) => {
        r12FullIds(r,f); const valid=JSON.stringify(r.worktrees);
        const row={id:'demo::/invented/distinct',path:'/invented/distinct'};
        if(variant==='alias-id') row.id=`demo::${f.wt}/.`;
        if(variant==='wrong-repo') row.id='other::/invented/distinct';
        if(variant==='contradictory-path') row.id=`demo::${f.wt}`;
        if(variant==='malformed-id') row.id='demo::relative';
        if(variant==='duplicate-id') {row.id=`demo::${f.wt}`;row.path=f.wt;}
        if(variant==='duplicate-path') {row.id='wt_other';row.path=f.wt;}
        r.worktrees.result.worktrees.push(row); r.worktrees.result.totalCount=2;
        const raw=r12Raw(r);
        if(phase==='final') raw.worktrees=[valid,valid,raw.worktrees];
        return raw;
      }});
    });
  }
}

for(const action of ['worktree','noise','prune']) for(const placement of ['first','middle','last']) {
  for(const variant of ['same-id-conflicting-paths','same-path-conflicting-ids','historical-consistent','distinct-consistent']) test(`R12 page mappings ${action} target-${placement} ${variant}`, () => {
    const eligible=variant.endsWith('consistent');
    completionEvidenceCase('released',action,{type:'heartbeat'},eligible,{raw:(r,f) => {
      r12FullIds(r,f);
      const first=otherWorker(r,false,true), second=structuredClone(first);
      second.dispatchId='historical_second'; second.agentTerminalHandle='term_second';
      Object.assign(second.resource,{terminalHandle:'term_second',ownerDispatchId:'historical_second',originDispatchId:'historical_second'});
      first.projection.workspace.path='/invented/first'; second.projection.workspace.path='/invented/first';
      if(variant==='same-id-conflicting-paths') second.projection.workspace.path='/invented/second';
      if(variant==='same-path-conflicting-ids') {second.resource.worktreeId='wt_second';second.projection.workspace.id='wt_second';}
      if(variant==='distinct-consistent') {second.resource.worktreeId='demo::/invented/second';second.projection.workspace.id='demo::/invented/second';second.projection.workspace.path='/invented/second';}
      const target=r['worker-list'].result.workers[0];
      const rows=placement==='first'?[target,first,second]:placement==='middle'?[first,target,second]:[first,second,target];
      const raw=r12Raw(r);
      rows.forEach((row,i) => {raw[i?`worker-list:cursor_demo_${i}`:'worker-list']=JSON.stringify({ok:true,result:{workers:[row],page:{total:3,hasMore:i<2,nextCursor:i<2?`cursor_demo_${i+1}`:null}}});});
      return raw;
    }});
  });
}

test('R12 terminal mappings direct worktree retains one opaque ID at distinct paths', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:(r,f) => {
    r12DistinctTerminal(r,f,'wt_distinct');
    const third=path.join(path.dirname(f.wt),'third'); git(f.project,'worktree','add','-b','agents/third',third);
    r.terminals.result.terminals.push({handle:'term_third',branch:'agents/third',worktreePath:third,worktreeId:'wt_distinct'});
    r.terminals.result.totalCount=2; return {terminals:JSON.stringify(r.terminals)};
  }});
});

test('R12 supplied ID direct worktree retains unconfigured encoded repository', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    const config=JSON.parse(readFileSync(path.join(f.ctl,'factory.config.json'),'utf8'));
    config.hosts.workers[0].orcaRepoId=''; writeFileSync(path.join(f.ctl,'factory.config.json'),JSON.stringify(config));
    r12FullIds(r,f,`::${f.wt}`); r['worker-show'].result.worker.startOptions.repo='id:';
    return r12Raw(r);
  }});
});

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) {
  for(const phase of ['initial','final']) for(const variant of ['same-id-distinct-paths','same-path-distinct-ids','consistent-shared-path']) {
    test(`R12 terminal mappings ${route} ${action} ${phase} ${variant}`, () => {
      const eligible=variant==='consistent-shared-path';
      completionEvidenceCase(route,action,{type:'heartbeat'},eligible,{status:eligible || phase==='final'?0:1,allowRelease:phase==='final',raw:(r,f) => {
        r12FullIds(r,f); const empty=JSON.stringify(r.terminals);
        r12DistinctTerminal(r,f,'wt_distinct');
        const terminal={...r.terminals.result.terminals[0],handle:'term_third'};
        if(variant==='same-id-distinct-paths') {
          terminal.worktreePath=path.join(path.dirname(f.wt),'third');terminal.branch='agents/third';
          git(f.project,'worktree','add','-b',terminal.branch,terminal.worktreePath);
        }
        if(variant==='same-path-distinct-ids') terminal.worktreeId='wt_third';
        r.terminals.result.terminals.push(terminal);r.terminals.result.totalCount=2;
        const raw=r12Raw(r);
        if(phase==='final') raw.terminals=[...Array(route==='direct'?2:action==='prune'?4:5).fill(empty),raw.terminals];
        return raw;
      }});
    });
  }
}


test('R12 transient terminal ID direct worktree retains first-observation contradiction', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:1,raw:(r,f) => {
    r12FullIds(r,f); const valid=JSON.stringify(r.terminals);
    r12DistinctTerminal(r,f,`demo::${f.wt}`);
    return {...r12Raw(r),terminals:[JSON.stringify(r.terminals),valid]};
  }});
});
test('R12 transient supplied ID direct worktree retains first-observation contradiction', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{status:0,raw:(r,f) => {
    r12FullIds(r,f); const valid=JSON.stringify(r['worker-show']);
    r['worker-show'].result.worker.worktreeId=`other::${f.wt}`;
    return {...r12Raw(r),'worker-show':[JSON.stringify(r['worker-show']),valid]};
  }});
});

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) for(const phase of ['initial','final']) {
  for(const boundary of ['terminal','worker-show']) test(`R12 transient ${boundary} ID ${route} ${action} ${phase} then-valid`, () => {
    completionEvidenceCase(route,action,{type:'heartbeat'},false,{status:phase==='initial' && boundary==='terminal'?1:0,allowRelease:phase==='final',raw:(r,f) => {
      r12FullIds(r,f); const raw=r12Raw(r);
      if(boundary==='terminal') {
        const valid=JSON.stringify(r.terminals);r12DistinctTerminal(r,f,`demo::${f.wt}`);
        raw.terminals=[...Array(phase==='initial'?0:route==='direct'?2:action==='prune'?4:5).fill(valid),JSON.stringify(r.terminals),valid];
      } else {
        const valid=JSON.stringify(r['worker-show']);r['worker-show'].result.worker.worktreeId=`other::${f.wt}`;
        raw['worker-show']=[...Array(phase==='initial'?0:3).fill(valid),JSON.stringify(r['worker-show']),valid];
      }
      return raw;
    }});
  });
}
for(const action of ['worktree','noise','prune']) for(const placement of ['single','first','middle','last']) for(const phase of ['initial','final']) for(const idStyle of ['alias','exact']) {
  test(`R12 transient owner ID ${action} ${placement} ${phase} ${idStyle} then-valid`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},false,{status:0,allowRelease:phase==='final',raw:(r,f) => {
      r12FullIds(r,f);
      const valid=inventoryWithOther(structuredClone(r),otherWorker(r,false,true),placement);
      const other=otherWorker(r,true,false);if(idStyle==='alias') other.resource.worktreeId+='/.';other.projection.workspace.id=other.resource.worktreeId;
      const bad=inventoryWithOther(r,other,placement),pages=placement==='single'?1:3,raw=r12Raw(r);
      Object.keys(bad).forEach((key,i) => {raw[key]=[...Array((phase==='initial'?0:(action==='prune'?2:3)*pages)+i).fill(valid[key]),bad[key],valid[key]];});
      return raw;
    }});
  });
}
for(const action of ['worktree','noise']) for(const phase of ['initial','final']) test(`R12 transient worktree ID ${action} ${phase} then-valid`, () => {
  completionEvidenceCase('released',action,{type:'heartbeat'},false,{status:0,allowRelease:phase==='final',raw:(r,f) => {
    r12FullIds(r,f);const valid=JSON.stringify(r.worktrees);
    r.worktrees.result.worktrees.push({id:`demo::${f.wt}/.`,path:'/invented/distinct'});r.worktrees.result.totalCount=2;
    return {...r12Raw(r),worktrees:[...Array(phase==='initial'?0:2).fill(valid),JSON.stringify(r.worktrees),valid]};
  }});
});

test('R12 transient owner ID worktree single retains exact active owner then-valid', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    r12FullIds(r,f);const valid=JSON.stringify(r['worker-list']);
    const bad=inventoryWithOther(r,otherWorker(r,true,false),'single')['worker-list'];
    return {...r12Raw(r),'worker-list':[bad,valid]};
  }});
});

test('R13 cross-inventory direct worktree initial same-opaque retains target', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:(r,f) => {
    r12DistinctTerminal(r,f,'wt_demo');
    return r12Raw(r);
  }});
});

test('R13 transient dispatch direct worktree initial terminal-handle', () => {
  completionEvidenceCase('direct','worktree',{type:'heartbeat'},false,{raw:r => {
    const valid=JSON.stringify(r['worker-show']);
    r['worker-show'].result.terminal.handle='term_other';
    return {'worker-show':[JSON.stringify(r['worker-show']),valid]};
  }});
});

test('R13 transient duplicate released worktree initial same-page', () => {
  completionEvidenceCase('released','worktree',{type:'heartbeat'},false,{raw:r => {
    const valid=JSON.stringify(r['worker-list']);
    r['worker-list'].result.workers.push(structuredClone(r['worker-list'].result.workers[0]));
    r['worker-list'].result.page.total=2;
    return {'worker-list':[JSON.stringify(r['worker-list']),valid]};
  }});
});

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) for(const phase of ['initial','final']) {
  for(const variant of ['same-opaque','distinct-opaque','no-id']) test(`R13 cross-inventory ${route} ${action} ${phase} ${variant} then-valid`, () => {
    const eligible=variant!=='same-opaque';
    completionEvidenceCase(route,action,{type:'heartbeat'},eligible,{allowRelease:phase==='final',raw:(r,f) => {
      const empty=JSON.stringify(r.terminals);
      r12DistinctTerminal(r,f,variant==='same-opaque'?'wt_demo':'wt_other');
      if(variant==='no-id') delete r.terminals.result.terminals[0].worktreeId;
      const raw=r12Raw(r),terminal=JSON.stringify(r.terminals);
      raw.terminals=phase==='initial'?[terminal,terminal,empty]:[...Array(route==='direct'?2:action==='prune'?4:5).fill(empty),terminal,empty];
      return raw;
    }});
  });
}

for(const action of ['worktree','noise','prune']) for(const phase of ['initial','final']) for(const source of ['worker','resource','workspace','terminal','minimal']) {
  test(`R13 direct association ${action} ${phase} ${source}`, () => {
    completionEvidenceCase('direct',action,{type:'heartbeat'},source==='minimal',{allowRelease:phase==='final',raw:(r,f) => {
      const s=r['worker-show'].result;
      delete s.worker;
      if(source==='worker') s.worker={worktreeId:'wt_demo'};
      if(source==='resource') s.projection.resource.worktreeId='wt_demo';
      if(source==='workspace') s.projection.workspace={id:'wt_demo'};
      if(source==='terminal') s.terminal.worktreeId='wt_demo';
      const empty=JSON.stringify(r.terminals);
      r12DistinctTerminal(r,f,'wt_demo');
      return {...r12Raw(r),worktrees:'{"ok":false}', 'worker-list':'{"ok":false}',terminals:phase==='initial'?JSON.stringify(r.terminals):[empty,empty,JSON.stringify(r.terminals),empty]};
    }});
  });
}

for(const action of ['worktree','noise','prune']) for(const phase of ['initial','final']) for(const placement of ['first','middle','last']) {
  for(const variant of ['opaque-conflict','same-path-different-id','historical-consistent','distinct-active','no-path']) {
    test(`R13 cross-page association ${action} ${phase} ${placement} ${variant}`, () => {
      const eligible=!['opaque-conflict','same-path-different-id'].includes(variant);
      completionEvidenceCase('released',action,{type:'heartbeat'},eligible,{allowRelease:phase==='final',raw:(r,f) => {
        r12DistinctTerminal(r,f,'wt_live');
        const terminalPath=r.terminals.result.terminals[0].worktreePath;
        const other=otherWorker(r,false,variant!=='distinct-active');
        other.resource.worktreeId='wt_live';other.projection.workspace.id='wt_live';
        other.projection.workspace.path=terminalPath;
        const valid=inventoryWithOther(structuredClone(r),structuredClone(other),placement);
        if(variant==='opaque-conflict') other.projection.workspace.path='/invented/different';
        if(variant==='same-path-different-id') {other.resource.worktreeId='wt_different';other.projection.workspace.id='wt_different';}
        if(variant==='no-path') delete other.projection.workspace.path;
        const bad=inventoryWithOther(r,other,placement),raw=r12Raw(r);
        Object.keys(bad).forEach((key,i) => {raw[key]=phase==='initial'?bad[key]:[...Array((action==='prune'?2:3)*3+i).fill(valid[key]),bad[key],valid[key]];});
        return raw;
      }});
    });
  }
}

for(const action of ['worktree','noise']) for(const phase of ['initial','final']) for(const variant of ['opaque-conflict','same-path-different-id','distinct-consistent']) {
  test(`R13 cross-worktree association ${action} ${phase} ${variant}`, () => {
    completionEvidenceCase('released',action,{type:'heartbeat'},variant==='distinct-consistent',{allowRelease:phase==='final',raw:(r,f) => {
      r12DistinctTerminal(r,f,'wt_live');
      const row={id:'wt_live',path:r.terminals.result.terminals[0].worktreePath};
      r.worktrees.result.worktrees.push(row);r.worktrees.result.totalCount=2;
      const valid=JSON.stringify(r.worktrees);
      if(variant==='opaque-conflict') row.path='/invented/different';
      if(variant==='same-path-different-id') row.id='wt_different';
      const bad=JSON.stringify(r.worktrees);
      return {...r12Raw(r),worktrees:phase==='initial'?bad:[valid,valid,bad,valid]};
    }});
  });
}

for(const route of ['direct','released']) for(const action of ['worktree','noise','prune']) for(const phase of ['initial','pre-release','release','final']) {
  for(const variant of ['terminal-handle','dispatch-id','consistent']) test(`R13 dispatch correlation ${route} ${action} ${phase} ${variant} then-valid`, () => {
    const eligible=variant==='consistent';
    completionEvidenceCase(route,action,{type:'heartbeat'},eligible,{allowRelease:['release','final'].includes(phase),status:!eligible && phase==='release'?1:0,raw:r => {
      const valid=JSON.stringify(r['worker-show']);
      if(variant==='terminal-handle') r['worker-show'].result.terminal.handle='term_other';
      if(variant==='dispatch-id') r['worker-show'].result.dispatch.id='other-dispatch';
      const offset=phase==='initial'?0:phase==='pre-release'?1:phase==='release'?2:action==='prune'?3:4;
      return {'worker-show':[...Array(offset).fill(valid),JSON.stringify(r['worker-show']),valid]};
    }});
  });
}

function r13Pages(rows) {
  return Object.fromEntries(rows.map((row,i) => [i?`worker-list:cursor_demo_${i}`:'worker-list',JSON.stringify({ok:true,result:{workers:[row],page:{total:rows.length,hasMore:i<rows.length-1,nextCursor:i<rows.length-1?`cursor_demo_${i+1}`:null}}})]));
}
for(const action of ['worktree','noise','prune']) for(const phase of ['initial','final']) for(const placement of ['same-page','first-middle','first-last','middle-last']) {
  for(const variant of ['duplicate-target','duplicate-historical','conflicting-dispatch','historical-consistent','distinct-active']) {
    test(`R13 duplicate dispatch ${action} ${phase} ${placement} ${variant} then-valid`, () => {
      const eligible=['historical-consistent','distinct-active'].includes(variant);
      completionEvidenceCase('released',action,{type:'heartbeat'},eligible,{allowRelease:phase==='final',raw:r => {
        const target=r['worker-list'].result.workers[0],first=otherWorker(r,false,true),second=structuredClone(first);
        second.dispatchId='historical_second';second.resource.ownerDispatchId='historical_second';second.resource.originDispatchId='historical_second';
        if(variant==='distinct-active') {
          Object.assign(first,{dispatchStatus:'dispatched',terminalState:'running'});
          Object.assign(first.resource,{ownershipState:'owned',releaseState:'retained'});
        }
        const rows=placement==='first-middle'?[first,second,target]:placement==='first-last'?[first,target,second]:[target,first,second];
        const valid=placement==='same-page'?{'worker-list':JSON.stringify({ok:true,result:{workers:rows,page:{total:3,hasMore:false,nextCursor:null}}})}:r13Pages(rows);
        if(variant==='duplicate-target') {rows[rows.indexOf(first)]=structuredClone(target);rows[rows.indexOf(second)]=structuredClone(target);}
        if(variant==='duplicate-historical' || variant==='conflicting-dispatch') second.dispatchId=first.dispatchId;
        if(variant==='conflicting-dispatch') {second.agentTerminalHandle='term_third';second.resource.terminalHandle='term_third';}
        const bad=placement==='same-page'?{'worker-list':JSON.stringify({ok:true,result:{workers:rows,page:{total:3,hasMore:false,nextCursor:null}}})}:r13Pages(rows);
        const pages=placement==='same-page'?1:3;
        return Object.fromEntries(Object.keys(bad).map((key,i) => [key,[...Array((phase==='initial'?0:(action==='prune'?2:3)*pages)+i).fill(valid[key]),bad[key],valid[key]]]));
      }});
    });
  }
}
