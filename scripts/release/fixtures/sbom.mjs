// Deliberately synthetic artifact metadata, used only by tests. Self-contained:
// the publication tests copy it next to the simulated remotes.
const packageNames = { '-adminfrontend': 'base-frontend', '-backend': 'rg-dez-backend' };
export function fixtureBom(image) {
  const name = Object.entries(packageNames).find(([suffix]) => image.image.endsWith(suffix))?.[1] ?? 'frontend';
  return { bomFormat: 'CycloneDX', specVersion: '1.6', version: 1, metadata: { component: {
    type: 'application', name, version: `build-${image.build}`,
    properties: [{ name: 'vcs:commit', value: image.sourceCommit }, { name: 'regensburg:build', value: image.build }],
  } } };
}
