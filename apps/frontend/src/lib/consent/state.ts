import { atom } from 'nanostores';

export const DAY = 24 * 60 * 60 * 1000;
export const CONSENT_TTL = 180 * DAY;
export const CONSENT_KEY = 'det_consent';
/** A purpose's version is the decision version in which it was first offered. */
export const purposes = [
  { id: 'functional', version: 1 },
  { id: 'analytics', version: 2 },
] as const;
export type Purpose = (typeof purposes)[number]['id'];
export type PurposeVersion = (typeof purposes)[number]['version'];
export type Choices = Record<Purpose, boolean>;
export type ConsentDecision = {
  version: 1;
  /** Purposes newer than this were not offered and remain undecided. */
  purposeVersion: PurposeVersion;
  choices: Choices;
  decidedAt: number;
  expiresAt: number;
};
export type BrowserStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;

const purposeVersionOf = (id: Purpose): PurposeVersion =>
  purposes.find((purpose) => purpose.id === id)!.version;

export function parseDecision(
  raw: string | null,
  now: number,
): ConsentDecision | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    const purposeVersion = value?.purposeVersion;
    if (
      value?.version !== 1 ||
      (purposeVersion !== 1 && purposeVersion !== 2) ||
      typeof value.choices?.functional !== 'boolean' ||
      (purposeVersion >= 2 && typeof value.choices.analytics !== 'boolean') ||
      !Number.isFinite(value.decidedAt) ||
      value.decidedAt > now ||
      value.expiresAt !== value.decidedAt + CONSENT_TTL ||
      value.expiresAt <= now
    )
      return null;
    return {
      version: 1,
      purposeVersion,
      choices: {
        functional: value.choices.functional,
        analytics: purposeVersion >= 2 && value.choices.analytics,
      },
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
  /** Purposes this deployment can actually offer; optional ones are enabled at runtime. */
  readonly $availablePurposes = atom<readonly Purpose[]>(['functional']);
  private initialized = false;
  private observedRaw: string | null = null;

  constructor(
    readonly storage: () => BrowserStorage | undefined,
    readonly now = Date.now,
  ) {}

  reportStorageError = () => {
    this.$storageError.set(true);
  };

  isAvailable(purpose: string): purpose is Purpose {
    return this.$availablePurposes.get().includes(purpose as Purpose);
  }

  enablePurpose(purpose: Purpose): void {
    if (!this.isAvailable(purpose))
      this.$availablePurposes.set([...this.$availablePurposes.get(), purpose]);
  }

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
      this.isAvailable(purpose) &&
      this.$decision.get()?.choices[purpose] === true
    );
  }

  /** True without a decision, or when an available purpose was not offered when deciding. */
  needsDecision(): boolean {
    this.refresh();
    const decision = this.$decision.get();
    return (
      !decision ||
      this.$availablePurposes
        .get()
        .some((id) => purposeVersionOf(id) > decision.purposeVersion)
    );
  }

  commit(choices: Partial<Choices>): void {
    this.refresh();
    const decidedAt = this.now();
    const available = this.$availablePurposes.get();
    const decision: ConsentDecision = {
      version: 1,
      // Record only what was offered, so a later purpose prompts again.
      purposeVersion: Math.max(
        ...available.map(purposeVersionOf),
      ) as PurposeVersion,
      choices: {
        functional: choices.functional === true,
        analytics:
          available.includes('analytics') && choices.analytics === true,
      },
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
