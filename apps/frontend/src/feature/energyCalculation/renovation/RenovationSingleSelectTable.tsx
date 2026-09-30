import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoTooltipButton } from '../InfoButton';
import { RenovationRow } from './RenovationRow';
import { RenovationTableHead } from './RenovationTableHead';
import { useRenovationColumns } from './renovationColumns';

export type RenovationSingleSelectTableProps = {
  renovations: Renovation[];
  value: Renovation[];
  onSelectionChange: (selected: Renovation[]) => void;
  baseInput: DETInput;
  config: DETConfig;
  noMeasureTooltip?: string;
};

const NONE = '__none__';

export function RenovationSingleSelectTable({
  renovations,
  value,
  onSelectionChange,
  baseInput,
  config,
  noMeasureTooltip,
}: RenovationSingleSelectTableProps) {
  const { t } = useTranslation('energyCalculation');
  const selectedId = value.length > 0 ? value[0].id : NONE;

  const handleChange = (id: string) => {
    onSelectionChange(
      id === NONE ? [] : renovations.filter((r) => r.id === id),
    );
  };

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
    state: { sorting },
    onSortingChange: setSorting,
    // Erster Klick sortiert immer aufsteigend - TanStack wuerde bei
    // numerischen Spalten sonst mit absteigend anfangen.
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <RadioGroup value={selectedId} onValueChange={handleChange}>
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
                    <RadioGroupItem
                      value={row.id}
                      aria-label={row.original.label}
                      className="size-5 border-2 border-neutral-550"
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
            <RenovationRow
              selectionCell={
                <RadioGroupItem
                  value={NONE}
                  aria-label={t('renovation.table.noMeasure')}
                  className="size-5 border-2 border-neutral-550"
                />
              }
              label={t('renovation.table.noMeasure')}
              energyDelta={0}
              savings={0}
              info={
                noMeasureTooltip ? (
                  <InfoTooltipButton content={noMeasureTooltip} />
                ) : undefined
              }
            />
          </tbody>
        </table>
      </div>
    </RadioGroup>
  );
}
