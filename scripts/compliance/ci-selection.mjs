import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { run, save } from './common.mjs';
const [component, reference, file] = process.argv.slice(2);
assert(['frontend', 'adminfrontend', 'backend'].includes(component));
assert(/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA));
mkdirSync(path.dirname(file), { recursive: true });
save(file, { sourceCommit: process.env.GITHUB_SHA, [component]: {
  reference, digest: run('docker', ['image', 'inspect', '--format', '{{.Id}}', reference]),
  sourceCommit: process.env.GITHUB_SHA, build: `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`,
} });
