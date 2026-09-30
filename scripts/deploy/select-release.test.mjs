import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleManifest } from '../release/fixtures/manifest.mjs';
import { journalBody, components } from '../release/core.mjs';
import { deploymentSelection } from './select-release.mjs';
test('addon deploys one reviewed release using only immutable image digests', () => {
  const manifest = exampleManifest();
  const release = { tag_name: 'v0.1.0', body: journalBody(manifest), draft: false, prerelease: true };
  assert.throws(() => deploymentSelection(release, manifest), /opt-in/);
  const selected = deploymentSelection(release, manifest, { allowPrototype: true });
  for (const c of components) assert.equal(selected.images[c], `${manifest[c].image}@${manifest[c].digest}`);
  assert.throws(() => deploymentSelection({ ...release, draft: true }, manifest, { allowPrototype: true }), /completed/);
  assert.throws(() => deploymentSelection(release, { ...manifest, sourceCommit: 'f'.repeat(40) }, { allowPrototype: true }), /disagree/);
});
