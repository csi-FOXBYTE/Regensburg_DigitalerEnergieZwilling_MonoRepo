import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { digest, json, policyIdentity } from './common.mjs';

export function verifyReceipt(directory, manifest, packageSelection) {
  assert(directory, 'A successful fresh compliance audit is required for publication');
  const receipt = json(path.join(directory, 'receipt.json'));
  assert.equal(receipt.schema, 1);
  assert.equal(receipt.compliant, true, 'Compliance findings prevent publication');
  assert.equal(receipt.sourceCommit, manifest.sourceCommit, 'Compliance/source mismatch');
  assert(/^sha256:[a-f0-9]{64}$/.test(receipt.policyHash));
  assert.equal(receipt.policyHash, policyIdentity().policyHash, 'Compliance policy changed; run a fresh audit');
  for (const [filename, hash] of Object.entries(receipt.files)) {
    assert(/^(SPDX_[a-z-]+\.spdx\.json|compliance-(report|evidence)\.json|THIRD_PARTY_NOTICES\.txt)$/.test(filename), 'Unsafe compliance artifact filename');
    assert.equal(digest(readFileSync(path.join(directory, filename))), hash, `Compliance artifact changed: ${filename}`);
  }
  const required = packageSelection ? ['source', 'energy-core'] : ['source', 'frontend', 'adminfrontend', 'backend'];
  for (const name of required) {
    assert(receipt.files[`SPDX_${name}.spdx.json`], `Missing ${name} SPDX document`);
    const bom = json(path.join(directory, `SPDX_${name}.spdx.json`));
    assert.equal(bom.spdxVersion, 'SPDX-2.3');
    assert.equal(bom.dataLicense, 'CC0-1.0');
    assert.equal(bom.name, name);
    assert(bom.packages?.length, 'An empty inventory cannot establish compliance');
    const identity = JSON.parse(bom.documentComment);
    assert.equal(identity.sourceCommit, receipt.sourceCommit);
    assert.equal(identity.policyHash, receipt.policyHash);
    assert.deepEqual(identity.images, receipt.images, 'SPDX/image selection mismatch');
    if (packageSelection) assert.deepEqual(identity.package, packageSelection.package, 'SPDX/package selection mismatch');
    if (name !== 'source' && !packageSelection) assert.deepEqual(receipt.images[name], {
      digest: manifest[name].digest, sourceCommit: manifest[name].sourceCommit, build: manifest[name].build,
    }, 'Compliance/image selection mismatch');
  }
  if (packageSelection) assert.deepEqual(receipt.package, {
    ...packageSelection.package, sha256: digest(readFileSync(packageSelection.tarball)),
  }, 'Compliance/package mismatch');
  assert(receipt.files['compliance-report.json'] && receipt.files['compliance-evidence.json'] && receipt.files['THIRD_PARTY_NOTICES.txt']);
  assert.equal(json(path.join(directory, 'compliance-report.json')).compliant, true);
  const report = json(path.join(directory, 'compliance-report.json'));
  assert.deepEqual(report.failures, [], 'Unresolved compliance findings');
  assert.equal(report.sourceCommit, receipt.sourceCommit);
  assert.equal(report.policyHash, receipt.policyHash);
  return receipt;
}
