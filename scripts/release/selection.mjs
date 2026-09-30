import { components, fingerprint, isBuildInput } from './core.mjs';

export function selectArtifacts(entries, config, previous, { resolveDigest, verifyImage }) {
  const policy = entries.filter(({ path }) =>
    (path.startsWith('scripts/release/') && !path.startsWith('scripts/release/fixtures/')
      && !path.endsWith('.test.mjs') && !path.endsWith('.md'))
    || path === '.github/workflows/release.yml' || path.startsWith('.github/actions/release-image/')).sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return Object.fromEntries(components.map(component => {
    const settings = config.images[component];
    const baseImage = `${settings.base}@${resolveDigest(settings.base)}`;
    const runtimeBaseImage = settings.runtimeBase === settings.base ? baseImage
      : `${settings.runtimeBase}@${resolveDigest(settings.runtimeBase)}`;
    const inputFingerprint = fingerprint(entries.filter(({ path }) => isBuildInput(path, component)), {
      policy, baseImage, runtimeBaseImage, platform: config.platform, refreshEpoch: config.refreshEpoch,
    });
    const existing = previous?.[component];
    const changed = !existing || existing.fingerprint !== inputFingerprint;
    if (!changed) verifyImage(existing);
    return [component, { changed, image: settings.repository, fingerprint: inputFingerprint,
      baseImage, runtimeBaseImage, platform: config.platform, refreshEpoch: config.refreshEpoch,
      ...(!changed ? { selected: existing } : {}),
    }];
  }));
}
