import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { command, config, registryDigest } from './io.mjs';

export const sbomPath = '/usr/share/regensburg/SBOM.cdx.json';
export function sbomEvidence(bytes, image) {
  const bom = JSON.parse(bytes);
  assert.equal(bom.bomFormat, 'CycloneDX', 'Expected CycloneDX SBOM');
  const root = bom.metadata?.component;
  const settings = Object.values(config.images).find(settings => settings.repository === image.image);
  assert(settings, 'Unexpected image repository');
  assert.equal(root?.name, settings.packageName, 'SBOM/package mismatch');
  assert.equal(root?.version, `build-${image.build}`, 'SBOM/build mismatch');
  const properties = Object.fromEntries((root.properties ?? []).map(p => [p.name, p.value]));
  assert.equal(properties['vcs:commit'], image.sourceCommit, 'SBOM/source mismatch');
  assert.equal(properties['regensburg:build'], image.build, 'Missing SBOM build identity');
  return { path: sbomPath, sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
    version: root.version, sourceCommit: image.sourceCommit };
}

// Read the SBOM from the selected immutable image, without executing its code.
// This evidence survives expired CI artifacts and is verified again on recovery.
export function inspectEvidence(image) {
  const reference = `${image.image}@${image.digest}`;
  assert.equal(registryDigest(reference), image.digest, 'Selected image is unavailable');
  command('docker', ['pull', '--platform', image.platform, reference]);
  const labels = JSON.parse(command('docker', ['image', 'inspect', '--format', '{{json .Config.Labels}}', reference]));
  assert.equal(labels['org.opencontainers.image.revision'], image.sourceCommit, 'Image/source mismatch');
  assert.equal(labels['org.opencontainers.image.version'], `build-${image.build}`, 'Image/build mismatch');
  const temp = mkdtempSync(join(tmpdir(), 'regensburg-evidence-'));
  let id;
  try {
    id = command('docker', ['create', '--platform', image.platform, reference]);
    const target = join(temp, 'SBOM.cdx.json');
    command('docker', ['cp', `${id}:${sbomPath}`, target]);
    return sbomEvidence(readFileSync(target), image);
  } finally {
    if (id) command('docker', ['rm', id]);
    rmSync(temp, { recursive: true, force: true });
  }
}
export function verifyImage(image) {
  assert.deepEqual(inspectEvidence(image), image.sbom, 'SBOM evidence differs from recorded artifact');
}
