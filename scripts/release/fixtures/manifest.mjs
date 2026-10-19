import { components } from '../core.mjs';
import { config } from '../io.mjs';
import { sbomEvidence } from '../evidence.mjs';
import { fixtureBom } from './sbom.mjs';
import { sbomSelection } from '../sboms.mjs';
export function exampleManifest() {
  const manifest = { schema: 2, appVersion: '0.1.0', previousVersion: null, sourceCommit: 'a'.repeat(40), runId: '123' };
  for (const [index, component] of components.entries()) {
    const image = { image: config.images[component].repository,
      digest: `sha256:${String(index).repeat(64)}`, fingerprint: `sha256:${'b'.repeat(64)}`,
      sourceCommit: 'a'.repeat(40), build: '123-1', platform: config.platform,
      baseImage: `${config.images[component].base}@sha256:${'c'.repeat(64)}`,
      runtimeBaseImage: `${config.images[component].runtimeBase}@sha256:${'d'.repeat(64)}` };
    image.sbom = sbomEvidence(Buffer.from(JSON.stringify(fixtureBom(image))), image);
    manifest[component] = image;
  }
  return manifest;
}
// A v1.8.0-like manifest still records the retired matomo image.
export function withMatomo(manifest) {
  const build = '123-1';
  manifest.matomo = { image: 'ghcr.io/csi-foxbyte/regensburg-web-matomo',
    digest: `sha256:${'9'.repeat(64)}`, fingerprint: `sha256:${'b'.repeat(64)}`,
    sourceCommit: manifest.sourceCommit, build, platform: config.platform,
    baseImage: `node:24.21.0-bookworm-slim@sha256:${'c'.repeat(64)}`,
    runtimeBaseImage: `matomo:5.14.0-apache@sha256:${'d'.repeat(64)}`,
    sbom: { path: '/usr/share/regensburg/SBOM.cdx.json', sha256: `sha256:${'e'.repeat(64)}`,
      version: `build-${build}`, sourceCommit: manifest.sourceCommit } };
  return manifest;
}
export function withSboms(manifest) {
  manifest.sboms = { schema: 1, ...sbomSelection(manifest) };
  return manifest;
}
