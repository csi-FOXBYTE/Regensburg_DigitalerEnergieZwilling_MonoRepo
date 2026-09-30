import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Typography, typographyVariants } from '@/components/ui/typography';
import { consent, purposes } from '@/lib/consent/state';
import {
  $consentDraft,
  $consentView,
  confirmConsent,
  dismissConsentDialog,
  initializeConsentDialog,
  openConsentSettings,
} from '@/lib/consent/dialog-state';
// Load the shared grant/withdrawal effects on legal pages as well.
import '@/lib/state/session/storage';
import type { Locale } from '@/i18n/config';

export default function ConsentDialog({
  autoPrompt = false,
  locale,
}: {
  autoPrompt?: boolean;
  locale: Locale;
}) {
  const { t } = useTranslation('common');
  const view = useStore($consentView);
  const draft = useStore($consentDraft);
  const storageError = useStore(consent.$storageError);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const fromFooter = useRef(false);
  const settings = view === 'settings';
  const open = settings || view === 'initial';

  const errorNotice =
    storageError && !errorDismissed ? (
      <div role="status" className="text-foreground border bg-white p-4">
        <Typography>{t('consent.storageError')}</Typography>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => setErrorDismissed(true)}
        >
          {t('close')}
        </Button>
      </div>
    ) : null;

  useEffect(() => {
    initializeConsentDialog(autoPrompt);
  }, [autoPrompt]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="hover:text-primary cursor-pointer border-0 bg-transparent p-0 transition-colors"
        onClick={() => {
          fromFooter.current = true;
          openConsentSettings();
        }}
      >
        {t('footer.cookieSettings')}
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) dismissConsentDialog();
        }}
      >
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white sm:max-w-xl"
          onCloseAutoFocus={(event) => {
            if (fromFooter.current) {
              event.preventDefault();
              trigger.current?.focus();
              fromFooter.current = false;
            }
          }}
        >
          <DialogHeader>
            <DialogTitle
              className={typographyVariants({
                variant: 'h3',
                className: 'pr-8 font-bold',
              })}
            >
              {t(settings ? 'consent.settingsTitle' : 'consent.title')}
            </DialogTitle>
            <DialogDescription
              className={typographyVariants({ variant: 'body' })}
            >
              {t(
                settings
                  ? 'consent.settingsDescription'
                  : 'consent.description',
              )}
            </DialogDescription>
          </DialogHeader>
          {settings ? (
            <div className="mx-3 border-b border-neutral-200">
              <section className="border-t border-neutral-200 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography as="h3" className="font-bold">
                    {t('consent.necessary')}
                  </Typography>
                  <Typography
                    as="span"
                    variant="small"
                    className="rounded-full bg-neutral-100 px-2 py-1"
                  >
                    {t('consent.alwaysActive')}
                  </Typography>
                </div>
                <Typography variant="small" className="mt-2">
                  {t('consent.necessaryDescription')}
                </Typography>
              </section>
              {purposes.map(({ id }) => (
                <section key={id} className="border-t border-neutral-200 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor={`consent-${id}`} className="font-bold">
                      {t(`consent.${id}`)}
                    </label>
                    <Switch
                      id={`consent-${id}`}
                      aria-describedby={`consent-${id}-description`}
                      checked={draft[id]}
                      onCheckedChange={(checked) =>
                        $consentDraft.set({ ...draft, [id]: checked })
                      }
                    />
                  </div>
                  <Typography
                    id={`consent-${id}-description`}
                    variant="small"
                    className="mt-2"
                  >
                    {t(`consent.${id}Description`)}
                  </Typography>
                </section>
              ))}
            </div>
          ) : (
            <Typography className="border-l-2 pl-4">
              {t('consent.support')}
            </Typography>
          )}
          <Typography>{t('consent.memoryOnly')}</Typography>
          <div className="grid gap-2">
            <Button
              onClick={() =>
                confirmConsent(settings ? draft : { functional: true })
              }
            >
              {t(settings ? 'consent.save' : 'consent.allow')}
            </Button>
            <Button onClick={() => confirmConsent({ functional: false })}>
              {t('consent.decline')}
            </Button>
            {!settings && (
              <Button variant="secondary" onClick={openConsentSettings}>
                {t('consent.settings')}
              </Button>
            )}
          </div>
          <nav
            className="flex justify-center gap-4"
            aria-label={t('footer.navigationLabel')}
          >
            <a
              className="text-foreground underline"
              href={`/${locale}/privacy`}
            >
              {t('consent.privacy')}
            </a>
            <a
              className="text-foreground underline"
              href={`/${locale}/imprint`}
            >
              {t('consent.imprint')}
            </a>
          </nav>
          {errorNotice}
        </DialogContent>
      </Dialog>
      {!open && errorNotice && (
        <div className="fixed right-4 bottom-4 z-[60] max-w-sm shadow-lg">
          {errorNotice}
        </div>
      )}
    </>
  );
}
