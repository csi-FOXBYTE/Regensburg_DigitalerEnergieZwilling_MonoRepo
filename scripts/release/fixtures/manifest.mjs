import { components } from '../core.mjs';
import { config } from '../io.mjs';
import { sbomEvidence } from '../evidence.mjs';
import { fixtureBom } from './sbom.mjs';
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
