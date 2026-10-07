import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { run, save } from './common.mjs';
import { verifyReceipt } from './receipt.mjs';

const publishTest = process.argv[2] === '--prototype';
assert(process.argv.length === (publishTest ? 3 : 2), 'Only --prototype is supported');
const sourceCommit = run('git', ['rev-parse', 'HEAD']);
const root = path.resolve('.local', 'core-compliance');
assert(!existsSync(root), 'Use a fresh core-compliance directory');
mkdirSync(root, { recursive: true });
const pkgFile = 'packages/energy-core/package.json';
const original = readFileSync(pkgFile);
const pkg = JSON.parse(original);
const generated = ['SPDX_energy-core.spdx.json', 'THIRD_PARTY_NOTICES.txt'].map(name => path.join('packages/energy-core', name));
const previous = new Map(generated.filter(existsSync).map(file => [file, readFileSync(file)]));
if (publishTest) {
  assert(/^\d+$/.test(process.env.GITHUB_RUN_ID || '') && /^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT || ''));
  pkg.name = '@csi-foxbyte/regensburg-energy-core-monorepo-prototype';
  pkg.version += `-prototype.${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`;
  pkg.repository = { type: 'git', url: 'git+https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo.git', directory: 'packages/energy-core' };
}
try {
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  run('pnpm', ['--filter', './packages/energy-core', 'run', 'sbom'], { stdio: 'inherit' });
  run(process.execPath, ['scripts/compliance/build-evidence.mjs', 'energy-core'], {
    stdio: 'inherit', env: { ...process.env, SOURCE_COMMIT: sourceCommit },
  });
  const evidence = path.resolve('.local/compliance-build/energy-core/compliance-build.json');
  let selection;
  for (const pass of ['candidate', 'final']) {
    const destination = path.join(root, pass);
    mkdirSync(destination);
    run('pnpm', ['--filter', './packages/energy-core', 'pack', '--pack-destination', destination], { stdio: 'inherit' });
    const tarballs = readdirSync(destination).filter(f => f.endsWith('.tgz'));
    assert.equal(tarballs.length, 1);
    selection = { sourceCommit, evidence, tarball: path.join(destination, tarballs[0]), package: { name: pkg.name, version: pkg.version } };
    const input = path.join(destination, 'selection.json');
    save(input, selection);
    run(process.execPath, ['scripts/compliance/audit.mjs', 'package', path.join(destination, 'audit'), input], { stdio: 'inherit' });
    verifyReceipt(path.join(destination, 'audit'), selection, selection);
    if (pass === 'candidate') {
      for (const file of generated) copyFileSync(path.join(destination, 'audit', path.basename(file)), file);
    } else {
      assert(readFileSync(generated[0]).equals(readFileSync(path.join(destination, 'audit/SPDX_energy-core.spdx.json'))),
        'Packed SPDX differs from the final artifact audit');
    }
  }
  save(path.join(root, 'selection.json'), selection);
} finally {
  writeFileSync(pkgFile, original);
  for (const file of generated) {
    if (previous.has(file)) writeFileSync(file, previous.get(file));
    else rmSync(file, { force: true });
  }
}
