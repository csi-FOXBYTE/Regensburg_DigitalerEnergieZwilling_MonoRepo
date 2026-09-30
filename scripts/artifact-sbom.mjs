import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const component = process.argv[2];
assert(['frontend', 'adminfrontend', 'backend'].includes(component));
const cwd = `apps/${component}`;
const build = process.env.BUILD_ID ?? 'local';
const source = process.env.SOURCE_COMMIT ?? 'local';
assert(build === 'local' || /^\d+-\d+$/.test(build));
assert(source === 'local' || /^[a-f0-9]{40}$/.test(source));
execFileSync('pnpm', ['run', 'sbom'], { cwd, stdio: 'inherit' });
const file = `${cwd}/SBOM.cdx.json`;
const bom = JSON.parse(readFileSync(file));
const root = bom.metadata.component;
const previous = root['bom-ref'];
root.version = `build-${build}`;
root['bom-ref'] = `regensburg:${component}:${root.version}`;
// Build identities are not npm versions.
delete root.purl;
for (const entry of bom.dependencies ?? []) {
  if (entry.ref === previous) entry.ref = root['bom-ref'];
  entry.dependsOn = entry.dependsOn?.map(ref => ref === previous ? root['bom-ref'] : ref);
}
root.properties = (root.properties ?? []).filter(p => !['vcs:commit', 'regensburg:build', 'sbom:source-state'].includes(p.name));
root.properties.push({ name: 'vcs:commit', value: source }, { name: 'regensburg:build', value: build },
  { name: 'sbom:source-state', value: source === 'local' ? 'local validation only' : 'pinned Git build context' });
writeFileSync(file, JSON.stringify(bom, null, 2) + '\n');
