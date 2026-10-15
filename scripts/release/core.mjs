import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const components = ['frontend', 'adminfrontend', 'backend', 'matomo'];
// Images added after the first releases. Manifests published before them stay
// valid without them; every new release selects all components.
const laterComponents = ['matomo'];
export const manifestPath = 'release/manifest.json';
export const journalMarker = '<!-- regensburg-release-v2 -->';
const sha = /^[a-f0-9]{40}$/;
const digest = /^sha256:[a-f0-9]{64}$/;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// v0.1.0 is an immutable published selection. Its original registry names must
// remain valid for release recovery and deployment after new image names are used.
const firstRelease = {
  appVersion: '0.1.0',
  sourceCommit: 'd41794746bf2a6a1054f97e8a4c6988252250764',
  runId: '37619743033',
  images: {
    frontend: 'ghcr.io/csi-foxbyte/regensburg-web-prototype-frontend',
    adminfrontend: 'ghcr.io/csi-foxbyte/regensburg-web-prototype-adminfrontend',
    backend: 'ghcr.io/csi-foxbyte/regensburg-web-prototype-backend',
  },
};

export function nextVersion(previous, bump, initial = '0.1.0', transition = null) {
  assert(['patch', 'minor', 'major'].includes(bump), 'Invalid version bump');
  assert(semver.test(previous ?? initial), 'Invalid application version');
  if (!previous) return initial;
  if (transition) {
    assert(semver.test(transition.from) && semver.test(transition.to), 'Invalid version transition');
    const from = transition.from.split('.').map(Number);
    const to = transition.to.split('.').map(Number);
    const firstDifference = to.findIndex((part, index) => part !== from[index]);
    assert(firstDifference !== -1 && to[firstDifference] > from[firstDifference],
      'Version transition must increase the application version');
    if (previous === transition.from) return transition.to;
  }
  const parts = previous.split('.').map(Number);
  const index = { major: 0, minor: 1, patch: 2 }[bump];
  parts[index]++;
  for (let i = index + 1; i < 3; i++) parts[i] = 0;
  assert(parts.every(Number.isSafeInteger), 'Version overflow');
  return parts.join('.');
}

// This is also the Docker context allowlist. Adding a build input means adding
// it here, so fingerprinting and the files available to COPY cannot diverge.
export function isBuildInput(file, component) {
  assert(components.includes(component));
  if (file.split('/').some(part => ['node_modules', '.git', '.local', '.devcontainer',
    '.pnpm-store', '.tanstack', 'dist', '.build', '.dev', '.astro', 'coverage', '.cache'].includes(part)
    || part.startsWith('.env'))) return false;
  // Matomo is no pnpm app: only its own image directory, without the local
  // login test and the documentation.
  if (component === 'matomo') {
    return file.startsWith('images/matomo/') && !file.startsWith('images/matomo/sso-test/')
      && !file.endsWith('.md');
  }
  if (/(^|\/)SBOM\.(cdx\.json|csv)$/.test(file) || file.endsWith('.tsbuildinfo')) return false;
  if (file.startsWith('apps/frontend/public/cesium/')) return false;
  if (file.startsWith(`apps/${component}/`) || file.startsWith('packages/energy-core/')) return true;
  if (/^apps\/[^/]+\/package\.json$/.test(file)) return true;
  if (file.startsWith('patches/')) return true;
  if (file.startsWith('scripts/') && !['release', 'deploy'].some(name => file.startsWith(`scripts/${name}/`))) return true;
  return ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', '.node-version',
    '.nvmrc', '.dockerignore', 'LICENSE', 'COPYING', 'COPYING.LESSER', 'NOTICE'].includes(file);
}

export function fingerprint(entries, inputs) {
  return `sha256:${createHash('sha256').update(JSON.stringify({
    schema: 1, ...inputs,
    files: [...entries].sort((a, b) => a.path.localeCompare(b.path, 'en')),
  })).digest('hex')}`;
}

// The components a manifest records: all current ones, except images added
// after that manifest was published.
export function manifestComponents(manifest) {
  return components.filter((component) => !laterComponents.includes(component) || manifest[component] !== undefined);
}

export function validateManifest(value, config) {
  assert.equal(value.schema, 2, 'Unknown manifest schema');
  assert(semver.test(value.appVersion), 'Invalid app version');
  assert(sha.test(value.sourceCommit), 'Invalid release source commit');
  assert(/^\d+$/.test(value.runId), 'Invalid release run ID');
  assert(value.previousVersion === null || semver.test(value.previousVersion));
  for (const component of manifestComponents(value)) {
    const image = value[component];
    assert(image && typeof image === 'object', 'Missing image record');
    const isFirstRelease = value.appVersion === firstRelease.appVersion
      && value.sourceCommit === firstRelease.sourceCommit
      && value.runId === firstRelease.runId;
    assert(image.image === config.images[component].repository
      || (isFirstRelease && image.image === firstRelease.images[component]),
    'Unexpected image repository');
    assert(digest.test(image.digest), 'Invalid registry digest');
    assert(digest.test(image.fingerprint), 'Invalid fingerprint');
    assert(sha.test(image.sourceCommit), 'Invalid image source commit');
    assert(/^\d+-\d+$/.test(image.build), 'Invalid build ID');
    assert.equal(image.platform, config.platform);
    // Historical releases may have used a different Node base tag.
    for (const base of [image.baseImage, image.runtimeBaseImage]) {
      assert(/^[a-zA-Z0-9._/:-]+@sha256:[a-f0-9]{64}$/.test(base), 'Invalid pinned base image');
    }
    assert.equal(image.sbom?.path, '/usr/share/regensburg/SBOM.cdx.json', 'Missing SBOM evidence');
    assert(digest.test(image.sbom.sha256), 'Invalid SBOM hash');
    assert.equal(image.sbom.version, `build-${image.build}`, 'SBOM/build mismatch');
    assert.equal(image.sbom.sourceCommit, image.sourceCommit, 'SBOM/source mismatch');
  }
  if (value.sboms) {
    assert.equal(value.sboms.schema, 1, 'Unknown SBOM receipt schema');
    assert.equal(value.sboms.sourceCommit, value.sourceCommit, 'SBOM/source mismatch');
    assert.deepEqual(Object.keys(value.sboms.images).sort(), manifestComponents(value).sort(),
      'SBOM/image selection mismatch');
    for (const component of manifestComponents(value)) {
      assert.deepEqual(value.sboms.images[component], {
        digest: value[component].digest, sourceCommit: value[component].sourceCommit, build: value[component].build,
      }, 'SBOM/image selection mismatch');
    }
  }
  return value;
}

export function journalBody(manifest) {
  return `${journalMarker}\n\nRegensburg web ${manifest.appVersion}\n\n` +
    `Source: \`${manifest.sourceCommit}\`\n\n` +
    'The JSON below is the publication journal and release manifest. Preserve it for retries.\n\n' +
    '```json\n' + JSON.stringify(manifest, null, 2) + '\n```\n';
}

export function readJournal(release, config) {
  if (!release.body?.startsWith(journalMarker)) return null;
  const match = release.body.match(/```json\n([\s\S]*?)\n```/);
  assert(match, 'Missing publication journal');
  const manifest = validateManifest(JSON.parse(match[1]), config);
  assert.equal(release.tag_name, `v${manifest.appVersion}`, 'Journal/tag mismatch');
  return manifest;
}

export function selectReleaseState(releases, runId, config) {
  const managed = releases.map((release) => ({ release, manifest: readJournal(release, config) }))
    .filter((entry) => entry.manifest);
  const pending = managed.filter(({ release }) => release.draft);
  assert(pending.length <= 1, 'Multiple pending Regensburg web releases require manual investigation');
  if (pending.length) {
    assert.equal(pending[0].manifest.runId, runId,
      `Publication is pending: rerun workflow ${pending[0].manifest.runId} before starting another release`);
    return { mode: 'resume', ...pending[0] };
  }
  const completed = managed.find(({ manifest }) => manifest.runId === runId);
  return completed ? { mode: 'complete', ...completed } : { mode: 'new' };
}

export function assertTagDigest(actual, expected, tag) {
  assert(actual === null || actual === expected, `Refusing to overwrite ${tag}: digest differs`);
}
