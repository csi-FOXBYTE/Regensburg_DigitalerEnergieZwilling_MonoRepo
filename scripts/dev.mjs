import { spawn, fork, execFileSync } from 'node:child_process';
execFileSync('pnpm', ['prepare:workspace'], { stdio: 'inherit' });
const children = new Map();
let stopping = false;
function stop(child) { if (child?.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} } }
function start(component) {
  const child = spawn('pnpm', ['--dir', `apps/${component}`, 'run', 'dev'], { stdio: 'inherit', detached: true });
  children.set(component, child);
  child.on('error', error => { console.error(error); shutdown(1); });
  child.on('exit', code => { if (!stopping && children.get(component) === child) shutdown(code || 1); });
}
function shutdown(code = 0) {
  if (stopping) return; stopping = true;
  for (const child of children.values()) stop(child);
  watcher.kill('SIGTERM'); process.exitCode = code;
}
const watcher = fork(new URL('./watch-core.mjs', import.meta.url), [], { env: { ...process.env, CORE_ALREADY_BUILT: '1' } });
watcher.on('message', message => {
  if (message !== 'built' || stopping) return;
  const old = children.get('backend'); children.delete('backend'); stop(old);
  old.once('exit', () => { if (!stopping) start('backend'); });
});
watcher.on('exit', code => { if (!stopping) shutdown(code || 1); });
for (const c of ['frontend', 'adminfrontend', 'backend']) start(c);
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => shutdown());
