import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Energie- und Sparpotenzial sind Flex-Spans in einer einzigen Tabellenzelle,
 * keine echten Spalten - ohne feste Breite bestimmt jede Zeile ihre eigene und
 * nichts fluchtet untereinander. Header, Zeilen und Summenzeile teilen sich
 * deshalb diese Breite. Ab `sm`, darunter wird ohnehin untereinander gestapelt.
 */
export const renovationValueColumn = 'sm:w-44 sm:shrink-0';

export type RenovationRowProps = {
  selectionCell: ReactNode;
  label: string;
  energyDelta: number;
  savings: number;
  recommended?: boolean;
  info?: ReactNode;
};

function formatSavings(savings: number) {
  return savings.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  });
}

function formatEnergy(energyDelta: number) {
  return energyDelta.toLocaleString('de-DE', {
    maximumFractionDigits: 0,
    signDisplay: 'always',
  });
}

function deltaColorClass(delta: number) {
  return delta < 0
    ? 'text-green-600'
    : delta > 0
      ? 'text-red-600'
      : 'text-muted-foreground';
}

export function RenovationRow({
  selectionCell,
  label,
  energyDelta,
  savings,
  recommended,
  info,
}: RenovationRowProps) {
  const { t } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');

  return (
    <tr className="border-t border-neutral-200 text-base">
      <td className="w-8 px-4 py-4 align-middle">{selectionCell}</td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <span className="leading-snug">
              {label}
              {info && (
                <>
                  {'\u00a0'}
                  <span className="inline-flex align-middle">{info}</span>
                </>
              )}
            </span>
            {recommended && (
              <Badge className="border-green-600 bg-green-600/10 text-green-600">
                {t('renovation.recommended')}
              </Badge>
            )}
          </span>
          <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span
              className={`whitespace-nowrap sm:text-right ${renovationValueColumn} ${deltaColorClass(energyDelta)}`}
            >
              {formatEnergy(energyDelta)}{' '}
              {tCommon('units.kilowattHoursPerYear')}
            </span>
            <span
              className={`whitespace-nowrap sm:text-right ${renovationValueColumn} ${deltaColorClass(savings)}`}
            >
              {formatSavings(savings)} {tCommon('units.eurosPerYear')}
            </span>
          </span>
        </div>
      </td>
    </tr>
  );
}
