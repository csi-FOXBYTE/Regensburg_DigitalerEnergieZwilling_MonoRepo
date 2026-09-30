import { atom } from 'nanostores';
import { consent, type Choices } from './state';

export type ConsentView = 'pending' | 'closed' | 'initial' | 'settings';
export const $consentView = atom<ConsentView>('pending');
export const $consentDraft = atom<Choices>({ functional: false });
export const $calculatorReady = atom(false);
export const $resumePending = atom(true);
export const $automaticDialog = atom<'mapHelp' | 'methodology' | null>(null);

export function initializeConsentDialog(autoPrompt: boolean): void {
  consent.refresh();
  if ($consentView.get() === 'pending') {
    $consentView.set(
      autoPrompt && !consent.$decision.get() ? 'initial' : 'closed',
    );
  }
}

export function openConsentSettings(): void {
  consent.refresh();
  $consentDraft.set({ functional: consent.allows('functional') });
  $consentView.set('settings');
}

export function dismissConsentDialog(): void {
  $consentDraft.set({ functional: consent.allows('functional') });
  $consentView.set('closed');
}

export function confirmConsent(choices: Choices): void {
  consent.commit(choices);
  dismissConsentDialog();
}
