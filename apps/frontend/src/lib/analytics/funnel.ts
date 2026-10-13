import { $calculationInput } from '../state/computed/calculation-input';
import {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '../state/inputs/atoms';
import { Step } from '../state/ui/progress';
import { buildingTypeKey, measureKey, type StepId } from './catalog';
import { tracker } from './index';

/**
 * Funnel triggers. Called only from explicit user actions, never from step
 * changes, so restores, back navigation and progress-bar jumps count nothing.
 */
const FORWARD_STEP_IDS: Partial<Record<Step, StepId>> = {
  [Step.GeneralData]: 'building_data',
  [Step.OuterParts]: 'building_envelope',
  [Step.Heat]: 'heating',
  [Step.Electricity]: 'electricity_renewables',
  [Step.Renovation]: 'renovation_measures',
};

export function trackToolStarted(): void {
  tracker.track('tool_started');
  tracker.track('step_completed', 'landing');
}

export function trackBuildingSelected(): void {
  tracker.track('step_completed', 'building_selection');
}

export function trackInitialAssessmentCompleted(): void {
  tracker.track('step_completed', 'initial_assessment');
}

/** The user confirmed `step` with its continue button. */
export function trackStepConfirmed(step: Step): void {
  const stepId = FORWARD_STEP_IDS[step];
  if (!stepId || !tracker.isActive()) return;

  if (step === Step.GeneralData) {
    const key = buildingTypeKey($calculationInput.get().general.type);
    if (key) tracker.track('building_type_confirmed', key);
  }
  if (step === Step.Renovation) {
    for (const renovation of [
      ...$selectedInsulationRenovations.get(),
      ...$selectedHeatingRenovations.get(),
      ...$selectedHeatingSurfaceRenovations.get(),
    ]) {
      const key = measureKey(renovation.id);
      if (key) tracker.track('renovation_measure_confirmed', key);
    }
  }
  tracker.track('step_completed', stepId);
  if (step === Step.Renovation) {
    tracker.track('step_completed', 'results');
    tracker.track('tool_completed');
  }
}

export function trackPdfDownloaded(): void {
  tracker.track('pdf_downloaded', 'energy_report_pdf');
  tracker.track('step_completed', 'pdf_export');
}

export function trackContactRequested(): void {
  tracker.track('contact_requested', 'energy_advice_link');
  tracker.track('step_completed', 'consulting_contact');
}

export function trackDonationStarted(): void {
  tracker.track('donation_started');
}

/** Carries no submission data: the deletion token never reaches analytics. */
export function trackDonationCompleted(): void {
  tracker.track('donation_completed');
  tracker.track('step_completed', 'data_donation');
}
