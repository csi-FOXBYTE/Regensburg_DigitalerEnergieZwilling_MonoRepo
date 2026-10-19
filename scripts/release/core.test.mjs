import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { components, fingerprint, isBuildInput, journalBody, manifestComponents, nextVersion, readJournal, selectReleaseState, validateManifest } from './core.mjs';
import { loginOidc, matomoBom } from '../../images/matomo/sbom.mjs';
import { config } from './io.mjs';
import { sbomEvidence } from './evidence.mjs';
import { fixtureBom } from './fixtures/sbom.mjs';
import { selectArtifacts } from './selection.mjs';

import { exampleManifest } from './fixtures/manifest.mjs';

test('independent application version selection', () => {
  for (const bump of ['patch', 'minor', 'major']) assert.equal(nextVersion(null, bump, '0.1.0'), '0.1.0');
  for (const [bump, expected] of [['patch','2.3.5'],['minor','2.4.0'],['major','3.0.0']]) assert.equal(nextVersion('2.3.4', bump), expected);
  assert.throws(() => nextVersion('bad', 'patch'));
  assert.throws(() => nextVersion('1.2.3', 'other'));
});
test('the first release after v0.1.0 is v1.7.3, then normal bumps resume', () => {
  for (const bump of ['patch', 'minor', 'major']) {
    assert.equal(nextVersion('0.1.0', bump, config.initialVersion, config.versionTransition), '1.7.3');
  }
  assert.equal(nextVersion('1.7.3', 'patch', config.initialVersion, config.versionTransition), '1.7.4');
  assert.equal(nextVersion('1.7.3', 'minor', config.initialVersion, config.versionTransition), '1.8.0');
  assert.equal(nextVersion('1.7.3', 'major', config.initialVersion, config.versionTransition), '2.0.0');
  assert.throws(() => nextVersion('0.1.0', 'patch', config.initialVersion,
    { from: '0.1.0', to: '0.1.0' }), /must increase/);
});

const apps = components.filter(c => c !== 'matomo');
test('only the allowlisted, nonsecret build inputs enter contexts', () => {
  for (const c of components) {
    for (const file of ['.env', `apps/${c}/.env.production`, '.local/key', '.git/config',
      'release/manifest.json', 'docs/adoption.md', `apps/${c}/node_modules/a`, `apps/${c}/SBOM.cdx.json`,
      'scripts/deploy/select-release.mjs', 'scripts/release/publish.mjs', '.devcontainer/compose.yml']) assert(!isBuildInput(file, c), file);
  }
  for (const c of apps) {
    assert(isBuildInput(`apps/${c}/Dockerfile`, c));
    assert(isBuildInput('packages/energy-core/src/index.ts', c));
    assert(!isBuildInput('images/matomo/Dockerfile', c));
  }
});
test('the matomo image is built from its own directory only', () => {
  for (const file of ['images/matomo/Dockerfile', 'images/matomo/entrypoint.sh', 'images/matomo/sbom.mjs',
    'images/matomo/plugins/NoPasswordReset/NoPasswordReset.php']) assert(isBuildInput(file, 'matomo'), file);
  for (const file of ['images/matomo/README.md', 'images/matomo/sso-test/compose.yml', 'images/matomo/.env',
    'apps/frontend/package.json', 'packages/energy-core/src/index.ts', 'pnpm-lock.yaml', 'scripts/artifact-sbom.mjs',
    'LICENSE']) assert(!isBuildInput(file, 'matomo'), file);
});

const files = ['apps/frontend/src/a.ts', 'apps/adminfrontend/src/a.ts', 'apps/backend/src/a.ts',
  'packages/energy-core/src/index.ts', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'patches/fix.patch',
  'apps/backend/src/zenstack/schema.zmodel', 'apps/backend/Dockerfile', 'scripts/artifact-sbom.mjs',
  '.github/workflows/release.yml', 'scripts/release/config.json', 'apps/frontend/package.json',
  'images/matomo/entrypoint.sh', 'images/matomo/sso-test/compose.yml']
  .map(path => ({ path, oid: 'a', mode: '100644' }));
const services = { resolveDigest: () => `sha256:${'e'.repeat(64)}`, verifyImage() {} };
function baseline() {
  const images = selectArtifacts(files, config, null, services);
  return Object.fromEntries(components.map(c => [c, { ...exampleManifest()[c], fingerprint: images[c].fingerprint }]));
}
test('unchanged inputs reuse exact completed records', () => {
  const previous = baseline(); const seen = [];
  const selected = selectArtifacts(files.toReversed(), config, previous, { ...services, verifyImage: image => seen.push(image) });
  for (const c of components) { assert(!selected[c].changed); assert.equal(selected[c].selected, previous[c]); }
  assert.equal(seen.length, components.length);
});
test('a repository rename rebuilds images even when source fingerprints match', () => {
  const previous = baseline();
  for (const component of components) previous[component].image =
    `ghcr.io/csi-foxbyte/regensburg-web-prototype-${component}`;
  const selected = selectArtifacts(files, config, previous, services);
  for (const component of components) {
    assert(selected[component].changed);
    assert.equal(selected[component].image, config.images[component].repository);
  }
});
for (const file of files) {
  test(`content, removal and rename of ${file.path} invalidate affected images`, () => {
    const expected = components.filter(c => isBuildInput(file.path, c) || file.path.startsWith('scripts/release/') || file.path.startsWith('.github/'));
    for (const mutate of [entries => entries.map(e => e === file ? { ...e, oid: 'new' } : e),
      entries => entries.filter(e => e !== file), entries => entries.map(e => e === file ? { ...e, path: e.path + '.renamed' } : e),
      entries => entries.map(e => e === file ? { ...e, mode: '100755' } : e)]) {
      const selected = selectArtifacts(mutate(files), config, baseline(), services);
      assert.deepEqual(components.filter(c => selected[c].changed), expected);
    }
  });
}
for (const field of ['platform','refreshEpoch']) test(`${field} invalidates every image`, () => {
  const selected = selectArtifacts(files, { ...config, [field]: 'different' }, baseline(), services);
  assert(components.every(c => selected[c].changed));
});
test('either build or runtime base digest changes invalidate consumers', () => {
  // The matomo image writes its SBOM in a Node stage, so the Node base counts for it too.
  for (const [base, expected] of [['node:', components], ['nginxinc/', ['frontend', 'adminfrontend']], ['matomo:', ['matomo']]]) {
    const selected = selectArtifacts(files, config, baseline(), { ...services, resolveDigest: ref => `sha256:${(ref.startsWith(base) ? 'f' : 'e').repeat(64)}` });
    assert.deepEqual(components.filter(c => selected[c].changed), expected);
  }
});
test('missing reused image or SBOM fails planning', () => {
  assert.throws(() => selectArtifacts(files, config, baseline(), { ...services, verifyImage() { throw Error('Unavailable artifact'); } }), /Unavailable/);
});
test('journal serializes competing runs and preserves completed retries', () => {
  const manifest = exampleManifest();
  const release = { tag_name: 'v0.1.0', draft: true, body: journalBody(manifest) };
  assert.deepEqual(readJournal(release, config), manifest);
  assert.equal(selectReleaseState([release], '123', config).mode, 'resume');
  assert.throws(() => selectReleaseState([release], '456', config), /rerun workflow 123/);
  assert.throws(() => selectReleaseState([release, release], '123', config), /Multiple pending/);
  assert.equal(selectReleaseState([{ ...release, draft: false }], '123', config).mode, 'complete');
});
test('reused SBOMs retain their own build/source, independent of the new release version', () => {
  const manifest = exampleManifest(); manifest.appVersion = '0.2.0'; manifest.sourceCommit = 'f'.repeat(40);
  assert.equal(validateManifest(manifest, config), manifest);
  manifest.frontend.sbom.version = 'build-999-1';
  assert.throws(() => validateManifest(manifest, config), /SBOM\/build mismatch/);
});
test('the published first release remains readable with its original image repositories', () => {
  const manifest = JSON.parse(readFileSync(new URL('./fixtures/v0.1.0-manifest.json', import.meta.url)));
  assert.deepEqual(validateManifest(manifest, config), manifest);
  assert.deepEqual(readJournal({ tag_name: 'v0.1.0', body: journalBody(manifest) }, config), manifest);
  for (const [field, value] of [['appVersion', '0.1.1'], ['sourceCommit', 'a'.repeat(40)], ['runId', '123']]) {
    const changed = { ...manifest, [field]: value };
    assert.throws(() => validateManifest(changed, config));
  }
});
test('the latest published manifest on main remains valid', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../release/manifest.json', import.meta.url)));
  assert.deepEqual(validateManifest(manifest, config), manifest);
  assert.deepEqual(readJournal({ tag_name: `v${manifest.appVersion}`, body: journalBody(manifest) }, config), manifest);
});
test('manifests from before matomo stay valid without it; the original images stay required', () => {
  const manifest = exampleManifest(); delete manifest.matomo;
  assert.deepEqual(manifestComponents(manifest), ['frontend', 'adminfrontend', 'backend']);
  assert.equal(validateManifest(manifest, config), manifest);
  const withoutBackend = exampleManifest(); delete withoutBackend.backend;
  assert.throws(() => validateManifest(withoutBackend, config), /Missing image record/);
  assert.throws(() => validateManifest({ ...exampleManifest(), matomo: null }, config), /Missing image record/);
});
test('a new selection always contains matomo, rebuilt when the previous release has none', () => {
  const previous = baseline(); delete previous.matomo;
  const selected = selectArtifacts(files, config, previous, services);
  assert.deepEqual(components.filter(c => selected[c].changed), ['matomo']);
});
test('the matomo image SBOM is accepted as release evidence', () => {
  const image = exampleManifest().matomo;
  const bom = matomoBom({ build: image.build, source: image.sourceCommit,
    baseImage: `matomo:5.14.0-apache@sha256:${'d'.repeat(64)}`, noPasswordResetVersion: '1.0.0' });
  assert.deepEqual(sbomEvidence(Buffer.from(JSON.stringify(bom)), image).version, `build-${image.build}`);
  assert.throws(() => matomoBom({ build: 'x', source: 'local', baseImage: 'matomo:5.14.0-apache', noPasswordResetVersion: '1.0.0' }), /build ID/);
});
test('the LoginOIDC download in the Dockerfile matches the SBOM', () => {
  const dockerfile = readFileSync(new URL('../../images/matomo/Dockerfile', import.meta.url), 'utf8');
  assert(dockerfile.includes(`ADD --checksum=sha256:${loginOidc.sha256} \\\n  ${loginOidc.url} `), 'Dockerfile and sbom.mjs disagree');
  const config_ = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
  assert(dockerfile.includes(`ARG RUNTIME_BASE_IMAGE=${config_.images.matomo.runtimeBase}`));
  assert(dockerfile.includes(`ARG NODE_BASE_IMAGE=${config_.images.matomo.base}`));
});
