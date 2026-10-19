import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleManifest, withMatomo, withSboms } from '../release/fixtures/manifest.mjs';
import { journalBody, components } from '../release/core.mjs';
import { deploymentSelection } from './select-release.mjs';
test('addon deploys one reviewed release using only immutable image digests', () => {
  const manifest = exampleManifest();
  const release = { tag_name: 'v0.1.0', body: journalBody(manifest), draft: false, prerelease: true };
  assert.throws(() => deploymentSelection(release, manifest), /opt-in/);
  const selected = deploymentSelection(release, manifest, { allowPrerelease: true });
  for (const c of components) assert.equal(selected.images[c], `${manifest[c].image}@${manifest[c].digest}`);
  assert.throws(() => deploymentSelection({ ...release, draft: true }, manifest, { allowPrerelease: true }), /completed/);
  assert.throws(() => deploymentSelection(release, { ...manifest, sourceCommit: 'f'.repeat(40) }, { allowPrerelease: true }), /disagree/);
});
test('v1.7.3-like releases select only the app images', () => {
  const manifest = withSboms(exampleManifest());
  const release = { tag_name: 'v0.1.0', body: journalBody(manifest), draft: false, prerelease: false };
  assert.deepEqual(Object.keys(deploymentSelection(release, manifest).images), ['frontend', 'adminfrontend', 'backend']);
});
test('v1.8.0-like releases still select their recorded matomo image', () => {
  const manifest = withSboms(withMatomo(exampleManifest()));
  const release = { tag_name: 'v0.1.0', body: journalBody(manifest), draft: false, prerelease: false };
  const selected = deploymentSelection(release, manifest);
  assert.deepEqual(Object.keys(selected.images), ['frontend', 'adminfrontend', 'backend', 'matomo']);
  assert.equal(selected.images.matomo, `${manifest.matomo.image}@${manifest.matomo.digest}`);
  assert.deepEqual(selected.artifacts.matomo, manifest.matomo);
});
