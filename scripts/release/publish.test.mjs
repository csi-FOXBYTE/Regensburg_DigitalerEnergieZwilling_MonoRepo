import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { config } from './io.mjs';
import { sbomEvidence } from './evidence.mjs';
import { fixtureBom } from './fixtures/sbom.mjs';

function fixture(t, failAt) {
  const dir = mkdtempSync(path.join(tmpdir(), 'regensburg-release-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin');
  mkdirSync(bin);
  for (const name of ['gh', 'git', 'docker']) {
    copyFileSync(new URL('./fixtures/remote.mjs', import.meta.url), path.join(bin, name));
    chmodSync(path.join(bin, name), 0o755);
  }
  copyFileSync(new URL('./fixtures/sbom.mjs', import.meta.url), path.join(bin, 'sbom.mjs'));
  const manifest = { schema: 2, appVersion: '0.1.0', previousVersion: null,
    sourceCommit: 'a'.repeat(40), runId: '123' };
  const images = {};
  mkdirSync(path.join(dir, 'images'));
  for (const component of ['frontend', 'adminfrontend', 'backend']) {
    const selected = {
      image: config.images[component].repository,
      digest: `sha256:${(component === 'frontend' ? 'b' : 'c').repeat(64)}`,
      fingerprint: `sha256:${'d'.repeat(64)}`, sourceCommit: manifest.sourceCommit,
      build: '123-1', platform: config.platform,
      baseImage: `${config.images[component].base}@sha256:${'e'.repeat(64)}`,
    };
    selected.runtimeBaseImage = `${config.images[component].runtimeBase}@sha256:${'e'.repeat(64)}`;
    selected.sbom = sbomEvidence(Buffer.from(JSON.stringify(fixtureBom(selected))), selected);
    manifest[component] = selected;
    images[component] = { ...selected, changed: true };
    writeFileSync(path.join(dir, 'images', `${component}.json`), JSON.stringify(selected));
  }
  writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({ ...manifest, mode: 'build', images }));
  const statePath = path.join(dir, 'state.json');
  writeFileSync(statePath, JSON.stringify({ manifest, main: manifest.sourceCommit,
    failAt, tags: {}, release: null, current: null, tagged: false, calls: [] }));
  return {
    dir, manifest,
    state: () => JSON.parse(readFileSync(statePath)),
    update: (changes) => writeFileSync(statePath, JSON.stringify({ ...JSON.parse(readFileSync(statePath)), ...changes })),
    run: () => spawnSync(process.execPath, [fileURLToPath(new URL('./publish.mjs', import.meta.url))], {
      cwd: dir, encoding: 'utf8', env: { ...process.env,
        PATH: `${bin}:${process.env.PATH}`, FAKE_RELEASE_STATE: statePath,
        RELEASE_DIR: dir, GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ID: '123',
        GITHUB_REPOSITORY: 'example/repository', GITHUB_SHA: manifest.sourceCommit,
        GITHUB_STEP_SUMMARY: '',
      },
    }),
  };
}

test('publication recovers after only the frontend image was tagged', (t) => {
  const f = fixture(t, 'adminfrontend-tag');
  assert.notEqual(f.run().status, 0);
  const pending = f.state();
  assert.equal(pending.release.draft, true);
  assert.equal(Object.keys(pending.tags).length, 1);
  assert.equal(pending.tagged, false);
  f.update({ failAt: null });
  const retry = f.run();
  assert.equal(retry.status, 0, retry.stderr);
  const completed = f.state();
  assert.equal(completed.release.draft, false);
  assert.deepEqual(completed.current, f.manifest);
  assert.equal(Object.keys(completed.tags).length, 3);
  assert.equal(completed.calls.filter(([tool, ...args]) => tool === 'gh' && args.includes('POST')).length, 1);
  const again = f.run();
  assert.equal(again.status, 0, again.stderr);
  assert.equal(f.state().calls.filter(([tool, action]) => tool === 'git' && action === 'push').length, 1);
});

test('publication recovers after Git refs were pushed but GitHub release failed', (t) => {
  const f = fixture(t, 'publish');
  assert.notEqual(f.run().status, 0);
  assert.equal(f.state().tagged, true);
  assert.equal(f.state().release.draft, true);
  f.update({ failAt: null });
  const retry = f.run();
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(f.state().release.draft, false);
  assert.equal(f.state().calls.filter(([tool, action]) => tool === 'git' && action === 'push').length, 1);
});

test('a main advance before publication creates no draft or version tags', (t) => {
  const f = fixture(t);
  f.update({ main: 'f'.repeat(40) });
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /main advanced/);
  assert.equal(f.state().release, null);
  assert.deepEqual(f.state().tags, {});
});

test('publication refuses a version tag belonging to different content', (t) => {
  const f = fixture(t);
  const tags = { [`${f.manifest.frontend.image}:0.1.0`]: `sha256:${'f'.repeat(64)}` };
  f.update({ tags });
  assert.notEqual(f.run().status, 0);
  assert.equal(f.state().release, null);
  assert.deepEqual(f.state().tags, tags);
});

test('identical resulting image digests do not publish another app version', (t) => {
  const f = fixture(t);
  const planPath = path.join(f.dir, 'plan.json');
  const plan = JSON.parse(readFileSync(planPath));
  plan.previous = f.manifest;
  writeFileSync(planPath, JSON.stringify(plan));
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no version bump/);
  assert.equal(f.state().release, null);
  assert.deepEqual(f.state().tags, {});
});

test('reused images retain their original source commit and build identity', (t) => {
  const f = fixture(t);
  const planPath = path.join(f.dir, 'plan.json');
  const plan = JSON.parse(readFileSync(planPath));
  const original = { ...f.manifest.frontend, sourceCommit: '9'.repeat(40), build: '99-1' };
  original.sbom = sbomEvidence(Buffer.from(JSON.stringify(fixtureBom(original))), original);
  f.update({ manifest: { ...f.manifest, frontend: original } });
  plan.images.frontend = { ...plan.images.frontend, changed: false, selected: original };
  writeFileSync(planPath, JSON.stringify(plan));
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.state().current.frontend, original);
  assert.equal(f.state().current.sourceCommit, f.manifest.sourceCommit);
});

test('a later main commit during recovery does not change the recorded build source', (t) => {
  const f = fixture(t, 'adminfrontend-tag');
  assert.notEqual(f.run().status, 0);
  f.update({ failAt: null, main: '8'.repeat(40) });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.state().current, f.manifest);
});

for (const failAt of ['missing-image', 'missing-sbom', 'wrong-sbom', 'wrong-source']) {
  test(`publication fails closed for ${failAt}`, t => {
    const f = fixture(t, failAt);
    assert.notEqual(f.run().status, 0);
    assert.equal(f.state().release, null);
    assert.deepEqual(f.state().tags, {});
  });
}
test('recovery verifies the journal SBOM hash before finishing', t => {
  const f = fixture(t, 'publish');
  assert.notEqual(f.run().status, 0);
  f.update({ failAt: 'wrong-sbom' });
  assert.notEqual(f.run().status, 0);
  assert.equal(f.state().release.draft, true);
});
