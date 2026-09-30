import { pdfTheme } from '@/config/pdfTheme';
import { $currentEnergyState } from '@/lib/state/computed/current-energy-state';
import { $renovatedEnergyState } from '@/lib/state/computed/renovated-energy-state';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { formatEnergy, formatNumber } from './pdfFormat';
import { pdf } from './pdfStyles';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  card: {
    ...pdf.card,
    flex: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  beforeLabel: {
    ...pdf.muted,
    marginBottom: 2,
  },
  beforeValue: {
    ...pdf.muted,
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: pdfTheme.colors.border,
    marginBottom: 4,
  },
  afterLabel: {
    fontSize: 10,
    color: pdfTheme.colors.muted,
    marginBottom: 2,
  },
  afterValue: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 700,
    color: pdfTheme.colors.onSolid,
  },
});

function deltaColor(improved: boolean | null) {
  if (improved === true) return pdfTheme.colors.positive;
  if (improved === false) return pdfTheme.colors.negative;
  return pdfTheme.colors.muted;
}

function StatCard({
  title,
  beforeValue,
  afterValue,
  deltaLabel,
  deltaColor: color,
}: {
  title: string;
  beforeValue: string;
  afterValue: string;
  deltaLabel: string;
  deltaColor: string;
}) {
  const t = i18next.t.bind(i18next);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.beforeLabel}>
        {t('energyCalculation:stats.beforeRenovation')}
      </Text>
      <Text style={styles.beforeValue}>{beforeValue}</Text>
      <View style={styles.divider} />
      <Text style={styles.afterLabel}>
        {t('energyCalculation:stats.afterRenovation')}
      </Text>
      <Text style={styles.afterValue}>{afterValue}</Text>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{deltaLabel}</Text>
      </View>
    </View>
  );
}

export function PdfEnergyStats() {
  const before = $currentEnergyState.get();
  const after = $renovatedEnergyState.get();
  const t = i18next.t.bind(i18next);
  const energyDemandUnit = t('common:units.kilowattHoursPerSquareMeterPerYear');
  const annualCostsUnit = t('common:units.eurosPerYear');
  const co2EmissionsUnit = t('common:units.tonsCo2PerYear');

  const energyDelta =
    Math.round(after.energyConsumptionPerSquareMeter) -
    Math.round(before.energyConsumptionPerSquareMeter);
  const costDelta =
    Math.round(after.yearlyCost) - Math.round(before.yearlyCost);
  const co2Delta =
    Math.round(after.co2Emissions * 10) / 10 -
    Math.round(before.co2Emissions * 10) / 10;

  return (
    <View style={styles.row}>
      <StatCard
        title={t('energyCalculation:stats.energyDemand')}
        beforeValue={`${formatEnergy(before.energyConsumptionPerSquareMeter)} ${energyDemandUnit}`}
        afterValue={`${formatEnergy(after.energyConsumptionPerSquareMeter)} ${energyDemandUnit}`}
        deltaLabel={`${formatEnergy(energyDelta, { signed: true })} ${energyDemandUnit}`}
        deltaColor={deltaColor(
          energyDelta < 0 ? true : energyDelta > 0 ? false : null,
        )}
      />
      <StatCard
        title={t('energyCalculation:stats.annualCosts')}
        beforeValue={`${formatNumber(before.yearlyCost, 0)} ${annualCostsUnit}`}
        afterValue={`${formatNumber(after.yearlyCost, 0)} ${annualCostsUnit}`}
        deltaLabel={`${formatNumber(costDelta, 0, { signed: true })} ${annualCostsUnit}`}
        deltaColor={deltaColor(
          costDelta < 0 ? true : costDelta > 0 ? false : null,
        )}
      />
      <StatCard
        title={t('energyCalculation:stats.co2Emissions')}
        beforeValue={`${formatNumber(before.co2Emissions, 1)} ${co2EmissionsUnit}`}
        afterValue={`${formatNumber(after.co2Emissions, 1)} ${co2EmissionsUnit}`}
        deltaLabel={`${formatNumber(co2Delta, 1, { signed: true })} ${co2EmissionsUnit}`}
        deltaColor={deltaColor(
          co2Delta < 0 ? true : co2Delta > 0 ? false : null,
        )}
      />
    </View>
  );
}
