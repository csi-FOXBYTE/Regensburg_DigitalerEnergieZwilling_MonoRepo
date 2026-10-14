import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { digest, json, run, save } from '../compliance/common.mjs';
import { components, manifestComponents } from './core.mjs';
import { sbomEvidence, sbomPath, verifyImage } from './evidence.mjs';
import { sbomSelection, verifySboms } from './sboms.mjs';

const [outputArg, planFile] = process.argv.slice(2);
assert(outputArg && planFile, 'Usage: generate-sboms.mjs new-output-dir plan.json');
const output = path.resolve(outputArg);
assert(!existsSync(output), 'Use a fresh SBOM output directory');
mkdirSync(path.join(output, 'work'), { recursive: true });
const plan = json(planFile);
const selection = plan.mode === 'resume' ? plan.manifest : { sourceCommit: plan.sourceCommit,
  ...Object.fromEntries(components.map(c => [c, plan.images[c].changed
    ? json(path.join(path.dirname(planFile), 'images', `${c}.json`)) : plan.images[c].selected])) };
const identity = sbomSelection(selection);
const timestamp = new Date(run('git', ['show', '-s', '--format=%cI', selection.sourceCommit])).toISOString();
const files = {};
function document(filename, bom, image) {
  // Stable UUIDv5 makes recovery reproducible for an identical selection.
  const namespace = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');
  const bytes = createHash('sha1').update(namespace).update(JSON.stringify({ filename, ...identity })).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  bom.serialNumber = `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  bom.metadata.timestamp = timestamp;
  bom.metadata.properties = [...(bom.metadata.properties ?? []).filter(p => !p.name.startsWith('regensburg:release-') && p.name !== 'regensburg:image-digest'),
    { name: 'regensburg:release-source', value: identity.sourceCommit },
    { name: 'regensburg:release-inventory', value: 'Fresh inventory snapshot; licenses and copyrights have not been audited' },
    ...(image ? [{ name: 'regensburg:image-digest', value: image.digest }] : [])];
  save(path.join(output, filename), bom);
  files[filename] = digest(readFileSync(path.join(output, filename)));
}
const sourcePackage = JSON.parse(run('git', ['show', `${selection.sourceCommit}:package.json`]));
document('source.cdx.json', { bomFormat: 'CycloneDX', specVersion: '1.6', version: 1,
  metadata: { component: { type: 'application', name: sourcePackage.name, version: sourcePackage.version,
    'bom-ref': `regensburg:source:${selection.sourceCommit}`,
    licenses: [{ expression: sourcePackage.license || 'NOASSERTION' }] } }, components: [] });
for (const component of manifestComponents(selection)) {
  const image = selection[component];
  verifyImage(image);
  const reference = `${image.image}@${image.digest}`;
  const id = run('docker', ['create', '--platform', image.platform, reference]);
  const embedded = path.join(output, 'work', `${component}.cdx.json`);
  try { run('docker', ['cp', `${id}:${sbomPath}`, embedded]); }
  finally { run('docker', ['rm', id]); }
  assert.deepEqual(sbomEvidence(readFileSync(embedded), image), image.sbom);
  document(`${component}.cdx.json`, json(embedded), image);
  const runtime = path.join(output, 'work', `${component}-runtime.cdx.json`);
  const catalog = path.join(output, 'work', `${component}.syft.json`);
  run('syft', ['scan', `docker:${reference}`, '-o', `cyclonedx-json=${runtime}`, '-o', `syft-json=${catalog}`],
    { stdio: ['ignore', 'inherit', 'inherit'] });
  const inventory = json(catalog);
  assert.equal(inventory.descriptor?.version, '1.54.1', 'Unexpected Syft version');
  assert(inventory.artifacts?.length, 'Empty runtime inventory');
  document(`${component}-runtime.cdx.json`, json(runtime), image);
}
save(path.join(output, 'receipt.json'), { schema: 1, ...identity, files });
verifySboms(output, selection);
console.log('Generated fresh application, source and runtime inventories. No compliance scan was performed.');
