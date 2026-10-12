import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { digest, run, save } from './compliance/common.mjs';

const testPackage = process.argv[2] === '--test-package';
assert.equal(process.argv.length, testPackage ? 3 : 2, 'Only --test-package is supported');
const root = path.resolve('.local/core-package');
assert(!existsSync(root), 'Use a fresh core-package directory');
mkdirSync(root, { recursive: true });
const file = 'packages/energy-core/package.json';
const original = readFileSync(file);
const pkg = JSON.parse(original);
if (testPackage) {
  assert(/^\d+$/.test(process.env.GITHUB_RUN_ID || '') && /^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT || ''));
  pkg.name = '@csi-foxbyte/regensburg-web-energy-core-test';
  pkg.version += `-test.${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`;
  pkg.repository = { type: 'git', url: 'git+https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo.git', directory: 'packages/energy-core' };
}
try {
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  run('pnpm', ['--filter', './packages/energy-core', 'run', 'sbom'], { stdio: 'inherit' });
  run('pnpm', ['--filter', './packages/energy-core', 'pack', '--pack-destination', root], { stdio: 'inherit' });
  const tarballs = readdirSync(root).filter(f => f.endsWith('.tgz'));
  assert.equal(tarballs.length, 1);
  for (const name of ['SBOM.cdx.json', 'SBOM.csv']) copyFileSync(`packages/energy-core/${name}`, path.join(root, name));
  const tarball = path.join(root, tarballs[0]);
  save(path.join(root, 'selection.json'), { sourceCommit: run('git', ['rev-parse', 'HEAD']), tarball,
    sha256: digest(readFileSync(tarball)), package: { name: pkg.name, version: pkg.version } });
} finally { writeFileSync(file, original); }
