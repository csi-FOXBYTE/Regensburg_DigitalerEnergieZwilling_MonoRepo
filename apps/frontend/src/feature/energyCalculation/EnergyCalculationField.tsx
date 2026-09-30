import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ParseKeys } from 'i18next';
import { RotateCcw } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export default function EnergyCalculationField({
  children,
  labelKey,
  info,
  error,
  onReset,
  resetDisabled,
  className,
  labelFor,
  labelId,
  errorId,
}: {
  children?: ReactNode;
  labelKey?: ParseKeys<'energyCalculation'>;
  info?: ReactNode;
  error?: ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
  className?: string;
  labelFor?: string;
  labelId?: string;
  errorId?: string;
}) {
  const { t } = useTranslation('energyCalculation');

  return (
    <Field className={className} data-energy-field="">
      {labelKey && (
        <div className="block" data-energy-field-label="">
          {labelFor ? (
            <FieldLabel className="inline" htmlFor={labelFor} id={labelId}>
              {t(labelKey)}
            </FieldLabel>
          ) : (
            <FieldLabel asChild className="inline">
              <span id={labelId}>{t(labelKey)}</span>
            </FieldLabel>
          )}
          {info && (
            <>
              {'\u00a0'}
              <span className="inline-flex align-middle">{info}</span>
            </>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2" data-energy-field-content="">
        <div className="flex w-full items-center gap-2">
          {children}
          {onReset ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={resetDisabled}
                    aria-label={t('common.resetTooltip')}
                    className={
                      resetDisabled
                        ? 'cursor-not-allowed text-neutral-200'
                        : 'text-foreground hover:text-primary cursor-pointer transition-colors'
                    }
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  hideArrow
                  className="bg-background text-foreground border shadow-sm"
                >
                  {t('common.resetTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="size-4 shrink-0" />
          )}
        </div>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </Field>
  );
}
