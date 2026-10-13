import { getAnalyticsConfig } from '../api/public';
import { consent } from '../consent/state';
import { fetchTransport, sanitizedPageUrl, Tracker } from './tracker';

export const tracker = new Tracker(
  consent,
  fetchTransport,
  () => (typeof window === 'undefined' ? undefined : window.sessionStorage),
  () => sanitizedPageUrl(window.location),
);

let initialization: Promise<void> | undefined;

/** Offers analytics consent only when this environment has a Matomo site. */
export function initAnalytics(): Promise<void> {
  initialization ??= getAnalyticsConfig()
    .then((config) => {
      if (!config) return;
      tracker.configure(config);
      consent.enablePurpose('analytics');
    })
    .catch(() => {});
  return initialization;
}
