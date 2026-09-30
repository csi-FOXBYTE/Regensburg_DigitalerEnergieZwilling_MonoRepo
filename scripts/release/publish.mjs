import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assertTagDigest, components, journalBody, manifestPath, readJournal,
  selectReleaseState, validateManifest } from './core.mjs';
import { api, command, config, git, readManifest, registryDigest, releases, summary } from './io.mjs';
import { verifyImage } from './evidence.mjs';

assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
const repository = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;
const plan = JSON.parse(readFileSync(`${process.env.RELEASE_DIR}/plan.json`));
assert(['build', 'resume'].includes(plan.mode));
const allReleases = releases();
const state = selectReleaseState(allReleases, runId, config);
let manifest;
let release;
if (state.mode === 'complete') {
  summary(`v${state.manifest.appVersion} is already complete.`);
  process.exit(0);
} else if (state.mode === 'resume') {
  manifest = state.manifest;
  release = state.release;
  if (plan.mode === 'resume') assert.deepEqual(plan.manifest, manifest);
} else {
  assert.equal(plan.mode, 'build', 'Publication journal disappeared; investigate before retrying');
  assert.equal(plan.runId, runId);
  assert.equal(plan.sourceCommit, process.env.GITHUB_SHA);
  assert.equal(git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], plan.sourceCommit,
    'main advanced during the build. No release publication started; dispatch a new run.');
  manifest = {
    schema: 2, appVersion: plan.appVersion, previousVersion: plan.previousVersion,
    sourceCommit: plan.sourceCommit, runId,
  };
  for (const component of components) {
    const choice = plan.images[component];
    const selected = choice.changed
      ? JSON.parse(readFileSync(`${process.env.RELEASE_DIR}/images/${component}.json`)) : choice.selected;
    assert.equal(selected.image, choice.image);
    assert.equal(selected.fingerprint, choice.fingerprint);
    assert.equal(selected.baseImage, choice.baseImage);
    assert.equal(selected.runtimeBaseImage, choice.runtimeBaseImage);
    if (choice.changed) assert.equal(selected.sourceCommit, plan.sourceCommit);
    manifest[component] = selected;
  }
  validateManifest(manifest, config);
  if (plan.previous && components.every((component) =>
    manifest[component].digest === plan.previous[component].digest)) {
    summary('All resulting image digests match the last release; no version bump.');
    process.exit(0);
  }
  const tag = `v${manifest.appVersion}`;
  assert(!allReleases.some((entry) => entry.tag_name === tag), 'Release version already exists');
  assert.equal(git('ls-remote', 'origin', `refs/tags/${tag}`), '', 'Git tag already exists');
  for (const component of components) {
    const image = manifest[component];
    verifyImage(image);
    assert.equal(registryDigest(`${image.image}@${image.digest}`), image.digest);
    assertTagDigest(registryDigest(`${image.image}:${manifest.appVersion}`, { allowMissing: true }),
      image.digest, `${image.image}:${manifest.appVersion}`);
  }
  // Persist the exact selection before the first version tag is written. Drafts
  // block other runs and survive Actions artifact/cache expiration.
  release = api(`repos/${repository}/releases`, { method: 'POST', body: {
    tag_name: tag, target_commitish: manifest.sourceCommit,
    name: `Regensburg web prototype ${manifest.appVersion}`, body: journalBody(manifest), draft: true, prerelease: config.prerelease,
  } });
}

validateManifest(manifest, config);
assert.equal(manifest.runId, runId);
assert.deepEqual(readJournal(release, config), manifest);
for (const component of components) {
  const image = manifest[component];
  verifyImage(image);
  const tag = `${image.image}:${manifest.appVersion}`;
  assert.equal(registryDigest(`${image.image}@${image.digest}`), image.digest);
  const actual = registryDigest(tag, { allowMissing: true });
  assertTagDigest(actual, image.digest, tag);
  if (actual === null) {
    command('docker', ['buildx', 'imagetools', 'create', '--prefer-index=false',
      '--tag', tag, `${image.image}@${image.digest}`]);
  }
  assert.equal(registryDigest(tag), image.digest, 'Retagging must preserve the registry digest');
}

const tag = `v${manifest.appVersion}`;
const json = `${JSON.stringify(manifest, null, 2)}\n`;
let committed = false;
for (let attempt = 0; attempt < 3; attempt++) {
  git('fetch', 'origin', 'main', '--tags');
  const existingTag = git('ls-remote', 'origin', `refs/tags/${tag}`);
  if (existingTag) {
    assert.deepEqual(readManifest(`refs/tags/${tag}`), manifest,
      'Existing Git tag points to a different manifest');
    git('merge-base', '--is-ancestor', `refs/tags/${tag}`, 'origin/main');
    committed = true;
    break;
  }
  const current = readManifest('origin/main');
  assert.equal(current?.appVersion ?? null, manifest.previousVersion,
    'Another release changed main; publication requires investigation');
  git('merge-base', '--is-ancestor', manifest.sourceCommit, 'origin/main');
  // A developer may push after publication starts. Append metadata to the new
  // main tip, retaining the original image/source SHAs in the manifest.
  git('checkout', '--detach', 'origin/main');
  mkdirSync('release', { recursive: true });
  writeFileSync(manifestPath, json);
  git('add', '--', manifestPath);
  command('git', ['-c', 'user.name=github-actions[bot]', '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    '-c', 'core.hooksPath=/dev/null', 'commit', '-m', `chore(release): ${tag}`]);
  try {
    // Both Git refs move together. No force push, and no tag on the source
    // commit before the metadata commit exists.
    git('push', '--atomic', 'origin', 'HEAD:refs/heads/main', `HEAD:refs/tags/${tag}`);
    committed = true;
    break;
  } catch (error) {
    if (attempt === 2) throw error;
  }
}
assert(committed, 'Manifest commit was not published');
git('fetch', 'origin', 'main', '--tags');
assert.deepEqual(readManifest(`refs/tags/${tag}`), manifest);
const releaseCommit = git('rev-parse', `refs/tags/${tag}^{commit}`);
api(`repos/${repository}/releases/${release.id}`, { method: 'PATCH', body: {
  draft: false, target_commitish: releaseCommit, prerelease: config.prerelease, make_latest: config.prerelease ? 'false' : 'true',
} });
summary(`Published ${tag}. Source: ${manifest.sourceCommit}. Manifest commit: ${releaseCommit}.`);
