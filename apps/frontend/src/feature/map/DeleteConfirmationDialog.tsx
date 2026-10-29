import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import {
  checkSubmissionAvailability,
  deleteSubmission,
  type DeletionReceipt,
  SubmissionUnavailableError,
} from '@/lib/api/public';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCapabilityLink } from '@/hooks/useCapabilityLink';
import { downloadJson } from '@/lib/downloadJson';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type State =
  | 'checking'
  | 'confirmable'
  | 'deleting'
  | 'unavailable'
  | 'deleted'
  | 'cancelled'
  | 'service-error';

type FailedOperation = 'status' | 'delete';

type PageProps = { locale: 'de' | 'en'; token: string | null };

export default function DeleteConfirmationDialog() {
  const { locale, token } = useCapabilityLink('delete');
  // Another link pasted into the same tab starts over with fresh state.
  return (
    <DeleteConfirmationPage key={token ?? ''} locale={locale} token={token} />
  );
}

function DeleteConfirmationPage({ locale, token }: PageProps) {
  const { t } = useTranslation('map');
  const [state, setState] = useState<State>(token ? 'checking' : 'unavailable');
  const [failedOperation, setFailedOperation] =
    useState<FailedOperation>('status');
  const [deletionReceipt, setDeletionReceipt] =
    useState<DeletionReceipt | null>(null);
  const deletionInFlight = useRef(false);

  const checkAvailability = useCallback(async () => {
    if (!token) {
      setState('unavailable');
      return;
    }

    setState('checking');
    try {
      await checkSubmissionAvailability(token);
      setState('confirmable');
    } catch (error) {
      if (error instanceof SubmissionUnavailableError) {
        setState('unavailable');
      } else {
        setFailedOperation('status');
        setState('service-error');
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) void checkAvailability();
  }, [checkAvailability, token]);

  function handleCancel() {
    if (state === 'confirmable') setState('cancelled');
  }

  async function handleConfirm() {
    if (!token || (state !== 'confirmable' && state !== 'service-error')) {
      return;
    }
    if (state === 'service-error' && failedOperation !== 'delete') return;
    if (deletionInFlight.current) return;

    deletionInFlight.current = true;
    setState('deleting');
    try {
      const receipt = await deleteSubmission(token);
      setDeletionReceipt(receipt);
      setState('deleted');
    } catch (error) {
      if (error instanceof SubmissionUnavailableError) {
        setState('unavailable');
      } else {
        setFailedOperation('delete');
        setState('service-error');
      }
    } finally {
      deletionInFlight.current = false;
    }
  }

  const openApplication = (
    <Button asChild>
      <a href={`/${locale}`}>{t('deleteConfirmationDialog.openApplication')}</a>
    </Button>
  );

  function downloadDeletionReceipt() {
    if (!deletionReceipt) return;
    downloadJson(
      deletionReceipt,
      `deletion-receipt-${deletionReceipt.auditEventId}.json`,
    );
  }

  if (state === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div
          className="flex max-w-md flex-col items-center gap-4 text-center"
          role="status"
        >
          <LoaderCircle
            className="text-primary size-8 animate-spin"
            aria-hidden="true"
          />
          <Typography as="h1" variant="h3">
            {t('deleteConfirmationDialog.checkingTitle')}
          </Typography>
          <Typography variant="muted">
            {t('deleteConfirmationDialog.checkingDescription')}
          </Typography>
        </div>
      </main>
    );
  }

  if (state === 'confirmable' || state === 'deleting') {
    return (
      <Dialog open onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmationDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmationDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={state === 'deleting'}
            >
              {t('deleteConfirmationDialog.cancelButton')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={state === 'deleting'}
            >
              {state === 'deleting'
                ? t('deleteConfirmationDialog.deletingButton')
                : t('deleteConfirmationDialog.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (state === 'service-error') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <h1 className="sr-only">
          {t('deleteConfirmationDialog.serviceErrorTitle')}
        </h1>
        <div className="flex w-full max-w-md flex-col gap-5 text-center">
          <Callout
            variant="danger"
            size="large"
            title={t('deleteConfirmationDialog.serviceErrorTitle')}
          >
            {t('deleteConfirmationDialog.serviceErrorDescription')}
          </Callout>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={
                failedOperation === 'status' ? checkAvailability : handleConfirm
              }
            >
              {t('deleteConfirmationDialog.retryButton')}
            </Button>
            {openApplication}
          </div>
        </div>
      </main>
    );
  }

  const terminalContent = {
    unavailable: {
      title: t('deleteConfirmationDialog.unavailableTitle'),
      description: t('deleteConfirmationDialog.unavailableDescription'),
      variant: 'warning' as const,
    },
    deleted: {
      title: t('deleteConfirmationDialog.deletedTitle'),
      description: t('deleteConfirmationDialog.deletedDescription'),
      variant: 'positive' as const,
    },
    cancelled: {
      title: t('deleteConfirmationDialog.cancelledTitle'),
      description: t('deleteConfirmationDialog.cancelledDescription'),
      variant: 'info' as const,
    },
  }[state];

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="sr-only">{terminalContent.title}</h1>
      <div className="flex w-full max-w-md flex-col gap-5 text-center">
        <Callout
          variant={terminalContent.variant}
          size="large"
          title={terminalContent.title}
        >
          {terminalContent.description}
        </Callout>
        {state === 'deleted' && deletionReceipt && (
          <div className="flex flex-col gap-3 rounded-lg border p-4 text-left">
            <Typography variant="muted">
              {t('deleteConfirmationDialog.receiptDescription')}
            </Typography>
            <Typography as="code" variant="small">
              {deletionReceipt.auditEventId}
            </Typography>
            <Button variant="secondary" onClick={downloadDeletionReceipt}>
              {t('deleteConfirmationDialog.downloadReceipt')}
            </Button>
          </div>
        )}
        <div>{openApplication}</div>
      </div>
    </main>
  );
}
