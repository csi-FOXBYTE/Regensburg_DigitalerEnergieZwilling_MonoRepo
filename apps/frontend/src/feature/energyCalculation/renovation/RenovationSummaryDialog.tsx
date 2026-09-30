import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Typography } from '@/components/ui/typography';
import { ListChecks } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RenovationSummaryContent from './RenovationSummaryContent';

function RenovationSummaryDialogContent() {
  const { t } = useTranslation('energyCalculation');

  return (
    <DialogContent className="sm:rounded-dialog top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(88dvh,56rem)] sm:w-[calc(100%-3rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border">
      <DialogHeader className="shrink-0 border-b border-neutral-200 px-4 py-4 pr-16 sm:px-6 sm:py-6 sm:pr-16">
        <div className="flex items-center gap-3">
          <ListChecks
            className="text-primary size-7 shrink-0"
            aria-hidden="true"
          />
          <DialogTitle className="min-w-0 text-(length:--text-h2) leading-(--leading-h2)">
            {t('renovation.summary.title')}
          </DialogTitle>
        </div>
        <DialogDescription>
          {t('renovation.summary.description')}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
        <RenovationSummaryContent />
      </div>

      <div className="bg-background shrink-0 border-t border-neutral-200 px-4 py-3 sm:px-6">
        <Typography variant="verySmall">
          {t('renovation.summary.hint')}
        </Typography>
      </div>
    </DialogContent>
  );
}

/** Read-only overview of the renovation measures selected in step 6. */
export default function RenovationSummaryDialog() {
  const { t } = useTranslation('energyCalculation');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="gap-2">
          <ListChecks className="size-5" aria-hidden="true" />
          {t('renovation.summary.trigger')}
        </Button>
      </DialogTrigger>
      {open && <RenovationSummaryDialogContent />}
    </Dialog>
  );
}
