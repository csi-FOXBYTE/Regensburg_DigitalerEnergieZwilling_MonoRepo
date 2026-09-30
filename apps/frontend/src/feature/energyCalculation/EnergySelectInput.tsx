import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldStore } from '@/lib/field-store';
import { cn } from '@/lib/utils';
import {
  formatRangeLabel,
  rangeKeyEquals,
  type RangeBandOption,
} from '@/lib/yearHelper/rangeBandOptions';
import type {
  RangeKey,
  Selection,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import type { ParseKeys } from 'i18next';
import type { ReadableAtom } from 'nanostores';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import EnergyCalculationField from './EnergyCalculationField';

type BaseProps<T> = {
  field: FieldStore<T | undefined>;
  labelKey?: ParseKeys<'energyCalculation'>;
  info?: ReactNode;
  options: Array<{ value: T; label: string }>;
  isEqual?: (a: T, b: T) => boolean;
  disabled?: boolean;
  className?: string;
  /** Sortiert die Einträge nach Label; ohne den Prop bleibt die Reihenfolge der Config. */
  sortAlphabetically?: boolean;
};

function EnergySelectInputBase<T>({
  field,
  labelKey,
  info,
  options,
  isEqual = Object.is,
  disabled,
  className,
  sortAlphabetically = false,
}: BaseProps<T>) {
  const triggerId = useId();
  const { i18n } = useTranslation();
  const value = useStore(field.$store);
  const placeholder = useStore(field.$placeholder);
  // Der Select-Value ist der Listenindex, deshalb muss ab hier durchgehend
  // dieselbe (ggf. sortierte) Liste verwendet werden.
  const items = sortAlphabetically
    ? [...options].sort((a, b) => a.label.localeCompare(b.label, i18n.language))
    : options;
  const currentIndex = value != null
    ? items.findIndex((o) => isEqual(o.value, value))
    : -1;
  const placeholderLabel = placeholder != null
    ? items.find((o) => isEqual(o.value, placeholder))?.label
    : undefined;
  // Keep the overhang of the final italic glyph inside the trigger's clipping area.
  const paddedPlaceholder = placeholderLabel != null
    ? `${placeholderLabel}\u2009`
    : undefined;

  return (
    <EnergyCalculationField
      labelKey={labelKey}
      info={info}
      onReset={field.resettable ? () => field.setValue(undefined) : undefined}
      resetDisabled={!value || !!disabled}
      className={className}
      labelFor={triggerId}
    >
      <Select
        value={currentIndex >= 0 ? String(currentIndex) : ''}
        onValueChange={(v) => field.setValue(items[Number(v)].value)}
        disabled={disabled}
      >
        <SelectTrigger
          id={triggerId}
          className={cn(
            'data-placeholder:italic',
            value != null && 'border-neutral-450',
          )}
        >
          <SelectValue placeholder={paddedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((option, index) => (
            <SelectItem key={index} value={String(index)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </EnergyCalculationField>
  );
}

function EnergySelectInputSelectionPreprocessor<T extends string>({
  selectionStore,
  ...baseProps
}: Omit<BaseProps<T>, 'options' | 'isEqual'> & {
  selectionStore: ReadableAtom<Selection[]>;
}) {
  const { i18n } = useTranslation();
  const selections = useStore(selectionStore);
  const options = selections.map((s) => ({
    value: s.value as T,
    label: s.localization[i18n.language] ?? s.localization['en'] ?? s.value,
  }));

  return (
    <EnergySelectInputBase
      {...baseProps}
      options={options}
      disabled={selections.length === 1}
    />
  );
}

function EnergySelectInputRangeBandPreprocessor({
  rangeBandStore,
  ...baseProps
}: Omit<BaseProps<RangeKey>, 'options' | 'isEqual'> & {
  rangeBandStore: ReadableAtom<RangeBandOption[]>;
}) {
  const { t } = useTranslation('common');
  const rawOptions = useStore(rangeBandStore);
  const options = rawOptions.map((o) => ({ ...o, label: formatRangeLabel(o.value, t) }));

  return (
    <EnergySelectInputBase
      {...baseProps}
      options={options}
      isEqual={rangeKeyEquals}
      disabled={options.length === 1}
    />
  );
}

type EnergySelectInputProps<T extends string> =
  | (Omit<BaseProps<T>, 'isEqual'> & { selectionStore?: never; rangeBandStore?: never })
  | (Omit<BaseProps<T>, 'options' | 'isEqual'> & {
      selectionStore: ReadableAtom<Selection[]>;
      options?: never;
      rangeBandStore?: never;
    })
  | (Omit<BaseProps<RangeKey>, 'options' | 'isEqual'> & {
      rangeBandStore: ReadableAtom<RangeBandOption[]>;
      options?: never;
      selectionStore?: never;
    });

export default function EnergySelectInput<T extends string>(
  props: EnergySelectInputProps<T>,
) {
  if (props.rangeBandStore != null) {
    const { rangeBandStore, ...rest } = props;
    return (
      <EnergySelectInputRangeBandPreprocessor
        rangeBandStore={rangeBandStore}
        {...(rest as Omit<BaseProps<RangeKey>, 'options' | 'isEqual'>)}
      />
    );
  }
  if (props.selectionStore != null) {
    const { selectionStore, ...rest } = props;
    return (
      <EnergySelectInputSelectionPreprocessor
        selectionStore={selectionStore}
        {...rest}
      />
    );
  }
  const { options, ...rest } = props;
  return <EnergySelectInputBase options={options} {...(rest as Omit<BaseProps<T>, 'options' | 'isEqual'>)} />;
}
