import type {
  RangeKey,
  Selection,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import type { ParseKeys } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Shown whenever a value is unknown for the selected building. */
export const MISSING_VALUE = '–';

type BooleanLabelKey =
  | `common:${ParseKeys<'common'>}`
  | `energyCalculation:${ParseKeys<'energyCalculation'>}`;

/**
 * Formatting for the read-only building data overview. It mirrors the input
 * widgets and the PDF summary so the same value never looks different in two
 * places.
 */
export function useBuildingDataFormat() {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const language = i18n.language;

    /** Numbers with the unit appended, as the inputs show them as a suffix. */
    const number = (
      value: number | null | undefined,
      decimals: number,
      unit?: string,
    ): string => {
      if (value == null) return MISSING_VALUE;
      const formatted = value.toLocaleString(language, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return unit ? `${formatted} ${unit}` : formatted;
    };

    /** Year bands such as "1958 bis 1968" or "ab 2016". */
    const range = (key: RangeKey | null | undefined): string => {
      if (!key) return MISSING_VALUE;
      const { from, to } = key as { from?: number; to?: number };
      if (from != null && to != null)
        return i18n.t('common:yearRange.between', { from, to });
      if (to != null) return i18n.t('common:yearRange.upTo', { year: to });
      if (from != null) return i18n.t('common:yearRange.from', { year: from });
      return MISSING_VALUE;
    };

    /** Booleans use the same wording as the matching switch in the form. */
    const boolean = (
      value: boolean | null | undefined,
      trueKey: BooleanLabelKey = 'common:yes',
      falseKey: BooleanLabelKey = 'common:no',
    ): string =>
      value == null ? MISSING_VALUE : i18n.t(value ? trueKey : falseKey);

    /** Localized label of a config driven select option. */
    const option = (
      options: Selection[],
      value: string | null | undefined,
    ): string => {
      if (value == null) return MISSING_VALUE;
      const selection = options.find((o) => o.value === value);
      if (!selection) return value;
      return (
        selection.localization[language] ??
        selection.localization[language.split('-')[0]] ??
        selection.localization.en ??
        value
      );
    };

    return { number, range, boolean, option };
  }, [i18n, i18n.language]);
}
