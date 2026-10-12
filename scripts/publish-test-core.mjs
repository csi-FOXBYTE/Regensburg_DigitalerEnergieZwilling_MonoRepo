import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { digest, json } from './compliance/common.mjs';
const selection = json('.local/core-package/selection.json');
assert(/^\d+$/.test(process.env.GITHUB_RUN_ID || '') && /^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT || ''));
assert.equal(selection.package.name, '@csi-foxbyte/regensburg-web-energy-core-test');
assert(selection.package.version.endsWith(`-test.${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT}`));
assert.equal(digest(readFileSync(selection.tarball)), selection.sha256, 'Prepared package changed');
// Publish the exact prepared bytes, including the fresh SBOM.
const configFile = path.resolve('.local/core-package/publish.npmrc');
writeFileSync(configFile, '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n', { mode: 0o600 });
execFileSync('pnpm', ['publish', selection.tarball, '--no-git-checks', '--tag', 'test', '--registry', 'https://npm.pkg.github.com'],
  { stdio: 'inherit', env: { ...process.env, NPM_CONFIG_USERCONFIG: configFile } });
