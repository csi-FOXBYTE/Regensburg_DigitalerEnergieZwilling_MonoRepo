import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { components } from './core.mjs';
import { registryDigest } from './io.mjs';
import { inspectEvidence } from './evidence.mjs';

const component = process.env.COMPONENT;
assert(components.includes(component));
const plan = JSON.parse(readFileSync(`${process.env.RELEASE_DIR}/plan.json`));
const selected = plan.images[component];
const digest = process.env.IMAGE_DIGEST;
assert(/^sha256:[a-f0-9]{64}$/.test(digest));
assert.equal(registryDigest(`${selected.image}:build-${process.env.BUILD_ID}`), digest);
const record = { image: selected.image, digest, sourceCommit: plan.sourceCommit, build: process.env.BUILD_ID, platform: selected.platform };
const sbom = inspectEvidence(record);
mkdirSync(`${process.env.RELEASE_DIR}/images`, { recursive: true });
writeFileSync(`${process.env.RELEASE_DIR}/images/${component}.json`, JSON.stringify({
  image: selected.image, fingerprint: selected.fingerprint, digest,
  sourceCommit: plan.sourceCommit, build: process.env.BUILD_ID,
  platform: selected.platform, baseImage: selected.baseImage, runtimeBaseImage: selected.runtimeBaseImage, sbom,
}, null, 2));
