import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const path = 'packages/energy-core/package.json';
const original = readFileSync(path, 'utf8');
const pkg = JSON.parse(original);
if (!/^\d+$/.test(process.env.GITHUB_RUN_ID ?? '')) throw Error('Expected CI run ID');
pkg.name = '@csi-foxbyte/regensburg-energy-core-monorepo-prototype';
pkg.version += `-prototype.${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`;
pkg.repository = { type: 'git', url: 'git+https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo.git', directory: 'packages/energy-core' };
writeFileSync('/tmp/regensburg-publish.npmrc', '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n');
try {
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  execFileSync('pnpm', ['--filter', './packages/energy-core', 'publish', '--no-git-checks', '--tag', 'prototype', '--registry', 'https://npm.pkg.github.com'],
    { stdio: 'inherit', env: { ...process.env, NPM_CONFIG_USERCONFIG: '/tmp/regensburg-publish.npmrc' } });
} finally { writeFileSync(path, original); }
