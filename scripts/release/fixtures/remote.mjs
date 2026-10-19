#!/usr/bin/env node
// Simulated GitHub, registry and Git remotes for publication failure tests.
// This executable never invokes Git/Docker or accesses the network.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fixtureBom } from './sbom.mjs';
const statePath = process.env.FAKE_RELEASE_STATE;
const state = JSON.parse(readFileSync(statePath));
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const manifest = state.manifest;
const tag = `v${manifest.appVersion}`;
const save = () => writeFileSync(statePath, JSON.stringify(state));
const result = (value = '') => { save(); process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value)); };
const fail = (message) => { save(); process.stderr.write(message); process.exit(1); };
state.calls.push([tool, ...args]);
if (tool === 'gh') {
  const endpoint = args[1];
  const method = args[args.indexOf('--method') + 1];
  if (args.includes('--paginate')) result([state.release ? [state.release] : []]);
  else if (method === 'POST') {
    const body = JSON.parse(readFileSync(0, 'utf8'));
    state.release = { ...body, id: 7 };
    result(state.release);
  } else if (method === 'PATCH' && endpoint.endsWith('/7')) {
    if (state.failAt === 'publish') fail('simulated GitHub outage after manifest commit');
    Object.assign(state.release, JSON.parse(readFileSync(0, 'utf8')));
    result(state.release);
  } else fail(`Unexpected gh command ${args}`);
} else if (tool === 'docker') {
  const reference = args.at(-1);
  const selected = Object.values(state.manifest).find(entry => entry?.image && reference?.startsWith(entry.image));
  if (args[0] === 'pull') result();
  else if (args[0] === 'image') result({
    'org.opencontainers.image.revision': selected.sourceCommit,
    'org.opencontainers.image.version': `build-${selected.build}`,
  });
  else if (args[0] === 'create') { state.copyImage = selected; result('mock-container'); }
  else if (args[0] === 'cp') {
    if (state.failAt === 'missing-sbom') fail('SBOM missing');
    const bom = fixtureBom(state.copyImage);
    if (state.failAt === 'wrong-sbom') bom.metadata.component.version = 'build-999-1';
    if (state.failAt === 'wrong-name') bom.metadata.component.name = 'wrong-component';
    if (state.failAt === 'wrong-source') bom.metadata.component.properties[0].value = '9'.repeat(40);
    writeFileSync(args[2], JSON.stringify(bom)); result();
  }
  else if (args[0] === 'rm') result();
  else if (args[2] === 'inspect') {
    if (state.failAt === 'missing-image') fail('manifest unknown');
    const image = ['frontend', 'adminfrontend', 'backend'].map((component) => manifest[component])
      .find((entry) => entry && reference.startsWith(entry.image));
    const digest = reference.includes('@') ? image.digest : state.tags[reference];
    if (!digest) fail('manifest unknown');
    result(`Digest: ${digest}\n`);
  } else if (args[2] === 'create') {
    if (state.failAt === 'adminfrontend-tag' && reference.startsWith(manifest.adminfrontend.image)) fail('simulated registry outage');
    state.tags[args[args.indexOf('--tag') + 1]] = reference.split('@')[1];
    result();
  } else fail(`Unexpected docker command ${args}`);
} else if (tool === 'git') {
  if (args[0] === 'ls-remote') {
    result(args.at(-1) === 'refs/heads/main' ? `${state.main}\trefs/heads/main`
      : state.tagged ? `${'f'.repeat(40)}\trefs/tags/${tag}` : '');
  } else if (args[0] === 'ls-tree') {
    result((args[1].startsWith('refs/tags/') ? state.tagged : state.current) ? 'manifest exists' : '');
  } else if (args[0] === 'show') {
    result(args[1].startsWith('refs/tags/') ? state.tagManifest : state.current);
  } else if (args[0] === 'push') {
    if (!args.includes('--atomic')) fail('push must be atomic');
    state.current = JSON.parse(readFileSync('release/manifest.json'));
    state.tagManifest = state.current;
    state.tagged = true;
    result();
  } else if (args[0] === 'rev-parse') result('f'.repeat(40));
  else if (['fetch', 'merge-base', 'checkout', 'add', '-c'].includes(args[0])) result();
  else fail(`Unexpected git command ${args}`);
} else fail(`Unexpected tool ${tool}`);
