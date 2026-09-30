import { consent, ConsentManager, DAY } from '../../consent/state';
import { isSavedSession } from './restore-codec';
import type { Renovation } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import type { CameraTarget } from '../../camera-state';
import type { BuildingState } from '../building';
import type { InputState } from '../inputs/atoms';
import { Step } from '../ui/progress';

export type SavedSession = {
  step: Step;
  /** Highest step reached. Optional only for sessions saved before this field existed. */
  maxStepReached?: Step;
  building: BuildingState;
  cameraTarget?: CameraTarget;
  /** @deprecated Legacy radians retained for recovery-link compatibility. */
  cameraLon: number;
  /** @deprecated Legacy radians retained for recovery-link compatibility. */
  cameraLat: number;
  inputState: InputState;
  insulationRenovations: Renovation[];
  heatingSurfaceRenovations: Renovation[];
  heatingRenovations: Renovation[];
};

export type DetMeta = {
  lastActiveBuildingId: string | null;
  step: Step | null;
};

export const META_KEY = 'det_meta';
export const BUILDING_PREFIX = 'det_building_data_';
export const NOTICE_KEYS = [
  'map-help-seen',
  'det_methodology_notice_seen_v1',
] as const;
export type NoticeKey = (typeof NOTICE_KEYS)[number];
export const PROGRESS_TTL = 90 * DAY;
type Envelope<T> = { version: 1; savedAt: number; expiresAt: number; value: T };
const emptyMeta = (): DetMeta => ({ lastActiveBuildingId: null, step: null });
const clone = <T>(value: T): T => structuredClone(value);

/** Memory owns open-page work; persistence is a consent-gated, expiring copy. */
export class SessionStorage {
  private sessions = new Map<string, Envelope<SavedSession>>();
  private notices = new Map<NoticeKey, Envelope<true>>();
  private meta: Envelope<DetMeta> | undefined;
  private dirty = new Set<string>();
  private deleted = new Set<string>();

  constructor(readonly permission: ConsentManager) {
    permission.$decision.listen((decision) => {
      if (decision?.choices.functional) this.flush(true);
      else if (decision) this.removeOptionalData();
    });
  }

  private envelope<T>(value: T): Envelope<T> {
    const savedAt = this.permission.now();
    return {
      version: 1,
      savedAt,
      expiresAt: savedAt + PROGRESS_TTL,
      value: clone(value),
    };
  }

  private read<T>(
    key: string,
    valid: (value: unknown) => value is T,
  ): Envelope<T> | null {
    if (this.deleted.has(key) || !this.permission.allows('functional'))
      return null;
    try {
      const raw = this.permission.storage()?.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (
        entry?.version === 1 &&
        Number.isFinite(entry.savedAt) &&
        entry.savedAt <= this.permission.now() &&
        entry.expiresAt === entry.savedAt + PROGRESS_TTL &&
        entry.expiresAt > this.permission.now() &&
        valid(entry.value)
      )
        return entry;
      this.remove(key);
    } catch {
      this.permission.reportStorageError();
    }
    return null;
  }

  private write<T>(key: string, entry: Envelope<T>): void {
    if (
      !this.permission.allows('functional') ||
      entry.expiresAt <= this.permission.now()
    )
      return;
    try {
      const storage = this.permission.storage();
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(key, JSON.stringify(entry));
    } catch {
      this.permission.reportStorageError();
    }
  }

  private remove(key: string): void {
    try {
      this.permission.storage()?.removeItem(key);
    } catch {
      this.permission.reportStorageError();
    }
  }

  getSession(id: string): SavedSession | null {
    const memory = this.sessions.get(id);
    if (memory) return clone(memory.value);
    const entry = this.read(BUILDING_PREFIX + id, isSavedSession);
    if (!entry || entry.value.building.id !== id) return null;
    this.sessions.set(id, entry);
    return clone(entry.value);
  }

  saveSession(id: string, session: SavedSession, resume = false): void {
    if (!isSavedSession(session) || session.building.id !== id) return;
    const previous = this.sessions.get(id);
    // Passive inspection/switching never extends persistent lifetime.
    if (!resume && previous) {
      try {
        if (JSON.stringify(previous.value) === JSON.stringify(session)) return;
      } catch {
        // A serialization failure must not prevent retaining work in memory.
        this.permission.reportStorageError();
      }
    }
    this.sessions.set(id, this.envelope(session));
    this.deleted.delete(BUILDING_PREFIX + id);
    this.dirty.add(id);
    this.setMeta({ lastActiveBuildingId: id, step: session.step });
  }

  getMeta(): DetMeta {
    if (!this.meta)
      this.meta =
        this.read(META_KEY, (value): value is DetMeta => {
          if (!value || typeof value !== 'object') return false;
          const meta = value as DetMeta;
          return (
            (meta.lastActiveBuildingId === null ||
              typeof meta.lastActiveBuildingId === 'string') &&
            (meta.step === null ||
              (Number.isInteger(meta.step) &&
                meta.step >= Step.Welcome &&
                meta.step <= Step.Result))
          );
        }) ?? undefined;
    const value = this.meta?.value ?? emptyMeta();
    if (
      value.lastActiveBuildingId &&
      !this.getSession(value.lastActiveBuildingId)
    ) {
      this.meta = this.envelope(emptyMeta());
      if (this.permission.allows('functional')) this.remove(META_KEY);
      return emptyMeta();
    }
    return clone(value);
  }

  setMeta(value: DetMeta): void {
    this.meta = this.envelope(value);
    this.deleted.delete(META_KEY);
  }

  flush(all = false): void {
    // Check at execution time: a pending timer cannot undo withdrawal.
    if (!this.permission.allows('functional')) return;
    for (const [id, entry] of this.sessions) {
      if (all || this.dirty.has(id)) this.write(BUILDING_PREFIX + id, entry);
    }
    this.dirty.clear();
    if (this.meta) this.write(META_KEY, this.meta);
    if (all) for (const [key, entry] of this.notices) this.write(key, entry);
  }

  clearSession(id: string): void {
    this.sessions.delete(id);
    this.dirty.delete(id);
    this.deleted.add(BUILDING_PREFIX + id);
    this.remove(BUILDING_PREFIX + id);
    if (this.meta?.value.lastActiveBuildingId === id) {
      this.meta = this.envelope(emptyMeta());
      this.remove(META_KEY);
    }
  }

  hasSeen(key: NoticeKey): boolean {
    if (this.notices.has(key)) return true;
    const entry = this.read(key, (value): value is true => value === true);
    if (!entry) return false;
    this.notices.set(key, entry);
    return true;
  }

  markSeen(key: NoticeKey): void {
    if (this.hasSeen(key)) return;
    const entry = this.envelope(true as const);
    this.notices.set(key, entry);
    this.write(key, entry);
  }

  getBuildingIds(): string[] {
    const ids = new Set(this.sessions.keys());
    if (this.permission.allows('functional')) {
      try {
        const storage = this.permission.storage();
        const keys = Array.from({ length: storage?.length ?? 0 }, (_, i) =>
          storage!.key(i),
        );
        for (const key of keys) {
          if (key?.startsWith(BUILDING_PREFIX)) {
            const id = key.slice(BUILDING_PREFIX.length);
            if (this.getSession(id)) ids.add(id);
          }
        }
      } catch {
        this.permission.reportStorageError();
      }
    }
    return [...ids];
  }

  removeOptionalData(): void {
    this.dirty.clear();
    // Enumerate keys only for deletion, never read optional payloads on denial.
    try {
      const storage = this.permission.storage();
      const keys = Array.from({ length: storage?.length ?? 0 }, (_, i) =>
        storage!.key(i),
      );
      for (const key of keys)
        if (key?.startsWith(BUILDING_PREFIX)) this.remove(key);
    } catch {
      this.permission.reportStorageError();
    }
    for (const key of [META_KEY, ...NOTICE_KEYS]) this.remove(key);
  }
}

export const sessionStorage = new SessionStorage(consent);
export const getMeta = () => sessionStorage.getMeta();
export const setMeta = (meta: DetMeta) => sessionStorage.setMeta(meta);
export const getSession = (id: string) => sessionStorage.getSession(id);
export const saveRawSession = (
  id: string,
  session: SavedSession,
  resume = false,
) => sessionStorage.saveSession(id, session, resume);
export const clearSession = (id: string) => sessionStorage.clearSession(id);
export const hasSeenNotice = (key: NoticeKey) => sessionStorage.hasSeen(key);
export const markNoticeSeen = (key: NoticeKey) => sessionStorage.markSeen(key);
