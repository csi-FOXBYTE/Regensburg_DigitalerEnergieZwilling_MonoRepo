import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { digest, json } from '../compliance/common.mjs';
import { components } from './core.mjs';

export function sbomSelection(manifest) {
  return { sourceCommit: manifest.sourceCommit, images: Object.fromEntries(components.map(c => [c, {
    digest: manifest[c].digest, sourceCommit: manifest[c].sourceCommit, build: manifest[c].build,
  }])) };
}

// This checks inventory provenance and file integrity, never license eligibility.
export function verifySboms(directory, manifest) {
  assert(directory, 'Fresh release SBOM output is required');
  const receipt = json(path.join(directory, 'receipt.json'));
  assert.equal(receipt.schema, 1);
  const identity = sbomSelection(manifest);
  assert.equal(receipt.sourceCommit, identity.sourceCommit, 'SBOM/source mismatch');
  assert.deepEqual(receipt.images, identity.images, 'SBOM/image selection mismatch');
  const required = ['source.cdx.json', ...components.flatMap(c => [`${c}.cdx.json`, `${c}-runtime.cdx.json`])];
  assert.deepEqual(Object.keys(receipt.files).sort(), required.sort(), 'Incomplete release SBOM output');
  for (const name of required) {
    const bytes = readFileSync(path.join(directory, name));
    assert.equal(digest(bytes), receipt.files[name], `SBOM artifact changed: ${name}`);
    const bom = JSON.parse(bytes);
    assert.equal(bom.bomFormat, 'CycloneDX');
    assert(bom.metadata?.component?.name, 'Missing inventory subject');
    const properties = Object.fromEntries((bom.metadata.properties ?? []).map(p => [p.name, p.value]));
    assert.equal(properties['regensburg:release-source'], manifest.sourceCommit);
    const component = components.find(c => name === `${c}.cdx.json` || name === `${c}-runtime.cdx.json`);
    if (component) assert.equal(properties['regensburg:image-digest'], manifest[component].digest);
  }
  return receipt;
}
