import { useStore } from '@nanostores/react';
import { atom, type ReadableAtom } from 'nanostores';
import type { ParseKeys } from 'i18next';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowIcon from '../../components/ArrowIcon';
import { Button } from '../../components/ui/button';
import { $step, navigateToStep, Step } from '../../lib/state/ui/progress';

const $alwaysCanProgress = atom(true);

export type ButtonBarProps = {
  backTextKey?: ParseKeys<'energyCalculation'>;
  continueTextKey?: ParseKeys<'energyCalculation'>;
  canProgress?: ReadableAtom<boolean>;
  className?: string;
};

export default function ButtonBar({
  continueTextKey,
  backTextKey,
  canProgress: canProgressStore,
  className,
}: ButtonBarProps) {
  const { t } = useTranslation('energyCalculation');

  const step = useStore($step);
  const canProgress = useStore(canProgressStore ?? $alwaysCanProgress);

  const hasNextStep = step < Step.Result;

  const nextStep = useCallback(() => {
    navigateToStep(step + 1);
  }, [step]);
  const previousStep = useCallback(() => {
    navigateToStep(step - 1);
  }, [step]);

  return (
    <div className={`grid w-full grid-cols-1 gap-2 md:grid-cols-2 ${className ?? ''}`}>
      <Button
        onClick={previousStep}
        className={`w-full ${!hasNextStep ? 'col-span-full' : 'col-span-1'}`}
        variant="secondary"
      >
        {t(backTextKey ?? 'backButton')}
      </Button>
      {hasNextStep && (
        <Button
          onClick={nextStep}
          disabled={!canProgress}
          className="col-span-1 flex w-full gap-2"
          variant="primary"
        >
          {t(continueTextKey ?? 'continueButton')} <ArrowIcon />
        </Button>
      )}
    </div>
  );
}
