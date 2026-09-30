import { useStore } from '@nanostores/react';
import type { ParseKeys } from 'i18next';
import { ChevronDown, Euro, Leaf, TrendingUp, Zap } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper } from '../../components/ui/paper';
import { Separator } from '../../components/ui/separator';
import { Typography } from '../../components/ui/typography';
import { $currentEnergyState } from '../../lib/state/computed/current-energy-state';
import { primaryEnergyCarrierOptions } from '../../lib/state/inputs/heat';

type StatDetail = {
  label: string;
  value: string;
  unit: string;
};

function CurrentStatsCard({
  value,
  unit,
  titleKey,
  icon,
  details,
  compact = false,
  headingAs,
}: {
  value: string;
  unit?: string;
  titleKey: ParseKeys<'energyCalculation'>;
  icon: ReactNode;
  details?: StatDetail[];
  compact?: boolean;
  headingAs: 'h2' | 'h3';
}) {
  const { t } = useTranslation('energyCalculation');
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  if (compact) {
    return (
      <Paper className="flex flex-col gap-1 p-2" elevation={2}>
        <div className="flex gap-1">
          {icon}
          <Typography as={headingAs} variant="h4" className="text-sm leading-5">
            {t(titleKey)}
          </Typography>
        </div>
        <Typography className="text-lg leading-6 font-bold">
          {value}
          {unit && <span className="ml-1 text-sm">{unit}</span>}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper className="relative flex flex-col gap-2 p-3" elevation={2}>
      <div className="flex gap-2">
        {icon}
        <Typography
          as={headingAs}
          variant="h4"
          className="text-[16px] font-bold"
        >
          {t(titleKey)}
        </Typography>
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Typography variant={'h3'} className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1 text-[30px] font-bold">
            <span>{value}</span>
            {unit && <span className="max-w-full break-words text-base">{unit}</span>}
          </Typography>
          {details && (
            <button
              type="button"
              className="text-neutral-450 hover:text-neutral-650 focus-visible:ring-ring/50 rounded-control absolute right-2 bottom-1 flex w-fit cursor-pointer items-center p-0.5 text-xs focus-visible:ring-2 focus-visible:outline-none"
              aria-expanded={isOpen}
              aria-controls={detailsId}
              aria-label={t(
                isOpen
                  ? 'stats.energyDemandBreakdown.collapse'
                  : 'stats.energyDemandBreakdown.expand',
              )}
              onClick={() => setIsOpen((previous) => !previous)}
            >
              <span className="font-medium">
                {t(
                  isOpen
                    ? 'stats.energyDemandBreakdown.less'
                    : 'stats.energyDemandBreakdown.details',
                )}
              </span>
              <ChevronDown
                className={`ml-0.5 size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
        {details && (
          <div
            id={detailsId}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
            aria-hidden={!isOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-1 flex flex-col gap-2 pb-5">
                <Separator />
                {details.map((detail) => (
                  <div key={detail.label} className="flex flex-col text-sm">
                    <span className="text-neutral-550">{detail.label}</span>
                    <span className="font-bold">
                      {detail.value}
                      <span className="ml-1 text-xs">{detail.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Paper>
  );
}

function calculatePerSquareMeter(
  partialDemand: number,
  totalDemand: number,
  totalPerSquareMeter: number,
) {
  if (totalDemand === 0) return 0;
  return (partialDemand / totalDemand) * totalPerSquareMeter;
}

export default function CurrentStats({
  compact = false,
  embedded = false,
}: {
  compact?: boolean;
  embedded?: boolean;
}) {
  const { t, i18n } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  const currentStats = useStore($currentEnergyState);
  const energyCarrierOptions = useStore(primaryEnergyCarrierOptions);
  const formatValue = (value: number, fractionDigits = 0) =>
    value.toLocaleString('de-DE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  const energyDemandUnit = tCommon('units.kilowattHoursPerSquareMeterPerYear');
  const annualCostsUnit = tCommon('units.eurosPerYear');
  const co2EmissionsUnit = tCommon('units.tonsCo2PerYear');
  const energyCarrier = energyCarrierOptions.find(
    ({ value }) => value === currentStats.energyCarrierType,
  );
  const energyCarrierLabel =
    energyCarrier?.localization[i18n.language] ??
    energyCarrier?.localization[i18n.language.split('-')[0]] ??
    energyCarrier?.localization.en ??
    currentStats.energyCarrierType;
  const energyDemandBreakdown: StatDetail[] = [
    {
      label: t('stats.energyDemandBreakdown.carrierHeating', {
        carrier: energyCarrierLabel,
      }),
      value: formatValue(
        calculatePerSquareMeter(
          currentStats.annualCarrierHeatingEnergyDemand,
          currentStats.annualTotalEnergyDemand,
          currentStats.energyConsumptionPerSquareMeter,
        ),
      ),
      unit: energyDemandUnit,
    },
    {
      label: t('stats.energyDemandBreakdown.electricalHeating'),
      value: formatValue(
        calculatePerSquareMeter(
          currentStats.annualElectricalHeatingEnergyDemand,
          currentStats.annualTotalEnergyDemand,
          currentStats.energyConsumptionPerSquareMeter,
        ),
      ),
      unit: energyDemandUnit,
    },
    {
      label: t('stats.energyDemandBreakdown.householdElectricity'),
      value: formatValue(
        calculatePerSquareMeter(
          currentStats.annualHouseholdElectricalEnergyDemand,
          currentStats.annualTotalEnergyDemand,
          currentStats.energyConsumptionPerSquareMeter,
        ),
      ),
      unit: energyDemandUnit,
    },
  ];

  return (
    <div
      className={
        embedded
          ? 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2'
          : 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4'
      }
    >
      <CurrentStatsCard
        headingAs={embedded ? 'h3' : 'h2'}
        compact={compact}
        value={formatValue(currentStats.energyConsumptionPerSquareMeter)}
        unit={energyDemandUnit}
        titleKey="stats.energyDemand"
        icon={<Zap className="size-5 text-amber-600" aria-hidden="true" />}
        details={energyDemandBreakdown}
      />
      <CurrentStatsCard
        headingAs={embedded ? 'h3' : 'h2'}
        compact={compact}
        value={t('stats.energyEfficiencyValue', {
          value: currentStats.energyEfficiencyClass,
        })}
        titleKey="stats.energyEfficiency"
        icon={
          <TrendingUp className="size-5 text-green-600" aria-hidden="true" />
        }
      />
      <CurrentStatsCard
        headingAs={embedded ? 'h3' : 'h2'}
        compact={compact}
        value={formatValue(currentStats.yearlyCost)}
        unit={annualCostsUnit}
        titleKey="stats.annualCosts"
        icon={<Euro className="size-5 text-blue-600" aria-hidden="true" />}
      />
      <CurrentStatsCard
        headingAs={embedded ? 'h3' : 'h2'}
        compact={compact}
        value={formatValue(currentStats.co2Emissions, 1)}
        unit={co2EmissionsUnit}
        titleKey="stats.co2Emissions"
        icon={<Leaf className="size-5 text-green-700" aria-hidden="true" />}
      />
    </div>
  );
}
