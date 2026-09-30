import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FieldStore } from '@/lib/field-store';
import { cn } from '@/lib/utils';
import { useStore } from '@nanostores/react';
import type { Namespace, ParseKeys } from 'i18next';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import EnergyCalculationField from './EnergyCalculationField';

type BooleanLabel<NS extends Namespace> = {
  ns?: NS;
  key: ParseKeys<NS>;
};

type EnergyBooleanInputProps<TNS extends Namespace, FNS extends Namespace> = {
  field: FieldStore<boolean | undefined>;
  labelKey?: ParseKeys<'energyCalculation'>;
  info?: ReactNode;
  className?: string;
  trueKey?: BooleanLabel<TNS>;
  falseKey?: BooleanLabel<FNS>;
};

export default function EnergyBooleanInput<
  TNS extends Namespace = 'common',
  FNS extends Namespace = 'common',
>({
  field,
  labelKey,
  info,
  className,
  trueKey,
  falseKey,
}: EnergyBooleanInputProps<TNS, FNS>) {
  const { t } = useTranslation('common');
  const value = useStore(field.$store);
  const placeholder = useStore(field.$placeholder);
  const id = useId();
  const { t: trueT } = useTranslation(trueKey ? trueKey.ns : 'common');
  const { t: falseT } = useTranslation(falseKey ? falseKey.ns : 'common');

  const isPlaceholder = value == null;
  const fakeChecked =
    'border-primary bg-background before:absolute before:top-1/2 before:left-1/2 before:size-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-primary';

  // @ts-expect-error key is constrained by BooleanLabel<TNS> at the call site
  const trueLabel: string = trueKey ? trueT(trueKey.key) : t('yes');
  // @ts-expect-error key is constrained by BooleanLabel<FNS> at the call site
  const falseLabel: string = falseKey ? falseT(falseKey.key) : t('no');

  return (
    <EnergyCalculationField
      labelKey={labelKey}
      info={info}
      onReset={field.resettable ? () => field.setValue(undefined) : undefined}
      resetDisabled={value === undefined}
      className={className}
      labelId={`${id}-label`}
    >
      <RadioGroup
        value={value != null ? String(value) : ''}
        onValueChange={(v) => field.setValue(v === 'true')}
        aria-labelledby={labelKey ? `${id}-label` : undefined}
        className="flex flex-row gap-4 pt-1"
      >
        <Label
          htmlFor={`${id}-true`}
          className={cn(
            'text-base font-normal',
            isPlaceholder && placeholder === true && 'italic',
          )}
        >
          <RadioGroupItem
            value="true"
            id={`${id}-true`}
            className={cn(isPlaceholder && placeholder === true && fakeChecked)}
          />
          {trueLabel}
        </Label>
        <Label
          htmlFor={`${id}-false`}
          className={cn(
            'text-base font-normal',
            isPlaceholder && placeholder === false && 'italic',
          )}
        >
          <RadioGroupItem
            value="false"
            id={`${id}-false`}
            className={cn(
              isPlaceholder && placeholder === false && fakeChecked,
            )}
          />
          {falseLabel}
        </Label>
      </RadioGroup>
    </EnergyCalculationField>
  );
}
