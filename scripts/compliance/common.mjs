import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const digest = value => `sha256:${createHash('sha256').update(value).digest('hex')}`;
export const json = file => JSON.parse(readFileSync(file, 'utf8'));
export const save = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
export const sorted = values => [...new Set(values.filter(Boolean))].sort();
export const npmName = c => c.group ? `${c.group}/${c.name}` : c.name;
export const declaredLicense = c => (c.licenses ?? []).map(x => x.expression ?? x.license?.id ?? x.license?.name).filter(Boolean).join(' AND ') || 'NOASSERTION';
export function policyIdentity() {
  const policy = json(new URL('./policy.json', import.meta.url));
  const reviews = json(new URL('./reviews.json', import.meta.url));
  const requirementsHash = digest(readFileSync(new URL('./requirements.txt', import.meta.url)));
  return { policy, reviews, policyHash: digest(JSON.stringify({ policy, reviews, requirementsHash, scanner: '32.5.0', syft: '1.54.1' })) };
}
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.error?.message ?? result.stderr ?? ''}`);
  return Buffer.isBuffer(result.stdout) ? result.stdout : result.stdout?.trim();
}

// A scan is fresh only when the scanner actually executes. Existing output is
// never a fallback for a failed scanner invocation.
export function scan(input, output, ignores = []) {
  const result = spawnSync(process.env.SCANCODE ?? 'scancode', [
    '--license', '--copyright', '--info', '--license-text',
    '--strip-root', '--processes', process.env.COMPLIANCE_PROCESSES ?? '1', '--max-in-memory', '1000',
    '--timeout', '120', '--json-pp', output, input,
    ...ignores.flatMap(pattern => ['--ignore', pattern]),
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  assert(existsSync(output), 'ScanCode did not produce output');
  const report = json(output);
  assert(report.headers?.some(h => h.tool_name === 'scancode-toolkit'), 'Missing ScanCode identity');
  assert(report.headers.some(h => h.tool_name === 'scancode-toolkit' && h.tool_version === '32.5.0'), 'Unexpected ScanCode version');
  const errors = [
    ...report.headers.flatMap(h => h.errors ?? []),
    ...(report.files ?? []).flatMap(f => (f.scan_errors ?? []).map(e => `${f.path}: ${e}`)),
  ];
  if (result.status !== 0 && errors.length === 0) errors.push(`ScanCode exited ${result.status}`);
  return { report, errors };
}

// Retain original texts, complete copyright statements and file checksums.
// Scanner timing and host paths are excluded from reproducible evidence.
export function fileEvidence(report, root) {
  return (report.files ?? []).filter(f => f.type === 'file').map(f => {
    const detections = f.license_detections ?? [];
    const matches = detections.flatMap(d => d.matches ?? []);
    const license = f.detected_license_expression_spdx || null;
    const filename = path.basename(f.path);
    let sha1 = f.sha1;
    let sha256 = f.sha256;
    // ScanCode omits hashes for empty files. SPDX still requires a checksum.
    if ((!sha1 || !sha256) && f.size === 0) {
      const location = path.resolve(root, f.path);
      assert(location.startsWith(`${path.resolve(root)}/`) && lstatSync(location).isFile());
      const contents = readFileSync(location);
      assert.equal(contents.length, 0, 'Scanned empty file changed');
      sha1 = createHash('sha1').update(contents).digest('hex');
      sha256 = createHash('sha256').update(contents).digest('hex');
    }
    let originalText;
    if (license && (/license|copying|copyright|notice/i.test(filename) || f.percentage_of_license_text >= 70)) {
      const location = path.resolve(root, f.path);
      assert(location.startsWith(`${path.resolve(root)}/`), 'Scanner path escaped input');
      originalText = readFileSync(location, 'utf8');
    }
    return {
      path: f.path, sha1, sha256, license,
      copyrights: sorted((f.copyrights ?? []).map(c => c.copyright)),
      texts: sorted([originalText, ...matches.map(m => m.matched_text)]),
      errors: f.scan_errors ?? [],
    };
  }).sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

// Parse the SPDX expression grammar before considering policy eligibility.
// OR choices are deliberately conservative: an explicit review can select a
// supported branch, but unreviewed alternatives must all pass.
export function licenseIds(expression) {
  assert(typeof expression === 'string' && expression.trim(), 'Missing license expression');
  const tokens = expression.match(/[A-Za-z0-9.+:-]+|[()]/g) ?? [];
  assert.equal(tokens.join(''), expression.replace(/\s/g, ''), 'Invalid SPDX expression');
  let cursor = 0;
  const ids = [];
  const primary = () => {
    if (tokens[cursor] === '(') { cursor++; compound(); assert.equal(tokens[cursor++], ')'); }
    else {
      const id = tokens[cursor++];
      assert(id && !['AND', 'OR', 'WITH', ')'].includes(id), 'Invalid SPDX license identifier');
      ids.push(id);
      if (tokens[cursor] === 'WITH') {
        cursor++;
        const exception = tokens[cursor++];
        assert(exception && !['AND', 'OR', 'WITH', '(', ')'].includes(exception), 'Invalid SPDX exception');
        ids.push(`${id} WITH ${exception}`);
      }
    }
  };
  const compound = () => {
    primary();
    while (['AND', 'OR'].includes(tokens[cursor])) { cursor++; primary(); }
  };
  compound();
  assert.equal(cursor, tokens.length, 'Invalid SPDX expression tail');
  return sorted(ids);
}

export function evaluate(component, policy, reviews) {
  const findings = [];
  // Source approval records must not invalidate their own reviewed subject.
  // Build/run identities are bound separately by the artifact receipt.
  const subject = component.sourceRepository ? { ...component,
    files: component.files.filter(f => f.path !== 'scripts/compliance/reviews.json') }
    : component.firstParty ? { key: component.key, declaredLicense: component.declaredLicense, scope: component.scope,
      files: component.files.map(f => ({ path: f.path, license: f.license, copyrights: f.copyrights, texts: f.texts, errors: f.errors })) }
    : component;
  const evidenceHash = digest(JSON.stringify(subject));
  const review = reviews.components.find(r => r.key === component.key && r.evidenceHash === evidenceHash);
  let conclusion = component.declaredLicense ?? 'NOASSERTION';
  if (review) {
    assert(review.reviewer && review.rationale && review.obligationsSatisfied === true, `Incomplete review: ${component.key}`);
    conclusion = review.licenseConcluded;
  }
  let ids = [];
  try { ids = licenseIds(conclusion); } catch { findings.push('missing or invalid license expression'); }
  const accepted = new Set(policy.automaticallyAcceptedLicenses);
  const reviewable = new Set(policy.reviewableLicenses);
  for (const id of ids) {
    if (!accepted.has(id) && !(review && reviewable.has(id))) findings.push(`license requires eligibility/compatibility review: ${id}`);
  }
  const detected = sorted(component.files.flatMap(f => {
    try { return f.license ? licenseIds(f.license) : []; } catch { return ['INVALID']; }
  }));
  for (const id of detected) {
    const explanation = review?.falsePositives?.[id];
    if (!accepted.has(id) && !reviewable.has(id) && !(typeof explanation === 'string' && explanation.trim())) {
      findings.push(`detected license not eligible under policy: ${id}`);
    }
  }
  if (!review) {
    const additional = detected.filter(id => !ids.includes(id));
    for (const id of additional) if (!accepted.has(id)) findings.push(`undeclared embedded license: ${id}`);
    if (additional.length && additional.every(id => accepted.has(id))) conclusion = `(${conclusion}) AND ${additional.join(' AND ')}`;
    if (!component.trustedDistribution && !detected.length) findings.push('license declaration has no scan evidence');
  }
  if (!component.files.some(f => f.texts?.length)) findings.push('original license/notice text not found');
  if (component.sourceRepository && !(review?.sourceRightsConfirmed === true)) findings.push('source redistribution rights require maintainer confirmation');
  const errors = component.files.flatMap(f => f.errors ?? []);
  if (errors.length) findings.push(...errors.map(e => `scanner error: ${e}`));
  return {
    key: component.key, evidenceHash, licenseConcluded: findings.length ? 'NOASSERTION' : conclusion,
    copyrights: sorted(component.files.flatMap(f => f.copyrights)),
    detectedLicenses: detected, findings: sorted(findings), reviewedBy: review?.reviewer ?? null,
  };
}

export function spdxDocument(name, identity, components, results, timestamp) {
  const id = c => `SPDXRef-${digest(c.key).slice(7, 31)}`;
  const texts = new Map();
  const files = [];
  const contains = [];
  const packages = components.map((c, i) => {
    const licenseRefs = [];
    for (const text of sorted(c.files.flatMap(f => f.texts ?? []))) {
      const ref = `LicenseRef-original-${digest(text).slice(7, 31)}`;
      texts.set(ref, { licenseId: ref, extractedText: text, name: `Original license/notice text for ${c.name}` });
      licenseRefs.push(ref);
    }
    for (const f of c.files) {
      let ids;
      try { ids = f.license ? licenseIds(f.license) : []; } catch { ids = []; }
      for (const licenseId of ids.filter(x => x.startsWith('LicenseRef-'))) {
        if (!texts.has(licenseId)) texts.set(licenseId, { licenseId,
          extractedText: (f.texts ?? []).join('\n\n') || 'NOASSERTION', name: licenseId });
      }
    }
    const fileLicenses = sorted(c.files.map(f => f.license));
    for (const f of c.files) {
      const fileId = `SPDXRef-file-${digest(`${c.key}:${f.path}`).slice(7, 31)}`;
      let detected;
      try { if (f.license) licenseIds(f.license); detected = f.license ? [f.license] : []; } catch { detected = []; }
      const refs = (f.texts ?? []).map(t => `LicenseRef-original-${digest(t).slice(7, 31)}`);
      files.push({ SPDXID: fileId, fileName: `./${id(c)}/${f.path}`,
        checksums: [...(f.sha1 ? [{ algorithm: 'SHA1', checksumValue: f.sha1 }] : []),
          ...(f.sha256 ? [{ algorithm: 'SHA256', checksumValue: f.sha256 }] : [])],
        licenseConcluded: 'NOASSERTION', licenseInfoInFiles: sorted([...detected, ...refs]).length ? sorted([...detected, ...refs]) : ['NOASSERTION'],
        copyrightText: f.copyrights.join('\n') || 'NOASSERTION',
        comment: JSON.stringify({ originalDetectedLicenseExpression: f.license }) });
      contains.push({ spdxElementId: id(c), relationshipType: 'CONTAINS', relatedSpdxElement: fileId });
    }
    let licenseDeclared = c.declaredLicense || 'NOASSERTION';
    try { licenseIds(licenseDeclared); } catch { licenseDeclared = 'NOASSERTION'; }
    return {
      SPDXID: id(c), name: c.name, ...(c.version ? { versionInfo: c.version } : {}),
      downloadLocation: c.downloadLocation || 'NOASSERTION', filesAnalyzed: c.files.length > 0,
      ...(c.files.length ? { packageVerificationCode: { packageVerificationCodeValue: createHash('sha1').update(c.files.map(f => f.sha1 || '').sort().join('')).digest('hex') },
        licenseInfoFromFiles: sorted([...fileLicenses, ...licenseRefs]).length ? sorted([...fileLicenses, ...licenseRefs]) : ['NOASSERTION'] } : {}),
      licenseDeclared, licenseConcluded: results[i].licenseConcluded,
      copyrightText: results[i].copyrights.join('\n') || 'NOASSERTION',
      comment: JSON.stringify({ key: c.key, evidenceHash: results[i].evidenceHash, scope: c.scope,
        copyrights: results[i].copyrights.length ? 'detected by ScanCode' : 'no copyright detected in scanned inputs',
        originalDeclaration: c.declaredLicense }),
      ...(c.purl ? { externalRefs: [{ referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: c.purl }] } : {}),
    };
  });
  return {
    spdxVersion: 'SPDX-2.3', dataLicense: 'CC0-1.0', SPDXID: 'SPDXRef-DOCUMENT', name,
    documentNamespace: `https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo/spdx/${name}/${digest(JSON.stringify(identity)).slice(7)}`,
    creationInfo: { created: timestamp, creators: ['Tool: regensburg-compliance-1', 'Tool: ScanCode-32.5.0', 'Tool: Syft-1.54.1'] },
    documentComment: JSON.stringify(identity), packages, files,
    relationships: [...packages.map(p => ({ spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: p.SPDXID })), ...contains],
    hasExtractedLicensingInfos: [...texts.values()].sort((a, b) => a.licenseId.localeCompare(b.licenseId, 'en')),
  };
}
