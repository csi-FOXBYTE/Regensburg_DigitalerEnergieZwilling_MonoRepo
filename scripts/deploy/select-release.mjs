import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { manifestComponents, readJournal, validateManifest } from '../release/core.mjs';
import { config } from '../release/io.mjs';

// The addon supplies the completed GitHub release and manifest from its exact
// tag. Review the resulting file, then deploy these digests without re-resolving tags.
export function deploymentSelection(release, taggedManifest, { allowPrerelease = false } = {}) {
  assert(release && !release.draft, 'A completed release is required');
  assert(allowPrerelease || !release.prerelease, 'Prereleases require explicit opt-in');
  const manifest = validateManifest(taggedManifest, config);
  assert.deepEqual(readJournal(release, config), manifest, 'Release journal and tagged manifest disagree');
  // Releases from before Matomo was added have no matomo image.
  const components = manifestComponents(manifest);
  return { appVersion: manifest.appVersion, sourceCommit: manifest.sourceCommit,
    images: Object.fromEntries(components.map(c => [c, `${manifest[c].image}@${manifest[c].digest}`])),
    artifacts: Object.fromEntries(components.map(c => [c, manifest[c]])),
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [releaseFile, manifestFile, option] = process.argv.slice(2);
  assert(releaseFile && manifestFile && (!option || option === '--allow-prerelease'),
    'Usage: node scripts/deploy/select-release.mjs release.json tagged-manifest.json [--allow-prerelease]');
  console.log(JSON.stringify(deploymentSelection(JSON.parse(readFileSync(releaseFile)), JSON.parse(readFileSync(manifestFile)),
    { allowPrerelease: option === '--allow-prerelease' }), null, 2));
}
