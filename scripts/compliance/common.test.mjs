import assert from 'node:assert/strict';
import { test } from 'node:test';
import { digest, evaluate, licenseIds, spdxDocument } from './common.mjs';

const policy = { automaticallyAcceptedLicenses: ['MIT', 'Apache-2.0'], reviewableLicenses: ['LGPL-3.0-or-later'] };
const component = () => ({ key: 'pkg:npm/example@1', name: 'example', version: '1', declaredLicense: 'MIT',
  files: [{ path: 'LICENSE', sha256: 'a'.repeat(64), license: 'MIT', copyrights: ['Copyright 2026 Example'], texts: ['Original MIT license text'], errors: [] }] });

test('missing scan evidence and unknown license declarations cannot pass', () => {
  for (const c of [ { ...component(), files: [] }, { ...component(), declaredLicense: 'NOASSERTION' },
    { ...component(), files: [{ ...component().files[0], license: null }] } ]) {
    assert(evaluate(c, policy, { components: [] }).findings.length > 0);
  }
});

test('embedded licenses and scanner errors prevent an automatic pass', () => {
  const c = component();
  c.files.push({ path: 'vendor.c', license: 'GPL-3.0-only', texts: ['GPL text'], copyrights: [], errors: ['scan timeout'] });
  const result = evaluate(c, policy, { components: [] });
  assert(result.findings.some(f => f.includes('GPL-3.0-only')));
  assert(result.findings.some(f => f.includes('scan timeout')));
});

test('compatible embedded permissive licenses are included automatically', () => {
  const c = component();
  c.files.push({ path: 'vendor.c', license: 'Apache-2.0', copyrights: [], texts: ['Original Apache license'], errors: [] });
  const r = evaluate(c, policy, { components: [] });
  assert.deepEqual(r.findings, []);
  assert.equal(r.licenseConcluded, '(MIT) AND Apache-2.0');
});

test('review decisions do not invalidate their own source rights subject', () => {
  const c = { ...component(), sourceRepository: true };
  const before = evaluate(c, policy, { components: [] });
  c.files.push({ path: 'scripts/compliance/reviews.json', sha256: 'b'.repeat(64), license: null, copyrights: [], texts: [], errors: [] });
  assert.equal(evaluate(c, policy, { components: [] }).evidenceHash, before.evidenceHash);
});

test('first party compatibility reviews survive a new build identity but not changed licensing evidence', () => {
  const c = { ...component(), firstParty: true };
  const before = evaluate(c, policy, { components: [] });
  c.version = '1-test.123.2';
  c.files[0].sha256 = 'b'.repeat(64);
  assert.equal(evaluate(c, policy, { components: [] }).evidenceHash, before.evidenceHash);
  c.files[0].copyrights.push('Copyright Another Owner');
  assert.notEqual(evaluate(c, policy, { components: [] }).evidenceHash, before.evidenceHash);
});

test('copyright absence does not invent a copyright or invalidate a completed license scan', () => {
  const c = component();
  c.files[0].copyrights = [];
  const result = evaluate(c, policy, { components: [] });
  assert.deepEqual(result.findings, []);
  assert.deepEqual(result.copyrights, []);
  const bom = spdxDocument('example', {}, [c], [result], '2026-01-01T00:00:00Z');
  assert.equal(bom.packages[0].copyrightText, 'NOASSERTION');
  assert.equal(bom.hasExtractedLicensingInfos[0].extractedText, 'Original MIT license text');
});

test('reviews must apply to the exact evidence and confirm source redistribution rights', () => {
  const c = { ...component(), declaredLicense: 'LGPL-3.0-or-later', sourceRepository: true };
  c.files[0].license = 'LGPL-3.0-or-later';
  const review = { key: c.key, evidenceHash: digest(JSON.stringify(c)), reviewer: 'Maintainer',
    rationale: 'Reviewed rights and distribution obligations', obligationsSatisfied: true,
    sourceRightsConfirmed: true, licenseConcluded: 'LGPL-3.0-or-later' };
  assert.deepEqual(evaluate(c, policy, { components: [review] }).findings, []);
  c.files[0].sha256 = 'b'.repeat(64);
  assert(evaluate(c, policy, { components: [review] }).findings.length > 0);
});

test('license expression parsing rejects malformed syntax and preserves alternative/exception identities', () => {
  assert.deepEqual(licenseIds('(MIT OR Apache-2.0) AND GPL-2.0-only WITH Classpath-exception-2.0'),
    ['Apache-2.0', 'GPL-2.0-only', 'GPL-2.0-only WITH Classpath-exception-2.0', 'MIT']);
  for (const invalid of ['MIT OR', 'AND MIT', '(MIT', 'MIT Apache-2.0', 'MIT;rm']) assert.throws(() => licenseIds(invalid));
});
