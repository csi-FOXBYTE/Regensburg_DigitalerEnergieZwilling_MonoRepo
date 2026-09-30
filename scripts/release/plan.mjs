import { selectArtifacts } from './selection.mjs';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { components, fingerprint, isBuildInput, nextVersion, readJournal,
  selectReleaseState, validateManifest } from './core.mjs';
import { config, git, outputs, readManifest, registryDigest, releases, summary, tree } from './io.mjs';
import { verifyImage } from './evidence.mjs';

assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Releases must run from main');
const runId = process.env.GITHUB_RUN_ID;
assert(/^\d+$/.test(runId), 'Missing run ID');
const sourceCommit = git('rev-parse', 'HEAD');
assert.equal(sourceCommit, process.env.GITHUB_SHA, 'Checkout must match the dispatch commit');
const allReleases = releases();
const state = selectReleaseState(allReleases, runId, config);
let plan;
if (state.mode === 'resume') {
  plan = { mode: 'resume', manifest: state.manifest };
  summary(`Resuming publication of v${state.manifest.appVersion} from workflow ${runId}.`);
} else if (state.mode === 'complete') {
  plan = { mode: 'noop' };
  summary(`Workflow ${runId} already published v${state.manifest.appVersion}; nothing to do.`);
} else {
  assert.equal(git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], sourceCommit,
    'main has advanced. Start a new release workflow.');
  const previous = readManifest(sourceCommit);
  if (previous) {
    validateManifest(previous, config);
    const release = allReleases.find((entry) => entry.tag_name === `v${previous.appVersion}`);
    assert(release && !release.draft, 'The previous manifest must have a completed GitHub release');
    assert.deepEqual(readJournal(release, config), previous, 'Published manifest differs from main');
    assert.deepEqual(readManifest(`refs/tags/v${previous.appVersion}`), previous,
      'Published tag manifest differs from main');
  } else {
    assert(!allReleases.some((entry) => readJournal(entry, config)),
      'Regensburg web prototype releases exist but main has no release manifest');
  }
  const images = selectArtifacts(tree(sourceCommit), config, previous, { resolveDigest: registryDigest, verifyImage });
  for (const [component, image] of Object.entries(images)) {
    summary(`${component}: ${image.changed ? 'build (inputs or base image changed)' : `reuse ${image.selected.digest}`}`);
  }
  const changed = components.some((component) => images[component].changed);
  plan = {
    mode: changed ? 'build' : 'noop', sourceCommit, runId,
    previousVersion: previous?.appVersion ?? null, previous,
    appVersion: nextVersion(previous?.appVersion, process.env.RELEASE_BUMP, config.initialVersion), images,
  };
  summary(changed ? `Selected application version: ${plan.appVersion}` : 'No changed image inputs; no version bump.');
}
mkdirSync(process.env.RELEASE_DIR, { recursive: true });
writeFileSync(`${process.env.RELEASE_DIR}/plan.json`, `${JSON.stringify(plan, null, 2)}\n`);
outputs({
  mode: plan.mode,
  matrix: JSON.stringify({ include: components.filter((component) => plan.images?.[component].changed)
    .map((component) => ({ component, ...plan.images[component] })) }),
});
