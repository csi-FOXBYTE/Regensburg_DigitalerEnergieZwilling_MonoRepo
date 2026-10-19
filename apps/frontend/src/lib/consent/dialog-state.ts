import { atom } from 'nanostores';
import { consent, type Choices } from './state';

export type ConsentView = 'pending' | 'closed' | 'initial' | 'settings';
export const $consentView = atom<ConsentView>('pending');
export const $consentDraft = atom<Choices>({
  functional: false,
  analytics: false,
});
export const $calculatorReady = atom(false);
export const $resumePending = atom(true);
export const $automaticDialog = atom<'mapHelp' | 'methodology' | null>(null);

const committedChoices = (): Choices => ({
  functional: consent.allows('functional'),
  analytics: consent.allows('analytics'),
});

/** Call once the offered purposes are known; a decision predating one asks again. */
export function initializeConsentDialog(autoPrompt: boolean): void {
  consent.refresh();
  if ($consentView.get() === 'pending') {
    $consentView.set(
      autoPrompt && consent.needsDecision() ? 'initial' : 'closed',
    );
  }
}

export function openConsentSettings(): void {
  consent.refresh();
  $consentDraft.set(committedChoices());
  $consentView.set('settings');
}

export function dismissConsentDialog(): void {
  $consentDraft.set(committedChoices());
  $consentView.set('closed');
}

export function confirmConsent(choices: Partial<Choices>): void {
  consent.commit(choices);
  dismissConsentDialog();
}
