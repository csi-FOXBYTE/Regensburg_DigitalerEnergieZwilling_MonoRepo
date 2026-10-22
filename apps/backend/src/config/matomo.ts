export type AnalyticsConfigState = "active" | "inactive" | "invalid";

/** Matomo is dormant unless this environment has its own tracker URL and site ID. */
export function readMatomoConfig() {
  const trackerUrl = process.env.MATOMO_URL?.trim();
  const siteId = Number(process.env.MATOMO_SITE_ID?.trim());
  if (!trackerUrl || !Number.isInteger(siteId) || siteId < 1) return null;
  return { trackerUrl, siteId };
}

// "invalid": a value is set, but analytics stays off (only one value or a bad site ID).
export function analyticsConfigState(): AnalyticsConfigState {
  if (readMatomoConfig()) return "active";
  return process.env.MATOMO_URL?.trim() || process.env.MATOMO_SITE_ID?.trim()
    ? "invalid"
    : "inactive";
}
