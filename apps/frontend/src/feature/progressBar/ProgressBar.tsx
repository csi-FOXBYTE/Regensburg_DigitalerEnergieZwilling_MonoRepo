import DesktopOnly from '@/components/DesktopOnly';
import MobileOnly from '@/components/MobileOnly';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';
import {
  $maxStepReached,
  $step,
  navigateToStep,
  Step,
} from '@/lib/state/ui/progress';
import { cn } from '@/lib/utils';
import { useStore } from '@nanostores/react';
import { ArrowLeft } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';

type VisualProgressBarProps = {
  step: Step;
  maxStepReached: Step;
};

function MobileProgressBar({ step, maxStepReached }: VisualProgressBarProps) {
  const { t } = useTranslation('progressBar');
  const label = t(`steps.${step}`);
  const maxStepLabel = t(`steps.${maxStepReached}`);

  const stepBack = useCallback(() => {
    navigateToStep(step - 1);
  }, [step]);

  return (
    <nav
      aria-label={t('navigationLabel')}
      className="px-gutter sticky top-0 z-30 flex h-(--nav-height) flex-col justify-between border-t border-neutral-200 py-4"
    >
      <div className="flex gap-3">
        {step > 1 ? (
          <Button
            size="icon"
            variant="elevated"
            className="shadow-none"
            onClick={stepBack}
            aria-label={t('backToPreviousStep')}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
        ) : null}
        <div className="flex flex-col">
          <Typography variant="verySmall">
            {t('mobileStepsIndicator', { step: step, maxSteps: 7 })}
          </Typography>
          <Typography variant="small">{label}</Typography>
        </div>
      </div>
      <button
        type="button"
        disabled={maxStepReached <= step}
        onClick={() => navigateToStep(maxStepReached)}
        aria-label={t('goToStep', {
          step: maxStepReached,
          label: maxStepLabel,
        })}
        className="rounded-badge relative h-2 w-full bg-neutral-200 disabled:cursor-default"
      >
        <div
          className="bg-primary-hover rounded-badge absolute inset-y-0 left-0"
          style={{ width: (maxStepReached / Step.Result) * 100 + '%' }}
        />
        <div
          className="bg-primary rounded-badge absolute inset-y-0 left-0"
          style={{ width: (step / Step.Result) * 100 + '%' }}
        />
      </button>
    </nav>
  );
}

function DesktopTick({
  index,
  step,
  maxStepReached,
  onClick,
  label,
  tooltipLabel,
}: {
  index: number;
  step: number;
  maxStepReached: number;
  onClick: (step: number) => void;
  label: string;
  tooltipLabel: string;
}) {
  const isHighlighted = index <= step;
  const wasReached = index <= maxStepReached;
  const isReachedAhead = index > step && wasReached;
  const isClickable = index !== step && wasReached;

  const clicked = useCallback(() => {
    if (!isClickable) return;
    onClick(index);
  }, [index, isClickable, onClick]);

  const tick = (
    <button
      type="button"
      disabled={!isClickable}
      onClick={clicked}
      aria-label={label}
      className={cn(
        'h-full flex-1 bg-neutral-200',
        isClickable ? 'cursor-pointer' : 'cursor-default',
        isHighlighted && 'bg-primary',
        isReachedAhead && 'bg-primary-hover',
      )}
    />
  );

  if (!wasReached) return tick;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tick}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="bg-background text-foreground max-w-70 rounded px-4 py-3 text-sm leading-relaxed shadow-lg"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}

function DesktopProgressBar({ step, maxStepReached }: VisualProgressBarProps) {
  const { t } = useTranslation('progressBar');

  const label = t(`steps.${step}`);

  const ticks: ReactNode[] = [];
  for (let i = 1; i <= Step.Result; i++) {
    const tickStep = i as Step;
    ticks.push(
      <DesktopTick
        step={step}
        maxStepReached={maxStepReached}
        index={tickStep}
        key={tickStep}
        onClick={navigateToStep}
        label={t('goToStep', {
          step: tickStep,
          label: t(`steps.${tickStep}`),
        })}
        tooltipLabel={t(`steps.${tickStep}`)}
      />,
    );
  }

  return (
    <nav
      aria-label={t('navigationLabel')}
      className="max-w-content mx-auto flex h-(--nav-height) flex-col justify-center gap-1 border-t border-neutral-200"
    >
      <div>
        <Typography variant="h4">
          {step > 0 ? `${step}. ` : ''}
          {label}
        </Typography>
      </div>
      <TooltipProvider>
        <div className={cn('flex h-2 w-full justify-between gap-1')}>
          {ticks}
        </div>
      </TooltipProvider>
    </nav>
  );
}

export default function ProgressBar() {
  const step = useStore($step);
  const maxStepReached = useStore($maxStepReached);

  return (
    <>
      <DesktopOnly>
        <DesktopProgressBar step={step} maxStepReached={maxStepReached} />
      </DesktopOnly>
      <MobileOnly>
        <MobileProgressBar step={step} maxStepReached={maxStepReached} />
      </MobileOnly>
    </>
  );
}
