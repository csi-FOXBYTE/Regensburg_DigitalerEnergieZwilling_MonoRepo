import { atom } from 'nanostores';

export type CameraMode = 'perspective' | 'topDown';
export type CameraActivity =
  | 'idle'
  | 'flight'
  | 'interaction'
  | 'modeTransition';
export type PanDirection = 'up' | 'down' | 'left' | 'right';

export type CameraTarget = {
  longitudeDegrees: number;
  latitudeDegrees: number;
};

export type AddressCameraContext = {
  buildingId: string;
  allowInvalidBuilding?: boolean;
  street?: string;
  housenumber?: string;
};

export type FocusCameraIntent = {
  type: 'focus';
  target: CameraTarget;
  reason:
    | { type: 'address'; address: AddressCameraContext }
    | { type: 'externalBuilding'; buildingId: string }
    | { type: 'building' }
    | { type: 'sessionRestore' };
  accommodateMobileOverlay?: boolean;
};

export type CameraIntent =
  | FocusCameraIntent
  | { type: 'pan'; direction: PanDirection }
  | { type: 'zoom'; direction: 'in' | 'out' }
  | { type: 'alignNorth' }
  | { type: 'setMode'; mode: CameraMode }
  | { type: 'resetTransform' };

export type CameraRequestResult = 'accepted' | 'pending' | 'ignored';

export type CameraStatus = {
  initialized: boolean;
  mode: CameraMode;
  activity: CameraActivity;
};

type CameraOwner = {
  activate: () => void;
  dispose: () => CameraIntent | null;
  execute: (intent: CameraIntent) => boolean;
};

const INITIAL_STATUS: CameraStatus = {
  initialized: false,
  mode: 'perspective',
  activity: 'idle',
};

export const $cameraStatus = atom<CameraStatus>(INITIAL_STATUS);
export const $cameraHeading = atom(0);

let owner: CameraOwner | null = null;
let pendingIntent: CameraIntent | null = null;
let cameraTarget: CameraTarget | null = null;

export function getCameraTarget(): CameraTarget | null {
  return cameraTarget ? { ...cameraTarget } : null;
}

export function requestCamera(intent: CameraIntent): CameraRequestResult {
  if (!owner) {
    pendingIntent = intent;
    return 'pending';
  }
  return owner.execute(intent) ? 'accepted' : 'ignored';
}

export function registerCameraOwner(controller: CameraOwner): () => void {
  if (owner && owner !== controller) {
    const interruptedIntent = owner.dispose();
    if (interruptedIntent) pendingIntent = interruptedIntent;
  }
  owner = controller;
  controller.activate();

  const intent = pendingIntent;
  pendingIntent = null;
  if (intent) controller.execute(intent);

  return () => {
    if (owner !== controller) return;
    owner = null;
    const interruptedIntent = controller.dispose();
    if (interruptedIntent) pendingIntent = interruptedIntent;
    cameraTarget = null;
    $cameraStatus.set(INITIAL_STATUS);
    $cameraHeading.set(0);
  };
}

export function setCameraStatus(status: CameraStatus) {
  $cameraStatus.set(status);
}

export function setCameraHeading(headingDegrees: number) {
  $cameraHeading.set(headingDegrees);
}

export function setCameraTarget(target: CameraTarget) {
  cameraTarget = { ...target };
}
