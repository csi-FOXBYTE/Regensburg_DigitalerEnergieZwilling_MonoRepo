import { type EnergyEfficiencyClass } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import {
  $config,
  $energyEfficiencyClasses,
} from '../../../lib/state/calculation-config';
import { $currentEnergyState } from '../../../lib/state/computed/current-energy-state';
import { $renovatedEnergyState } from '../../../lib/state/computed/renovated-energy-state';

const CHEVRON_CLIP =
  'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)';

function formatRange(
  from: number | undefined,
  to: number | undefined,
  unit: string,
): string {
  if (from == null) return `< ${to} ${unit}`;
  if (to == null) return `> ${from} ${unit}`;
  return `${from} – ${to} ${unit}`;
}

function EnergyClassRow({
  cls,
  color,
  fill,
  rangeText,
  ringClass,
  tooltipText,
  selected,
  badge,
}: {
  cls: string;
  color: string;
  fill: string;
  rangeText: string;
  ringClass: string;
  tooltipText: string;
  selected: boolean;
  badge?: { label: string; bgClass: string; arrow?: 'up' | 'down' };
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={selected ? 0 : undefined}
          className={`group flex items-stretch gap-4 p-2 ring-2 ${ringClass}`}
        >
          <div
            className="flex aspect-[3/2] w-10 shrink-0 items-center justify-center p-1 text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {cls}
          </div>
          <div className="bg-neutral-150 relative flex-1">
            <div
              className={`absolute inset-y-0 left-0 transition-opacity group-hover:opacity-100 ${selected ? 'opacity-80' : 'opacity-40'}`}
              style={{
                clipPath: CHEVRON_CLIP,
                width: fill,
                backgroundColor: color,
              }}
            />
            <div className="relative z-10 flex h-full items-center justify-between pr-2 pl-2">
              <span className="text-sm">{rangeText}</span>
              <div className="flex shrink-0 justify-end">
                {badge && (
                  <span
                    className={`rounded-badge flex items-center gap-0.5 px-2 py-1 text-xs font-bold text-white ${badge.bgClass}`}
                  >
                    {badge.arrow === 'up' && (
                      <ArrowUp className="size-4" aria-hidden="true" />
                    )}
                    {badge.arrow === 'down' && (
                      <ArrowDown className="size-4" aria-hidden="true" />
                    )}
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

export default function EnergyClassBars() {
  const config = useStore($config);
  const effClasses = useStore($energyEfficiencyClasses);
  const current = useStore($currentEnergyState);
  const renovated = useStore($renovatedEnergyState);

  const bands = config.general.energyEfficiencyClasses;
  const steps = bands.length - 1;

  const { t } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  const energyDemandUnit = tCommon('units.kilowattHoursPerSquareMeterPerYear');
  const classIndex = Object.fromEntries(
    bands.map((band, i) => [band.value, i]),
  );
  const beforeClass = current.energyEfficiencyClass;
  const afterClass = renovated.energyEfficiencyClass;
  const same = beforeClass === afterClass;
  const improved = classIndex[afterClass] < classIndex[beforeClass];

  function ringClass(cls: EnergyEfficiencyClass): string {
    if (cls === afterClass) {
      if (same) return 'ring-neutral-850';
      return improved ? 'ring-green-600' : 'ring-red-600';
    }
    if (cls === beforeClass) return 'ring-neutral-850';
    return 'ring-transparent';
  }

  function badge(
    cls: EnergyEfficiencyClass,
  ): { label: string; bgClass: string; arrow?: 'up' | 'down' } | undefined {
    if (cls === afterClass && !same)
      return {
        label: t('stats.afterRenovation'),
        bgClass: improved ? 'bg-green-600' : 'bg-red-600',
        arrow: improved ? 'up' : 'down',
      };
    if (cls === beforeClass)
      return { label: t('stats.beforeRenovation'), bgClass: 'bg-neutral-850' };
    return undefined;
  }

  function tooltipText(cls: EnergyEfficiencyClass, rangeText: string): string {
    const values = { cls, range: rangeText };
    if (cls === afterClass && cls !== beforeClass)
      return t('result.classTooltipAfterRenovation', values);
    if (cls === beforeClass && cls !== afterClass)
      return t('result.classTooltipCurrentState', values);
    return t('result.classTooltip', values);
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1">
        {bands.map((band, i) => {
          const rangeText = formatRange(
            'from' in band ? band.from : undefined,
            'to' in band ? band.to : undefined,
            energyDemandUnit,
          );
          return (
            <EnergyClassRow
              key={band.value}
              cls={band.value}
              color={effClasses.get(band.value)?.color ?? ''}
              fill={`min(100%, calc(160px + ${i} * (100% - 160px) / ${steps}))`}
              rangeText={rangeText}
              ringClass={ringClass(band.value)}
              tooltipText={tooltipText(band.value, rangeText)}
              selected={band.value === beforeClass || band.value === afterClass}
              badge={badge(band.value)}
            />
          );
        })}
      </div>
    </TooltipProvider>
  );
}
