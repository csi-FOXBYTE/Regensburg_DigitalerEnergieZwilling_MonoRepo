import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const components = ['frontend', 'adminfrontend', 'backend'];
export const manifestPath = 'release/manifest.json';
export const journalMarker = '<!-- regensburg-release-v1 -->';
const sha = /^[a-f0-9]{40}$/;
const digest = /^sha256:[a-f0-9]{64}$/;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function nextVersion(previous, bump, initial = '0.1.0') {
  assert(['patch', 'minor', 'major'].includes(bump), 'Invalid version bump');
  assert(semver.test(previous ?? initial), 'Invalid application version');
  if (!previous) return initial;
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

export function validateManifest(value, config) {
  assert.equal(value.schema, 2, 'Unknown manifest schema');
  assert(semver.test(value.appVersion), 'Invalid app version');
  assert(sha.test(value.sourceCommit), 'Invalid release source commit');
  assert(/^\d+$/.test(value.runId), 'Invalid release run ID');
  assert(value.previousVersion === null || semver.test(value.previousVersion));
  for (const component of components) {
    const image = value[component];
    assert.equal(image.image, config.images[component].repository, 'Unexpected image repository');
    assert(image && typeof image === 'object', 'Missing image record');
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
  return value;
}

export function journalBody(manifest) {
  return `${journalMarker}\n\nRegensburg web prototype ${manifest.appVersion}\n\n` +
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
  assert(pending.length <= 1, 'Multiple pending Regensburg web prototype releases require manual investigation');
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
