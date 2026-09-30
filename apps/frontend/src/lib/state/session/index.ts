import { mapConfig } from '@/config/map';
import {
  type CameraTarget,
  getCameraTarget,
  requestCamera,
} from '../../camera-state';
import {
  $building,
  beforeBuildingChange,
  sessionTransition,
  setBuildingState,
} from '../building';
import { isSavedSession } from './restore-codec';
import {
  hydrateInputs,
  $inputState,
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '../inputs/atoms';
import {
  $maxStepReached,
  $step,
  setStep,
  navigateToStep,
  Step,
} from '../ui/progress';
import {
  getMeta,
  getSession,
  saveRawSession,
  sessionStorage,
  clearSession,
  setMeta,
  type SavedSession,
} from './storage';

export { clearSession, getSession } from './storage';
export type { DetMeta, SavedSession } from './storage';

function isMapTarget(value: unknown): value is CameraTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as Partial<CameraTarget>;
  const bounds = mapConfig.sessionTargetBounds;
  return (
    Number.isFinite(target.longitudeDegrees) &&
    Number.isFinite(target.latitudeDegrees) &&
    target.longitudeDegrees! >= bounds.westDegrees &&
    target.longitudeDegrees! <= bounds.eastDegrees &&
    target.latitudeDegrees! >= bounds.southDegrees &&
    target.latitudeDegrees! <= bounds.northDegrees
  );
}

function resolveSessionCameraTarget(
  session: SavedSession,
): CameraTarget | null {
  if (isMapTarget(session.cameraTarget)) {
    return session.cameraTarget;
  }

  if (
    Number.isFinite(session.cameraLon) &&
    Number.isFinite(session.cameraLat)
  ) {
    const legacyTarget = {
      longitudeDegrees: (session.cameraLon * 180) / Math.PI,
      latitudeDegrees: (session.cameraLat * 180) / Math.PI,
    };
    if (isMapTarget(legacyTarget)) return legacyTarget;
  }

  const buildingTarget = {
    longitudeDegrees: session.building.coordinates.lon,
    latitudeDegrees: session.building.coordinates.lat,
  };
  return isMapTarget(buildingTarget) ? buildingTarget : null;
}

// Set when a session was injected via a recovery link (#restore=…) so the
// resume dialog doesn't additionally prompt for the very session we just loaded.
let restoredFromLink = false;
let linkRestoreError = false;
export function markRestoredFromLink(): void {
  restoredFromLink = true;
}
export function wasRestoredFromLink(): boolean {
  return restoredFromLink;
}
export function markLinkRestoreError(): void {
  linkRestoreError = true;
}
export function consumeLinkRestoreError(): boolean {
  const result = linkRestoreError;
  linkRestoreError = false;
  return result;
}

export function getCurrentSessionSnapshot(): SavedSession | null {
  const building = $building.get();
  const step = $step.get();
  if (step < Step.GeneralData || !building) return null;

  const target = getCameraTarget() ?? {
    longitudeDegrees: building.coordinates.lon,
    latitudeDegrees: building.coordinates.lat,
  };

  return {
    step,
    maxStepReached: $maxStepReached.get(),
    building,
    cameraTarget: target,
    cameraLon: (target.longitudeDegrees * Math.PI) / 180,
    cameraLat: (target.latitudeDegrees * Math.PI) / 180,
    inputState: $inputState.get(),
    insulationRenovations: $selectedInsulationRenovations.get(),
    heatingSurfaceRenovations: $selectedHeatingSurfaceRenovations.get(),
    heatingRenovations: $selectedHeatingRenovations.get(),
  };
}

export function saveSession(): void {
  const session = getCurrentSessionSnapshot();
  if (session) saveRawSession(session.building.id, session);
}

beforeBuildingChange(saveSession);

export function loadSession(buildingId: string): void {
  const session = getSession(buildingId);
  if (session) loadSessionFromData(session);
}

export function startOverSession(buildingId: string): void {
  sessionTransition(() => {
    clearSession(buildingId);
    hydrateInputs(null);
    if (typeof history !== 'undefined') navigateToStep(Step.GeneralData);
    setStep(Step.GeneralData);
    $maxStepReached.set(Step.GeneralData);
  });
  saveSession();
  sessionStorage.flush();
}

export function loadSessionFromData(session: SavedSession): void {
  if (!isSavedSession(session)) throw new Error('Invalid restoration session');
  session = structuredClone(session);
  const target = resolveSessionCameraTarget(session);
  const migratedSession = {
    ...session,
    maxStepReached: Math.max(
      session.step,
      session.maxStepReached ?? session.step,
    ) as Step,
    ...(target
      ? {
          cameraTarget: target,
          cameraLon: (target.longitudeDegrees * Math.PI) / 180,
          cameraLat: (target.latitudeDegrees * Math.PI) / 180,
        }
      : {}),
  };
  setBuildingState(session.building, () => {
    hydrateInputs(migratedSession);
    if (typeof history !== 'undefined') navigateToStep(session.step);
    setStep(session.step);
  });
  saveRawSession(session.building.id, migratedSession, true);
  setMeta({ lastActiveBuildingId: session.building.id, step: session.step });
  sessionStorage.flush();
  if (target) {
    requestCamera({
      type: 'focus',
      target,
      reason: { type: 'sessionRestore' },
    });
  }
}

export function getLastActiveSession() {
  const meta = getMeta();
  if (
    !meta.lastActiveBuildingId ||
    meta.step === null ||
    meta.step < Step.GeneralData
  )
    return null;
  return getSession(meta.lastActiveBuildingId);
}

export function clearLastActive(): void {
  setMeta({ lastActiveBuildingId: null, step: null });
  sessionStorage.flush();
}
