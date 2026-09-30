import { Step } from '../ui/progress';
import type { SavedSession } from './storage';

const RESTORE_VERSION = 1;

type RestoreEnvelope = {
  version: typeof RESTORE_VERSION;
  session: SavedSession;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidStep(value: unknown): value is Step {
  return (
    Number.isInteger(value) &&
    (value as number) >= Step.GeneralData &&
    (value as number) <= Step.Result
  );
}

function isInputState(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    'general',
    'heat',
    'roof',
    'roofWindows',
    'exteriorWallWindows',
    'topFloor',
    'outerWall',
    'bottomFloor',
    'electricity',
  ].every((key) => isRecord(value[key]));
}

export function isSavedSession(value: unknown): value is SavedSession {
  if (!isRecord(value)) return false;

  const building = value.building;
  if (!isRecord(building) || typeof building.id !== 'string') return false;
  if (building.id.trim().length === 0) return false;
  if (
    !isRecord(building.properties) ||
    !isRecord(building.properties.digitalEnergyTwin) ||
    !isRecord(building.coordinates)
  ) {
    return false;
  }
  if (
    !isFiniteNumber(building.coordinates.lon) ||
    !isFiniteNumber(building.coordinates.lat)
  ) {
    return false;
  }

  if (!isValidStep(value.step)) return false;
  if (value.maxStepReached !== undefined) {
    if (!isValidStep(value.maxStepReached)) return false;
    if (value.maxStepReached < value.step) return false;
  }
  if (!isInputState(value.inputState)) return false;
  if (!Array.isArray(value.insulationRenovations)) return false;
  if (!Array.isArray(value.heatingSurfaceRenovations)) return false;
  if (!Array.isArray(value.heatingRenovations)) return false;

  return true;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new Error('Malformed Base64URL payload');
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeSessionRestore(session: SavedSession): string {
  const envelope: RestoreEnvelope = { version: RESTORE_VERSION, session };
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeSessionRestore(payload: string): SavedSession {
  const bytes = base64ToBytes(payload);
  const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const envelope = JSON.parse(json) as unknown;

  if (!isRecord(envelope) || envelope.version !== RESTORE_VERSION) {
    throw new Error('Unsupported restoration payload version');
  }
  if (!isSavedSession(envelope.session)) {
    throw new Error('Invalid restoration session');
  }

  return envelope.session;
}
