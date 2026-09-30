import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { components, readJournal, validateManifest } from '../release/core.mjs';
import { config } from '../release/io.mjs';

// The addon supplies the completed GitHub release and manifest from its exact
// tag. Review the resulting file, then deploy these digests without re-resolving tags.
export function deploymentSelection(release, taggedManifest, { allowPrototype = false } = {}) {
  assert(release && !release.draft, 'A completed release is required');
  assert(allowPrototype || !release.prerelease, 'Prototype prereleases require explicit opt-in');
  const manifest = validateManifest(taggedManifest, config);
  assert.deepEqual(readJournal(release, config), manifest, 'Release journal and tagged manifest disagree');
  return { appVersion: manifest.appVersion, sourceCommit: manifest.sourceCommit,
    images: Object.fromEntries(components.map(c => [c, `${manifest[c].image}@${manifest[c].digest}`])),
    artifacts: Object.fromEntries(components.map(c => [c, manifest[c]])),
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [releaseFile, manifestFile, option] = process.argv.slice(2);
  assert(releaseFile && manifestFile && (!option || option === '--allow-prototype'),
    'Usage: node scripts/deploy/select-release.mjs release.json tagged-manifest.json [--allow-prototype]');
  console.log(JSON.stringify(deploymentSelection(JSON.parse(readFileSync(releaseFile)), JSON.parse(readFileSync(manifestFile)),
    { allowPrototype: option === '--allow-prototype' }), null, 2));
}
