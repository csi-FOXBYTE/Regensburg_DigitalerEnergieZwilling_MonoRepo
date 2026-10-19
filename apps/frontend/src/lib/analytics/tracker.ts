import type { BrowserStorage, ConsentManager } from '../consent/state';
import { locales } from '../../i18n/config';
import {
  EVENT_CATEGORY,
  isAllowedEvent,
  type EventCode,
  type EventValue,
} from './catalog';

export type AnalyticsTarget = { trackerUrl: string; siteId: number };
export type Transport = (
  trackerUrl: string,
  requests: URLSearchParams[],
) => Promise<void>;

export const ANALYTICS_SESSION_KEY = 'det_analytics_session';
/** Inactivity timeout of the session reference. Operating parameter pending approval. */
export const ANALYTICS_SESSION_TIMEOUT = 30 * 60 * 1000;

type AnalyticsSessionState = {
  id: string;
  lastActivityAt: number;
  sent: string[];
};

/** Origin and locale only: never search, fragment, tokens or deeper paths. */
export function sanitizedPageUrl(location: {
  origin: string;
  pathname: string;
}): string {
  const locale = location.pathname.split('/')[1];
  return (locales as readonly string[]).includes(locale)
    ? `${location.origin}/${locale}/`
    : `${location.origin}/`;
}

export function randomSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function isSessionState(value: unknown): value is AnalyticsSessionState {
  const state = value as AnalyticsSessionState | null;
  return (
    typeof state?.id === 'string' &&
    /^[0-9a-f]{16}$/.test(state.id) &&
    Number.isFinite(state.lastActivityAt) &&
    Array.isArray(state.sent) &&
    state.sent.every((key) => typeof key === 'string')
  );
}

/**
 * Single exit point to Matomo. Events are validated against the catalog and
 * dropped (never buffered) without configuration or analytics consent.
 */
export class Tracker {
  private target: AnalyticsTarget | null = null;
  private session: AnalyticsSessionState | null = null;
  private outbox: URLSearchParams[] = [];
  private delivery = Promise.resolve();

  constructor(
    readonly permission: ConsentManager,
    readonly transport: Transport,
    readonly sessionStore: () => BrowserStorage | undefined,
    readonly pageUrl: () => string,
    readonly newSessionId = randomSessionId,
  ) {
    permission.$decision.listen(() => {
      if (!permission.allows('analytics')) this.forgetSession();
    });
  }

  configure(target: AnalyticsTarget): void {
    this.target = target;
  }

  /** Lets callers skip deriving category keys when nothing would be sent. */
  isActive(): boolean {
    return !!this.target && this.permission.allows('analytics');
  }

  track<C extends EventCode>(code: C, ...[value]: OptionalValue<C>): void {
    if (!isAllowedEvent(code, value)) {
      if (import.meta.env?.DEV)
        console.warn('Analytics event rejected by allow-list', code, value);
      return;
    }
    // Checked at send time, so nothing survives from before an opt-in.
    if (!this.target || !this.isActive()) return;

    const session = this.currentSession();
    session.lastActivityAt = this.permission.now();
    const key = value === undefined ? code : `${code}:${value}`;
    const duplicate = session.sent.includes(key);
    if (!duplicate) session.sent.push(key);
    this.saveSession(session);
    if (duplicate) return;

    const body = new URLSearchParams({
      idsite: String(this.target.siteId),
      rec: '1',
      apiv: '1',
      send_image: '0',
      rand: this.newSessionId(),
      _id: session.id,
      url: this.pageUrl(),
      e_c: EVENT_CATEGORY,
      e_a: code,
    });
    if (typeof value === 'string') body.set('e_n', value);
    this.outbox.push(body);
    // Events of one user action leave together once the action has finished.
    if (this.outbox.length === 1) queueMicrotask(() => void this.flush());
  }

  /**
   * Sends queued events as one bulk request after the previous one completed.
   * Parallel requests would let Matomo split a new visit in two and reorder
   * events, which breaks the "last completed step" drop-off KPI.
   */
  flush(): Promise<void> {
    const requests = this.outbox.splice(0);
    if (requests.length && this.target && this.isActive()) {
      const { trackerUrl } = this.target;
      this.delivery = this.delivery
        // A withdrawal while earlier events were in flight cancels this batch.
        .then(() =>
          this.isActive() ? this.transport(trackerUrl, requests) : undefined,
        )
        .catch(() => {
          // Analytics must never interrupt the renovation check.
        });
    }
    return this.delivery;
  }

  private currentSession(): AnalyticsSessionState {
    const now = this.permission.now();
    if (!this.session) {
      try {
        const stored = JSON.parse(
          this.sessionStore()?.getItem(ANALYTICS_SESSION_KEY) ?? 'null',
        );
        if (isSessionState(stored)) this.session = stored;
      } catch {
        // A blocked or malformed tab store starts a fresh session.
      }
    }
    if (
      !this.session ||
      now - this.session.lastActivityAt >= ANALYTICS_SESSION_TIMEOUT ||
      this.session.lastActivityAt > now
    )
      this.session = { id: this.newSessionId(), lastActivityAt: now, sent: [] };
    return this.session;
  }

  private saveSession(session: AnalyticsSessionState): void {
    try {
      this.sessionStore()?.setItem(
        ANALYTICS_SESSION_KEY,
        JSON.stringify(session),
      );
    } catch {
      // Deduplication then lasts for this page only.
    }
  }

  private forgetSession(): void {
    this.session = null;
    this.outbox = [];
    try {
      this.sessionStore()?.removeItem(ANALYTICS_SESSION_KEY);
    } catch {
      // Nothing else to clean up; no further events are sent.
    }
  }
}

type OptionalValue<C extends EventCode> =
  EventValue<C> extends undefined ? [] : [value: EventValue<C>];

/**
 * Cookieless Matomo bulk request that survives navigation away from the page.
 * Matomo processes the contained requests in order.
 */
export const fetchTransport: Transport = async (trackerUrl, requests) => {
  await fetch(trackerUrl, {
    method: 'POST',
    body: JSON.stringify({ requests: requests.map((body) => `?${body}`) }),
    credentials: 'omit',
    keepalive: true,
    mode: 'no-cors',
    referrerPolicy: 'no-referrer',
    // A hanging Matomo must not hold back later events for the whole page.
    signal: AbortSignal.timeout(10_000),
  });
};
