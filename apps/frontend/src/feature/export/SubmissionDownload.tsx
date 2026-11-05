import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import {
  downloadSubmission,
  type SubmissionDownload as Download,
  SubmissionUnavailableError,
} from '@/lib/api/public';
import { useCapabilityLink } from '@/hooks/useCapabilityLink';
import { downloadJson } from '@/lib/downloadJson';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type State = 'loading' | 'ready' | 'unavailable' | 'service-error';

type PageProps = { locale: 'de' | 'en'; token: string | null };

/** Target of the JSON link in the PDF report (`/<locale>/download#<token>`). */
export default function SubmissionDownload() {
  const { locale, token } = useCapabilityLink('download');
  // Another link pasted into the same tab starts over with fresh state.
  return (
    <SubmissionDownloadPage key={token ?? ''} locale={locale} token={token} />
  );
}

function SubmissionDownloadPage({ locale, token }: PageProps) {
  const { t } = useTranslation('map');
  const [state, setState] = useState<State>(token ? 'loading' : 'unavailable');
  const [download, setDownload] = useState<Download | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setState('loading');
    try {
      setDownload(await downloadSubmission(token));
      setState('ready');
    } catch (error) {
      setState(
        error instanceof SubmissionUnavailableError
          ? 'unavailable'
          : 'service-error',
      );
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function saveFile() {
    if (download) downloadJson(download.data, download.filename);
  }

  const openApplication = (
    <Button asChild variant={state === 'ready' ? 'secondary' : 'primary'}>
      <a href={`/${locale}`}>{t('submissionDownload.openApplication')}</a>
    </Button>
  );

  if (state === 'loading') {
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
            {t('submissionDownload.loadingTitle')}
          </Typography>
          <Typography variant="muted">
            {t('submissionDownload.loadingDescription')}
          </Typography>
        </div>
      </main>
    );
  }

  const content = {
    ready: {
      title: t('submissionDownload.readyTitle'),
      description: t('submissionDownload.readyDescription'),
      variant: 'info' as const,
    },
    unavailable: {
      title: t('submissionDownload.unavailableTitle'),
      description: t('submissionDownload.unavailableDescription'),
      variant: 'warning' as const,
    },
    'service-error': {
      title: t('submissionDownload.serviceErrorTitle'),
      description: t('submissionDownload.serviceErrorDescription'),
      variant: 'danger' as const,
    },
  }[state];

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="sr-only">{content.title}</h1>
      <div className="flex w-full max-w-md flex-col gap-5 text-center">
        <Callout variant={content.variant} size="large" title={content.title}>
          {content.description}
        </Callout>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {state === 'ready' && (
            <Button variant="primary" onClick={saveFile}>
              {t('submissionDownload.downloadButton')}
            </Button>
          )}
          {state === 'service-error' && (
            <Button variant="secondary" onClick={load}>
              {t('submissionDownload.retryButton')}
            </Button>
          )}
          {openApplication}
        </div>
      </div>
    </main>
  );
}
