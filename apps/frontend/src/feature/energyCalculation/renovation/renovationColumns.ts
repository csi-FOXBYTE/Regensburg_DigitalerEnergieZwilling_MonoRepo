import { type Renovation } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import type { ColumnDef, SortingFn } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const RENOVATION_COLUMNS = {
  measure: 'measure',
  energyPotential: 'energyPotential',
  savings: 'savings',
} as const;

export type RenovationDeltaMap = Record<string, number>;

/**
 * Sortiert auf der Zahlengeraden: -500 < -20 < 0 < 30. Wichtig, weil die
 * Potenziale Deltas sind - eine Sortierung nach Betrag wuerde die groessten
 * Einsparungen und die groessten Verschlechterungen nebeneinander legen.
 * TanStacks Default (`alphanumeric`) macht genau das bei gemischten Werten.
 */
const signedNumericSort: SortingFn<Renovation> = (rowA, rowB, columnId) =>
  (rowA.getValue<number>(columnId) ?? 0) - (rowB.getValue<number>(columnId) ?? 0);

/**
 * Die Tabellen rendern ihre Zellen selbst (eine Flex-Zelle statt echter
 * Spalten), deshalb haben diese Spalten kein `cell` - sie existieren nur,
 * damit TanStack sortieren kann.
 */
export function useRenovationColumns(
  energyMap: RenovationDeltaMap,
  savingsMap: RenovationDeltaMap,
) {
  const { i18n } = useTranslation('energyCalculation');
  const language = i18n.language;

  return useMemo<ColumnDef<Renovation>[]>(
    () => [
      {
        id: RENOVATION_COLUMNS.measure,
        accessorFn: (row) => row.label,
        sortingFn: (rowA, rowB) =>
          rowA.original.label.localeCompare(rowB.original.label, language, {
            sensitivity: 'base',
            numeric: true,
          }),
      },
      {
        id: RENOVATION_COLUMNS.energyPotential,
        accessorFn: (row) => energyMap[row.id] ?? 0,
        sortingFn: signedNumericSort,
      },
      {
        id: RENOVATION_COLUMNS.savings,
        accessorFn: (row) => savingsMap[row.id] ?? 0,
        sortingFn: signedNumericSort,
      },
    ],
    [energyMap, savingsMap, language],
  );
}
