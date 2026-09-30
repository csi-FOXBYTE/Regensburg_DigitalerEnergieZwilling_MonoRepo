// Deliberately synthetic artifact metadata, used only by tests.
export function fixtureBom(image) {
  return { bomFormat: 'CycloneDX', specVersion: '1.6', version: 1, metadata: { component: {
    type: 'application', name: 'EXAMPLE-ONLY', version: `build-${image.build}`,
    properties: [{ name: 'vcs:commit', value: image.sourceCommit }, { name: 'regensburg:build', value: image.build }],
  } } };
}
