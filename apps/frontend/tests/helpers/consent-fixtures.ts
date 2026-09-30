import type { BrowserStorage } from '../../src/lib/consent/state';
import type { SavedSession } from '../../src/lib/state/session/storage';
import { emptyInputState } from '../../src/lib/state/inputs/atoms';
import { Step } from '../../src/lib/state/ui/progress';

export class FakeStorage implements BrowserStorage {
  data = new Map<string, string>();
  reads: string[] = [];
  writes: string[] = [];
  failRead = false;
  failWrite = false;
  failRemove = false;
  get length() {
    if (this.failRead) throw new Error('Blocked');
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    this.reads.push(key);
    if (this.failRead) throw new Error('Blocked');
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes.push(key);
    if (this.failWrite) throw new Error('Quota exceeded');
    this.data.set(key, value);
  }
  removeItem(key: string) {
    if (this.failRemove) throw new Error('Blocked');
    this.data.delete(key);
  }
}

export function session(id = 'A'): SavedSession {
  return {
    step: Step.Heat,
    maxStepReached: Step.Result,
    building: {
      id,
      coordinates: { lon: 12.1, lat: 49.01 },
      properties: {
        measuredHeight: undefined,
        lowestEave: undefined,
        groundHeight: undefined,
        roofHeight: undefined,
        isFlatRoof: undefined,
        address: undefined,
        digitalEnergyTwin: {
          volume: undefined,
          groundArea: undefined,
          upperFloorArea: undefined,
          grossExternalWallArea: undefined,
          grossExternalWallAreaWithoutAttic: undefined,
          grossExternalWallAreaAttic: undefined,
          roofArea: undefined,
          roofPitchDegrees: undefined,
          height: undefined,
          lowestEavesHeight: undefined,
          envelopeArea: undefined,
          adjacentWallArea: undefined,
          adjacentWallAreaWithoutAttic: undefined,
          adjacentWallAreaAttic: undefined,
          constructionYear: undefined,
          geothermalEnergyAvailable: undefined,
        },
      },
    },
    cameraTarget: { longitudeDegrees: 12.1, latitudeDegrees: 49.01 },
    cameraLon: (12.1 * Math.PI) / 180,
    cameraLat: (49.01 * Math.PI) / 180,
    inputState: { ...emptyInputState(), general: { livingArea: 123 } },
    insulationRenovations: [],
    heatingSurfaceRenovations: [],
    heatingRenovations: [],
  };
}
