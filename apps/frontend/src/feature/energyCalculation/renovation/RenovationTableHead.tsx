import { type Renovation } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import type { Column, Table } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import { renovationValueColumn } from './RenovationRow';
import { RENOVATION_COLUMNS } from './renovationColumns';

function SortButton({
  column,
  label,
  className = '',
}: {
  column?: Column<Renovation, unknown>;
  label: string;
  className?: string;
}) {
  const { t } = useTranslation('energyCalculation');

  if (!column) return <span className={className}>{label}</span>;

  const sorted = column.getIsSorted();
  const Icon =
    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      aria-label={t('renovation.table.sortBy', { column: label })}
      className={`hover:text-foreground focus-visible:ring-ring inline-flex cursor-pointer items-center gap-1 whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none ${className}`}
    >
      <Typography>{label}</Typography>
      <Icon
        className={`size-5 ${sorted ? 'text-foreground' : 'text-muted-foreground'}`}
        aria-hidden="true"
      />
    </button>
  );
}

export function RenovationTableHead({ table }: { table: Table<Renovation> }) {
  const { t } = useTranslation('energyCalculation');

  return (
    <thead>
      <tr className="bg-neutral-150">
        <th scope="col" className="w-8">
          <span className="sr-only">{t('renovation.table.selection')}</span>
        </th>
        <th scope="col" className="px-4 py-3 font-medium">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <SortButton
              column={table.getColumn(RENOVATION_COLUMNS.measure)}
              label={t('renovation.table.measure')}
            />
            <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <SortButton
                column={table.getColumn(RENOVATION_COLUMNS.energyPotential)}
                label={t('renovation.table.energyPotential')}
                className={`${renovationValueColumn} sm:justify-end`}
              />
              <SortButton
                column={table.getColumn(RENOVATION_COLUMNS.savings)}
                label={t('renovation.table.savings')}
                className={`${renovationValueColumn} sm:justify-end`}
              />
            </span>
          </div>
        </th>
      </tr>
    </thead>
  );
}
