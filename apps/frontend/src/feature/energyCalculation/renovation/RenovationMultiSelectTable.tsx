import { Checkbox } from '@/components/ui/checkbox';
import {
  applyRenovation,
  calculate,
  type DETConfig,
  type DETInput,
  type Renovation,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoTooltipButton } from '../InfoButton';
import { RenovationRow, renovationValueColumn } from './RenovationRow';
import { RenovationTableHead } from './RenovationTableHead';
import { useRenovationColumns } from './renovationColumns';

export type RenovationMultiSelectTableProps = {
  renovations: Renovation[];
  value: Renovation[];
  onSelectionChange: (selected: Renovation[]) => void;
  baseInput: DETInput;
  config: DETConfig;
};

export function RenovationMultiSelectTable({
  renovations,
  value,
  onSelectionChange,
  baseInput,
  config,
}: RenovationMultiSelectTableProps) {
  const { t } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(value.map((r) => [r.id, true])),
    [value],
  );

  const baseResult = useMemo(
    () => calculate(config, baseInput),
    [config, baseInput],
  );
  const baseCost = baseResult.yearlyCost;
  const baseEnergy = baseResult.annualTotalEnergyDemand;

  const savingsMap = useMemo(
    () =>
      Object.fromEntries(
        renovations.map((r) => [
          r.id,
          calculate(config, applyRenovation(baseInput, r)).yearlyCost -
            baseCost,
        ]),
      ),
    [config, baseInput, renovations, baseCost],
  );

  const energyMap = useMemo(
    () =>
      Object.fromEntries(
        renovations.map((r) => [
          r.id,
          calculate(config, applyRenovation(baseInput, r))
            .annualTotalEnergyDemand - baseEnergy,
        ]),
      ),
    [config, baseInput, renovations, baseEnergy],
  );

  const columns = useRenovationColumns(energyMap, savingsMap);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: renovations,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      onSelectionChange(renovations.filter((r) => next[r.id]));
    },
    onSortingChange: setSorting,
    // Erster Klick sortiert immer aufsteigend - TanStack wuerde bei
    // numerischen Spalten sonst mit absteigend anfangen.
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedSavings = useMemo(() => {
    if (value.length === 0) return 0;
    return (
      calculate(config, applyRenovation(baseInput, value)).yearlyCost - baseCost
    );
  }, [config, baseInput, value, baseCost]);

  const selectedEnergy = useMemo(() => {
    if (value.length === 0) return 0;
    return (
      calculate(config, applyRenovation(baseInput, value))
        .annualTotalEnergyDemand - baseEnergy
    );
  }, [config, baseInput, value, baseEnergy]);

  const deltaColorClass = (delta: number) =>
    delta < 0
      ? 'text-green-600'
      : delta > 0
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse border border-neutral-200 text-sm">
        <RenovationTableHead table={table} />
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const tooltipText = (t as (key: string, opts: object) => string)(
              `renovation.tooltips.${row.id}`,
              { defaultValue: '' },
            );
            return (
              <RenovationRow
                key={row.id}
                selectionCell={
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={() => row.toggleSelected()}
                    aria-label={row.original.label}
                    className="border-neutral-550 size-5 border-2"
                  />
                }
                label={row.original.label}
                energyDelta={energyMap[row.id] ?? 0}
                savings={savingsMap[row.id] ?? 0}
                recommended={row.original.recommended}
                info={
                  tooltipText ? (
                    <InfoTooltipButton content={tooltipText} />
                  ) : undefined
                }
              />
            );
          })}
        </tbody>
        {renovations.length > 1 && (
          <tfoot>
            <tr className="bg-neutral-150 border-t border-neutral-200 text-base">
              <td />
              <td className="px-4 py-4 font-medium">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span>{t('renovation.table.total')}</span>
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span
                      className={`whitespace-nowrap sm:text-right ${renovationValueColumn} ${deltaColorClass(selectedEnergy)}`}
                    >
                      {selectedEnergy.toLocaleString('de-DE', {
                        maximumFractionDigits: 0,
                        signDisplay: 'always',
                      })}{' '}
                      {tCommon('units.kilowattHoursPerYear')}
                    </span>
                    <span
                      className={`whitespace-nowrap sm:text-right ${renovationValueColumn} ${deltaColorClass(selectedSavings)}`}
                    >
                      {selectedSavings.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        signDisplay: 'always',
                      })}{' '}
                      {tCommon('units.eurosPerYear')}
                    </span>
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
