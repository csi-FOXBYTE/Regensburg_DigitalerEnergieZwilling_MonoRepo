import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../packages/energy-core/', import.meta.url));
function fingerprint() {
  const hash = createHash('sha256');
  function walk(dir) {
    for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else hash.update(path).update(readFileSync(resolve(root, path)));
    }
  }
  walk('src');
  for (const path of ['package.json', 'tsconfig.json', 'tsdown.config.ts']) hash.update(readFileSync(resolve(root, path)));
  return hash.digest('hex');
}
let previous = process.env.CORE_ALREADY_BUILT === '1' ? fingerprint() : '';
let child;
let stopped = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopped = true; child?.kill(signal); });
// Hash polling also works on bind mounts that emit spurious access/change events.
while (!stopped) {
  const next = fingerprint();
  if (next !== previous) {
    previous = next;
    const status = await new Promise((done, reject) => {
      child = spawn('pnpm', ['exec', 'tsdown', '--no-clean'], { cwd: root, stdio: 'inherit' });
      child.once('error', reject); child.once('exit', done);
    });
    child = undefined;
    if (status === 0) { console.log('Energy core rebuilt.'); process.send?.('built'); }
    else console.error('Energy core build failed; waiting for the next edit.');
  }
  await new Promise(done => setTimeout(done, 750));
}
