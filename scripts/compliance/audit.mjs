import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, evaluate, fileEvidence, json, policyIdentity, run, save, scan, sorted, spdxDocument } from './common.mjs';
import { components as applications } from '../release/core.mjs';
import { verifyImage } from '../release/evidence.mjs';

const [mode, outputArg, inputArg] = process.argv.slice(2);
assert(['pr', 'release', 'opencode', 'package'].includes(mode), 'Usage: audit.mjs opencode|release|pr|package output-dir input.json');
const output = path.resolve(outputArg || '.local/compliance');
assert(!existsSync(output), 'Use a new audit directory; old outputs are never evidence');
mkdirSync(output, { recursive: true });
const work = path.join(output, 'work');
mkdirSync(work);
const { policy, reviews, policyHash } = policyIdentity();
assert.equal(policy.schema, 1);
assert.equal(reviews.schema, 1);
let selection;
if (mode === 'release') {
  const plan = json(inputArg);
  selection = plan.mode === 'resume' ? plan.manifest : { sourceCommit: plan.sourceCommit,
    ...Object.fromEntries(applications.map(c => [c, plan.images[c].changed
      ? json(path.join(path.dirname(inputArg), 'images', `${c}.json`)) : plan.images[c].selected])) };
} else selection = json(inputArg);
assert(/^[a-f0-9]{40}$/.test(selection.sourceCommit));
if (['release', 'opencode'].includes(mode)) assert(applications.every(c => selection[c]), 'Incomplete release image selection');
const timestamp = run('git', ['show', '-s', '--format=%cI', selection.sourceCommit]);
const created = new Date(timestamp).toISOString().replace('.000Z', 'Z');
const identity = { sourceCommit: selection.sourceCommit, policyHash,
  images: Object.fromEntries(applications.filter(c => selection[c]).map(c => [c, {
    digest: selection[c].digest, sourceCommit: selection[c].sourceCommit, build: selection[c].build,
  }])) };
if (mode === 'package') identity.package = { ...selection.package, sha256: digest(readFileSync(selection.tarball)) };
const failures = [];
const evidence = {};
const resultsByArtifact = {};
const sboms = {};
function document(name, components, scanErrors = []) {
  components.sort((a, b) => a.key.localeCompare(b.key, 'en'));
  assert.equal(new Set(components.map(c => c.key)).size, components.length, 'Duplicate component identity');
  const results = components.map(c => evaluate(c, policy, reviews));
  evidence[name] = components;
  resultsByArtifact[name] = results;
  for (const r of results) for (const reason of r.findings) failures.push({ artifact: name, component: r.key, reason, evidenceHash: r.evidenceHash });
  for (const reason of scanErrors) failures.push({ artifact: name, component: 'scanner', reason });
  const file = `SPDX_${name}.spdx.json`;
  const docIdentity = { ...identity, ...(identity.package ? { package: selection.package } : {}), inventoryHash: digest(JSON.stringify(components)) };
  save(path.join(output, file), spdxDocument(name, docIdentity, components, results, created));
  try {
    run(process.env.SPDX_PYTHON || 'python', ['scripts/compliance/normalize-spdx.py', path.join(output, file)]);
    run(process.env.SPDX_PYTHON || 'python', ['scripts/compliance/validate-spdx.py', path.join(output, file)]);
  }
  catch (error) { failures.push({ artifact: name, component: 'SPDX validation', reason: error.message }); }
  sboms[file] = digest(readFileSync(path.join(output, file)));
}

// Audit the exact source tree, including docs and media. Generated release
// metadata is excluded so the preceding release's SBOM cannot pass this check.
function extractSource(commit, destination) {
  mkdirSync(destination, { recursive: true });
  const files = run('git', ['ls-tree', '-rz', '--name-only', commit]).split('\0').filter(Boolean)
    .filter(f => !f.startsWith('release/') && !/(^|\/)(SBOM\.(cdx\.json|csv)|SPDX_[^/]+\.spdx\.json)$/.test(f));
  assert(files.length);
  const archive = run('git', ['archive', '--format=tar', commit, '--', ...files], { encoding: null });
  run('tar', ['-xf', '-', '-C', destination], { input: archive });
}
const source = path.join(work, 'source');
extractSource(selection.sourceCommit, source);
const sourceScan = scan(source, path.join(work, 'source-scan.json'));
const rootPackage = json(path.join(source, 'package.json'));
document('source', [{ key: 'regensburg-source', name: rootPackage.name, version: rootPackage.version,
  declaredLicense: rootPackage.license, sourceRepository: true, scope: 'published source, documentation and media',
  files: fileEvidence(sourceScan.report, source) }], sourceScan.errors);

if (mode === 'package') {
  const built = json(selection.evidence);
  assert.equal(built.sourceCommit, selection.sourceCommit);
  assert.equal(built.component, 'energy-core');
  const unpacked = path.join(work, 'package');
  mkdirSync(unpacked);
  run('tar', ['-xzf', selection.tarball, '-C', unpacked]);
  const manifest = json(path.join(unpacked, 'package/package.json'));
  assert.equal(manifest.name, selection.package.name);
  assert.equal(manifest.version, selection.package.version);
  const packedScan = scan(unpacked, path.join(work, 'package-scan.json'), ['*SPDX_*.spdx.json', '*SBOM.cdx.json', '*SBOM.csv', '*THIRD_PARTY_NOTICES.txt']);
  const own = built.components.find(c => c.name === manifest.name && c.version === manifest.version);
  assert(own, 'Packed component not found in build inventory');
  own.files = fileEvidence(packedScan.report, unpacked);
  document('energy-core', built.components, [...built.errors, ...packedScan.errors]);
} else for (const component of applications) {
  const image = selection[component];
  if (!image) continue;
  if (['release', 'opencode'].includes(mode)) verifyImage(image);
  const reference = mode === 'pr' ? image.reference : `${image.image}@${image.digest}`;
  if (mode === 'pr') assert.equal(run('docker', ['image', 'inspect', '--format', '{{.Id}}', reference]),
    image.digest, 'Candidate image changed after selection');
  const location = path.join(work, component);
  const rootfs = path.join(location, 'rootfs');
  mkdirSync(rootfs, { recursive: true });
  const id = run('docker', ['create', '--entrypoint', '/regensburg-no-execution', reference]);
  try {
    const fsArchive = path.join(location, 'rootfs.tar');
    run('docker', ['export', '--output', fsArchive, id]);
    run('tar', ['-xf', fsArchive, '-C', rootfs]);
  } finally { run('docker', ['rm', id]); }
  // Normal GitHub images contain an inventory, not expensive scan evidence.
  // Reconstruct the exact dependency sources only for this explicit audit.
  const builder = path.join(work, 'builders', component);
  extractSource(image.sourceCommit, builder);
  run('pnpm', ['install', '--frozen-lockfile', '--store-dir', path.join(work, 'pnpm-store')],
    { cwd: builder, stdio: 'inherit' });
  const buildOutput = path.join(location, 'build-evidence');
  run(process.execPath, [fileURLToPath(new URL('./build-evidence.mjs', import.meta.url)), component,
    path.join(rootfs, 'usr/share/regensburg/SBOM.cdx.json'), buildOutput], {
    cwd: builder, stdio: 'inherit', env: { ...process.env, SOURCE_COMMIT: image.sourceCommit, BUILD_ID: image.build },
  });
  const build = json(path.join(buildOutput, 'compliance-build.json'));
  assert.equal(build.schema, 1);
  assert.equal(build.component, component);
  assert.equal(build.sourceCommit, image.sourceCommit, 'Build evidence/source mismatch');
  assert.equal(build.build, image.build, 'Build evidence/build mismatch');
  assert.equal(build.inventoryHash, digest(readFileSync(path.join(rootfs, 'usr/share/regensburg/SBOM.cdx.json'))), 'Build inventory/evidence mismatch');
  if (['release', 'opencode'].includes(mode)) assert.equal(build.inventoryHash, image.sbom.sha256);
  const catalogFile = path.join(location, 'syft.json');
  run('syft', ['scan', `docker:${reference}`, '-o', `syft-json=${catalogFile}`], { stdio: ['ignore', 'inherit', 'inherit'] });
  const catalog = json(catalogFile);
  assert.equal(catalog.descriptor?.version, '1.54.1', 'Unexpected Syft version');
  assert(catalog.artifacts?.length, 'Empty runtime inventory');
  const runtimeScan = scan(rootfs, path.join(location, 'scan.json'), [
    '*compliance-build.json', '*SBOM.cdx.json', '*SPDX_*.spdx.json',
  ]);
  const files = fileEvidence(runtimeScan.report, rootfs);
  const owned = new Set();
  const runtime = catalog.artifacts.map(a => {
    const packageFiles = new Set((a.metadata?.files ?? []).map(f => String(f.path ?? f).replace(/^\//, '')));
    const locations = (a.locations ?? []).map(l => l.path.replace(/^\//, ''));
    const packageRoots = a.type === 'npm' ? locations.filter(l => l.endsWith('/package.json')).map(l => l.slice(0, -'package.json'.length)) : [];
    const docs = [`usr/share/doc/${a.name}/`, `usr/share/licenses/${a.name}/`];
    const selectedFiles = files.filter(f => packageFiles.has(f.path) || packageRoots.some(p => f.path.startsWith(p))
      || docs.some(p => f.path.startsWith(p)) || locations.includes(f.path));
    selectedFiles.forEach(f => owned.add(f.path));
    const expressions = sorted((a.licenses ?? []).map(l => l.spdxExpression || l.value));
    return { key: `runtime:${a.purl || a.id}`, name: a.name, version: a.version, purl: a.purl,
      scope: 'shipped runtime, including OS and transitives', declaredLicense: expressions.join(' AND ') || 'NOASSERTION',
      trustedDistribution: ['deb', 'apk', 'rpm'].includes(a.type), files: selectedFiles };
  });
  const unowned = files.filter(f => !owned.has(f.path) && (f.license || f.copyrights.length));
  if (unowned.length) runtime.push({ key: `runtime-unassigned:${component}`, name: `${component} additional runtime files`,
    declaredLicense: 'NOASSERTION', scope: 'license/copyright findings not assigned by the runtime cataloger', files: unowned });
  const builtComponents = build.components.filter(c => {
    if (!c.runtimeReference) return true;
    assert(runtime.some(r => r.name === c.runtimeReference.name &&
      (!c.runtimeReference.version || r.version === c.runtimeReference.version || r.version.startsWith(`${c.runtimeReference.version}-`))),
    `Referenced runtime missing from final image: ${c.runtimeReference.name} ${c.runtimeReference.version}`);
    return false;
  });
  document(component, [...builtComponents, ...runtime], [...build.errors, ...runtimeScan.errors]);
}

save(path.join(output, 'compliance-evidence.json'), { schema: 1, ...identity, artifacts: evidence });
const report = { schema: 1, ...identity, compliant: failures.length === 0, failures, artifacts: resultsByArtifact };
save(path.join(output, 'compliance-report.json'), report);
const notices = Object.entries(evidence).flatMap(([artifact, entries]) => entries.map(c =>
  `${artifact}: ${c.name} ${c.version || ''}\n${sorted(c.files.flatMap(f => f.copyrights)).join('\n')}\n\n` +
    sorted(c.files.flatMap(f => f.texts)).join('\n\n'))).join('\n\n========================================\n\n');
writeFileSync(path.join(output, 'THIRD_PARTY_NOTICES.txt'), `${notices}\n`);
const files = { ...sboms, ...Object.fromEntries(['compliance-evidence.json', 'compliance-report.json', 'THIRD_PARTY_NOTICES.txt']
  .map(f => [f, digest(readFileSync(path.join(output, f)))])) };
save(path.join(output, 'receipt.json'), { schema: 1, ...identity, compliant: report.compliant, files });
const summary = `Local compliance audit: ${report.compliant ? 'PASS' : 'FAIL'}\n\n` +
  `Fresh ScanCode and Syft evidence; ${failures.length} unresolved findings. See the generated SPDX documents, report and evidence.\n\n` +
  failures.slice(0, 80).map(f => `- ${f.artifact}: ${f.component}: ${f.reason}`).join('\n') + '\n';
writeFileSync(path.join(output, 'summary.md'), summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
if (!report.compliant) process.exitCode = 1;
