import { atom } from 'nanostores';

export const DAY = 24 * 60 * 60 * 1000;
export const CONSENT_TTL = 180 * DAY;
export const CONSENT_KEY = 'det_consent';
export const purposes = [{ id: 'functional', version: 1 }] as const;
export type Purpose = (typeof purposes)[number]['id'];
export type Choices = Record<Purpose, boolean>;
export type ConsentDecision = {
  version: 1;
  purposeVersion: 1;
  choices: Choices;
  decidedAt: number;
  expiresAt: number;
};
export type BrowserStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;

export function parseDecision(
  raw: string | null,
  now: number,
): ConsentDecision | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (
      value?.version !== 1 ||
      value.purposeVersion !== 1 ||
      typeof value.choices?.functional !== 'boolean' ||
      !Number.isFinite(value.decidedAt) ||
      value.decidedAt > now ||
      value.expiresAt !== value.decidedAt + CONSENT_TTL ||
      value.expiresAt <= now
    )
      return null;
    return {
      version: 1,
      purposeVersion: 1,
      choices: { functional: value.choices.functional },
      decidedAt: value.decidedAt,
      expiresAt: value.expiresAt,
    };
  } catch {
    return null;
  }
}

/** Committed permissions only. New purposes must be explicitly versioned and chosen. */
export class ConsentManager {
  readonly $decision = atom<ConsentDecision | null>(null);
  readonly $storageError = atom(false);
  private initialized = false;
  private observedRaw: string | null = null;

  constructor(
    readonly storage: () => BrowserStorage | undefined,
    readonly now = Date.now,
  ) {}

  reportStorageError = () => {
    this.$storageError.set(true);
  };

  refresh(): void {
    try {
      const raw = this.storage()?.getItem(CONSENT_KEY) ?? null;
      if (!this.initialized || raw !== this.observedRaw) {
        this.initialized = true;
        this.observedRaw = raw;
        this.$decision.set(parseDecision(raw, this.now()));
      }
    } catch {
      this.reportStorageError();
    }
    const decision = this.$decision.get();
    if (decision && decision.expiresAt <= this.now()) this.$decision.set(null);
  }

  allows(purpose: string): boolean {
    this.refresh();
    return (
      purposes.some(({ id }) => id === purpose) &&
      this.$decision.get()?.choices[purpose as Purpose] === true
    );
  }

  commit(choices: Choices): void {
    this.refresh();
    const decidedAt = this.now();
    const decision: ConsentDecision = {
      version: 1,
      purposeVersion: 1,
      choices: { functional: choices.functional === true },
      decidedAt,
      expiresAt: decidedAt + CONSENT_TTL,
    };
    this.initialized = true;
    try {
      const storage = this.storage();
      if (!storage) throw new Error('Storage unavailable');
      const raw = JSON.stringify(decision);
      storage.setItem(CONSENT_KEY, raw);
      this.observedRaw = raw;
    } catch {
      this.reportStorageError();
    }
    // Publish denial before subscribers clean up optional data.
    this.$decision.set(decision);
  }
}

export const consent = new ConsentManager(() =>
  typeof window === 'undefined' ? undefined : window.localStorage,
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CONSENT_KEY || event.key === null) consent.refresh();
  });
}
