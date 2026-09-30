import { useStore } from '@nanostores/react';
import {
  $consentView,
  $resumePending,
  $calculatorReady,
} from '@/lib/consent/dialog-state';
import { consent } from '@/lib/consent/state';
import { $building } from '@/lib/state/building';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SavedSession } from '@/lib/state/session';
import {
  consumeInvalidExternalTargetWarning,
  externalTargetSuppressesSessionResume,
} from '@/lib/state/external-building-target';
import {
  clearLastActive,
  consumeLinkRestoreError,
  getLastActiveSession,
  loadSession,
  wasRestoredFromLink,
} from '@/lib/state/session';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function SessionResumeDialog() {
  const { t } = useTranslation('map');
  const consentView = useStore($consentView);
  const decision = useStore(consent.$decision);
  const ready = useStore($calculatorReady);
  const building = useStore($building);
  const handled = useRef(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    if (!ready || consentView !== 'closed') return;
    if (consumeLinkRestoreError()) {
      toast.error(t('sessionResumeDialog.linkRestoreError'));
    }
    if (consumeInvalidExternalTargetWarning()) {
      toast.warning(t('externalBuildingLink.invalidWarning'));
    }
    if (
      handled.current ||
      building ||
      wasRestoredFromLink() ||
      externalTargetSuppressesSessionResume()
    ) {
      setOpen(false);
      $resumePending.set(false);
      return;
    }
    const s = getLastActiveSession();
    if (s) {
      setSession(s);
      setOpen(true);
      $resumePending.set(true);
    } else {
      setOpen(false);
      $resumePending.set(false);
    }
  }, [t, consentView, decision, ready, building]);

  const handleContinue = () => {
    if (!session) return;
    loadSession(session.building.id);
    handled.current = true;
    setOpen(false);
    $resumePending.set(false);
  };

  const handleDismiss = () => {
    clearLastActive();
    handled.current = true;
    setOpen(false);
    $resumePending.set(false);
  };

  return (
    <Dialog
      open={open && consentView === 'closed'}
      onOpenChange={(next) => {
        if (!next) handleDismiss();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('sessionResumeDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('sessionResumeDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={handleDismiss}>
            {t('sessionResumeDialog.dismissButton')}
          </Button>
          <Button onClick={handleContinue}>
            {t('sessionResumeDialog.continueButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
