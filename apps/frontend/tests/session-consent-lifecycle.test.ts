import assert from 'node:assert/strict';
import test from 'node:test';
import { consent, CONSENT_KEY } from '../src/lib/consent/state';
import {
  $consentDraft,
  $consentView,
  confirmConsent,
  dismissConsentDialog,
  initializeConsentDialog,
  openConsentSettings,
} from '../src/lib/consent/dialog-state';
import { $building, setBuildingState } from '../src/lib/state/building';
import {
  $inputState,
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '../src/lib/state/inputs/atoms';
import {
  getCurrentSessionSnapshot,
  loadSession,
  loadSessionFromData,
  startOverSession,
} from '../src/lib/state/session';
import { getSession, sessionStorage } from '../src/lib/state/session/storage';
import {
  decodeSessionRestore,
  encodeSessionRestore,
} from '../src/lib/state/session/restore-codec';
import {
  $maxStepReached,
  $step,
  setStep,
  Step,
} from '../src/lib/state/ui/progress';
import '../src/lib/state/session/auto-save';
import { FakeStorage, session } from './helpers/consent-fixtures';

const storage = new FakeStorage();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { localStorage: storage },
});

test('initial dismissal and cancelled settings never persist a decision or a draft', () => {
  initializeConsentDialog(true);
  assert.equal($consentView.get(), 'initial');
  openConsentSettings();
  assert.equal($consentDraft.get().functional, false);
  $consentDraft.set({ functional: true });
  dismissConsentDialog();
  assert.equal(consent.allows('functional'), false);
  assert.equal(storage.data.has(CONSENT_KEY), false);
  openConsentSettings();
  assert.equal($consentDraft.get().functional, false);
  dismissConsentDialog();
  initializeConsentDialog(true);
  assert.equal($consentView.get(), 'closed', 'dismissal lasts this document');
  $consentView.set('pending');
  initializeConsentDialog(true);
  assert.equal($consentView.get(), 'initial', 'a new document asks again');
  confirmConsent({ functional: true });
  openConsentSettings();
  $consentDraft.set({ functional: false });
  dismissConsentDialog();
  assert.equal(
    consent.allows('functional'),
    true,
    'unsaved withdrawal is discarded',
  );
  confirmConsent({ functional: false });
});

test('legal-page initialization does not open an automatic popup', () => {
  storage.data.delete(CONSENT_KEY);
  $consentView.set('pending');
  initializeConsentDialog(false);
  assert.equal($consentView.get(), 'closed');
  assert.equal(storage.data.has(CONSENT_KEY), false);
  openConsentSettings();
  assert.equal($consentView.get(), 'settings');
  dismissConsentDialog();
});

test('recovery links hydrate actual nanostores without consent or working browser storage', () => {
  storage.failRead = storage.failWrite = storage.failRemove = true;
  const original = session('recovery');
  original.inputState.general.livingArea = 456;
  const recovered = decodeSessionRestore(encodeSessionRestore(original));
  loadSessionFromData(recovered);
  assert.equal($building.get()?.id, 'recovery');
  assert.deepEqual($inputState.get(), recovered.inputState);
  assert.equal($step.get(), Step.Heat);
  assert.equal($maxStepReached.get(), Step.Result);
  assert.deepEqual(
    getCurrentSessionSnapshot()?.inputState,
    recovered.inputState,
  );
  assert.deepEqual(
    decodeSessionRestore(encodeSessionRestore(getCurrentSessionSnapshot()!))
      .inputState,
    recovered.inputState,
  );
  assert.ok(getSession('recovery'));
  const invalid = { ...original, step: -1 };
  assert.throws(() => loadSessionFromData(invalid));
  assert.equal($inputState.get().general.livingArea, 456);
  storage.failRead = storage.failWrite = storage.failRemove = false;
});

test('A → B → A preserves edits, renovation selections, current/max step and camera before debounce', () => {
  loadSessionFromData(session('A'));
  $inputState.set({ ...$inputState.get(), general: { livingArea: 789 } });
  // Existing renovation selections are opaque core values at this boundary.
  const insulation = [{ id: 'insulation-choice' }] as unknown as ReturnType<
    typeof $selectedInsulationRenovations.get
  >;
  const heating = [{ id: 'heating-choice' }] as unknown as ReturnType<
    typeof $selectedHeatingRenovations.get
  >;
  const surface = [{ id: 'surface-choice' }] as unknown as ReturnType<
    typeof $selectedHeatingSurfaceRenovations.get
  >;
  $selectedInsulationRenovations.set(insulation);
  $selectedHeatingRenovations.set(heating);
  $selectedHeatingSurfaceRenovations.set(surface);
  setStep(Step.Building);
  setBuildingState(session('B').building);
  setStep(Step.GeneralData);
  $inputState.set({ ...$inputState.get(), general: { livingArea: 321 } });
  setStep(Step.Building);
  setBuildingState(session('A').building);
  assert.equal($inputState.get().general.livingArea, 789);
  assert.deepEqual($selectedInsulationRenovations.get(), insulation);
  assert.deepEqual($selectedHeatingRenovations.get(), heating);
  assert.deepEqual($selectedHeatingSurfaceRenovations.get(), surface);
  assert.equal($maxStepReached.get(), Step.Result);
  loadSession('A');
  assert.equal($step.get(), Step.Heat);
  assert.deepEqual(getSession('A')?.cameraTarget, session('A').cameraTarget);
  assert.equal(getSession('B')?.inputState.general.livingArea, 321);
  // Mutating a caller-owned array cannot corrupt the retained snapshot.
  insulation.length = 0;
  assert.equal(getSession('A')?.insulationRenovations.length, 1);
});

test('start over resets active progress and no delayed save resurrects the old work', () => {
  consent.commit({ functional: true });
  startOverSession('A');
  assert.equal($inputState.get().general.livingArea, undefined);
  assert.deepEqual($selectedHeatingRenovations.get(), []);
  assert.equal($step.get(), Step.GeneralData);
  assert.equal($maxStepReached.get(), Step.GeneralData);
  sessionStorage.flush();
  setBuildingState(session('B').building);
  setBuildingState(session('A').building);
  assert.equal($inputState.get().general.livingArea, undefined);
  assert.equal(getSession('A')?.maxStepReached, Step.GeneralData);
  consent.commit({ functional: false });
  sessionStorage.flush();
  assert.deepEqual([...storage.data.keys()], [CONSENT_KEY]);
});
