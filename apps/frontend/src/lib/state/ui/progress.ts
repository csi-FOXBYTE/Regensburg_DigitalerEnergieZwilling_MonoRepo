import { atom } from 'nanostores';

export enum Step {
  Welcome = 0,
  Building = 1,
  GeneralData = 2,
  OuterParts = 3,
  Heat = 4,
  Electricity = 5,
  Renovation = 6,
  Result = 7,
}

export const $step = atom<Step>(Step.Welcome);
export const $maxStepReached = atom<Step>(Step.Welcome);

export function setStep(step: Step) {
  if (step > $maxStepReached.get()) {
    $maxStepReached.set(step);
  }
  $step.set(step);
}

export function setMaxStepReached(step: Step) {
  $maxStepReached.set(step);
}

export function navigateToStep(target: Step) {
  const current = $step.get();
  if (target === current) return;

  if (target > current) {
    setStep(target);
    for (let s = current + 1; s <= target; s++) {
      history.pushState({ step: s }, '');
    }
  } else {
    // Don't setStep here — let popstate handle it so the handler can
    // read the pre-navigation step and kill forward history when crossing step < 2.
    history.go(target - current);
  }
}
