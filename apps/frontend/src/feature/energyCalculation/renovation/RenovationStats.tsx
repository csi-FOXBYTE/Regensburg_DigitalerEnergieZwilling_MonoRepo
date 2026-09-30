import {
  type CalculationResult,
  type EnergyEfficiencyClass,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import type { ParseKeys } from 'i18next';
import { ChevronDown, Euro, Leaf, TrendingUp, Zap } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper } from '../../../components/ui/paper';
import { Separator } from '../../../components/ui/separator';
import { Typography } from '../../../components/ui/typography';
import { $energyEfficiencyClasses } from '../../../lib/state/calculation-config';
import { $currentEnergyState } from '../../../lib/state/computed/current-energy-state';
import { $renovatedEnergyState } from '../../../lib/state/computed/renovated-energy-state';
import { primaryEnergyCarrierOptions } from '../../../lib/state/inputs/heat';

type StatDetail = {
  label: string;
  before: string;
  after: string;
  unit: string;
};

function formatValue(value: number, fractionDigits = 0) {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatDelta(value: number, fractionDigits = 0) {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: 'always',
  });
}

function calculatePerSquareMeter(
  result: CalculationResult,
  partialDemand: number,
) {
  if (result.annualTotalEnergyDemand === 0) return 0;
  return (
    (partialDemand / result.annualTotalEnergyDemand) *
    result.energyConsumptionPerSquareMeter
  );
}

function deltaPillClass(improved: boolean | null) {
  if (improved === true) return 'bg-green-600 text-white';
  if (improved === false) return 'bg-red-600 text-white';
  return 'bg-neutral-550 text-white';
}

function DeltaPill({
  children,
  improved,
}: {
  children: ReactNode;
  improved: boolean | null;
}) {
  return (
    <span
      className={`rounded-badge w-fit px-2 py-1 text-xs font-bold ${deltaPillClass(improved)}`}
    >
      {children}
    </span>
  );
}

function NumericDelta({
  before,
  after,
  unit,
  fractionDigits = 0,
}: {
  before: number;
  after: number;
  unit: string;
  fractionDigits?: number;
}) {
  const factor = 10 ** fractionDigits;
  const delta =
    Math.round(after * factor) / factor - Math.round(before * factor) / factor;
  const improved = delta < 0 ? true : delta > 0 ? false : null;
  return (
    <DeltaPill improved={improved}>
      {formatDelta(delta, fractionDigits)}{' '}
      <span className="text-[10px]">{unit}</span>
    </DeltaPill>
  );
}

function ClassDelta({
  before,
  after,
  classIndex,
}: {
  before: EnergyEfficiencyClass;
  after: EnergyEfficiencyClass;
  classIndex: Map<string, number>;
}) {
  const beforeIndex = classIndex.get(before) ?? 0;
  const afterIndex = classIndex.get(after) ?? 0;
  const improved =
    afterIndex < beforeIndex ? true : afterIndex > beforeIndex ? false : null;
  return (
    <DeltaPill improved={improved}>
      {before} → {after}
    </DeltaPill>
  );
}

function RenovationStatsCard({
  icon,
  titleKey,
  beforeFormatted,
  afterFormatted,
  unit,
  delta,
  details,
  compact = false,
}: {
  icon: ReactNode;
  titleKey: ParseKeys<'energyCalculation'>;
  beforeFormatted: string;
  afterFormatted: string;
  unit?: string;
  delta: ReactNode;
  details?: StatDetail[];
  compact?: boolean;
}) {
  const { t } = useTranslation('energyCalculation');
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  if (compact) {
    return (
      <Paper className="flex flex-col gap-1 p-2" elevation={2}>
        <div className="flex gap-1">
          {icon}
          <Typography as="h2" variant="h4" className="text-sm leading-5">
            {t(titleKey)}
          </Typography>
        </div>
        <div className="flex items-baseline gap-1">
          <Typography variant="muted" className="leading-6">
            {beforeFormatted} →
          </Typography>
          <Typography className="text-lg leading-6 font-bold">
            {afterFormatted}
            {unit && <span className="ml-1 text-sm">{unit}</span>}
          </Typography>
        </div>
        {delta}
      </Paper>
    );
  }

  return (
    <Paper className="relative flex flex-col gap-2 p-4" elevation={2}>
      <div className="flex gap-2">
        {icon}
        <Typography as="h2" variant="h4">
          {t(titleKey)}
        </Typography>
      </div>
      <Typography variant="muted">{t('stats.beforeRenovation')}</Typography>
      <Typography variant="muted" style={{ fontSize: '16px' }}>
        {beforeFormatted}
        {unit && <span className="ml-1 text-xs">{unit}</span>}
      </Typography>
      <Separator style={{ margin: '4px 0' }} />
      <Typography style={{ fontSize: '16px', fontWeight: 'bold' }}>
        {t('stats.afterRenovation')}
      </Typography>
      <Typography
        style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}
      >
        {afterFormatted}
        {unit && <span className="ml-1 text-sm">{unit}</span>}
      </Typography>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {delta}
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
                      <span className="text-neutral-450 font-normal">
                        {detail.before}
                      </span>{' '}
                      → {detail.after}
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

export default function RenovationStats({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  const effClasses = useStore($energyEfficiencyClasses);
  const before = useStore($currentEnergyState);
  const after = useStore($renovatedEnergyState);
  const energyCarrierOptions = useStore(primaryEnergyCarrierOptions);
  const classIndex = new Map(
    Array.from(effClasses.keys()).map((cls, i) => [cls, i]),
  );
  const getEnergyCarrierLabel = (value: string) => {
    const carrier = energyCarrierOptions.find(
      (option) => option.value === value,
    );
    return (
      carrier?.localization[i18n.language] ??
      carrier?.localization[i18n.language.split('-')[0]] ??
      carrier?.localization.en ??
      value
    );
  };
  const beforeCarrierLabel = getEnergyCarrierLabel(before.energyCarrierType);
  const afterCarrierLabel = getEnergyCarrierLabel(after.energyCarrierType);
  const carrierLabel =
    before.energyCarrierType === after.energyCarrierType
      ? beforeCarrierLabel
      : `${beforeCarrierLabel} → ${afterCarrierLabel}`;
  const energyDemandUnit = tCommon('units.kilowattHoursPerSquareMeterPerYear');
  const annualCostsUnit = tCommon('units.eurosPerYear');
  const co2EmissionsUnit = tCommon('units.tonsCo2PerYear');
  const makeEnergyDemandDetail = (
    label: string,
    beforeValue: number,
    afterValue: number,
  ): StatDetail => ({
    label,
    before: formatValue(calculatePerSquareMeter(before, beforeValue)),
    after: formatValue(calculatePerSquareMeter(after, afterValue)),
    unit: energyDemandUnit,
  });
  const energyDemandDetails: StatDetail[] = [
    makeEnergyDemandDetail(
      t('stats.energyDemandBreakdown.carrierHeating', {
        carrier: carrierLabel,
      }),
      before.annualCarrierHeatingEnergyDemand,
      after.annualCarrierHeatingEnergyDemand,
    ),
    makeEnergyDemandDetail(
      t('stats.energyDemandBreakdown.electricalHeating'),
      before.annualElectricalHeatingEnergyDemand,
      after.annualElectricalHeatingEnergyDemand,
    ),
    makeEnergyDemandDetail(
      t('stats.energyDemandBreakdown.householdElectricity'),
      before.annualHouseholdElectricalEnergyDemand,
      after.annualHouseholdElectricalEnergyDemand,
    ),
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <RenovationStatsCard
        compact={compact}
        icon={<Zap className="size-5 text-amber-600" aria-hidden="true" />}
        titleKey="stats.energyDemand"
        beforeFormatted={formatValue(before.energyConsumptionPerSquareMeter)}
        afterFormatted={formatValue(after.energyConsumptionPerSquareMeter)}
        unit={energyDemandUnit}
        delta={
          <NumericDelta
            before={before.energyConsumptionPerSquareMeter}
            after={after.energyConsumptionPerSquareMeter}
            unit={energyDemandUnit}
          />
        }
        details={energyDemandDetails}
      />
      <RenovationStatsCard
        compact={compact}
        icon={
          <TrendingUp className="size-5 text-green-600" aria-hidden="true" />
        }
        titleKey="stats.energyEfficiency"
        beforeFormatted={t('stats.energyEfficiencyValue', {
          value: before.energyEfficiencyClass,
        })}
        afterFormatted={t('stats.energyEfficiencyValue', {
          value: after.energyEfficiencyClass,
        })}
        delta={
          <ClassDelta
            before={before.energyEfficiencyClass}
            after={after.energyEfficiencyClass}
            classIndex={classIndex}
          />
        }
      />
      <RenovationStatsCard
        compact={compact}
        icon={<Euro className="size-5 text-blue-600" aria-hidden="true" />}
        titleKey="stats.annualCosts"
        beforeFormatted={formatValue(before.yearlyCost)}
        afterFormatted={formatValue(after.yearlyCost)}
        unit={annualCostsUnit}
        delta={
          <NumericDelta
            before={before.yearlyCost}
            after={after.yearlyCost}
            unit={annualCostsUnit}
          />
        }
      />
      <RenovationStatsCard
        compact={compact}
        icon={<Leaf className="size-5 text-green-700" aria-hidden="true" />}
        titleKey="stats.co2Emissions"
        beforeFormatted={formatValue(before.co2Emissions, 1)}
        afterFormatted={formatValue(after.co2Emissions, 1)}
        unit={co2EmissionsUnit}
        delta={
          <NumericDelta
            before={before.co2Emissions}
            after={after.co2Emissions}
            unit={co2EmissionsUnit}
            fractionDigits={1}
          />
        }
      />
    </div>
  );
}
