import { pdfTheme } from '@/config/pdfTheme';
import {
  applyRenovation,
  calculate,
  type DETInput,
  type Renovation,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import type { ParseKeys } from 'i18next';
import { $config } from '@/lib/state/calculation-config';
import { $calculationInput } from '@/lib/state/computed/calculation-input';
import { $currentEnergyState } from '@/lib/state/computed/current-energy-state';
import {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '@/lib/state/inputs/renovation';
import { pdf } from './pdfStyles';
import { PdfRenovationItem } from './PdfRenovationItem';

const styles = StyleSheet.create({
  content: { gap: 16 },
  category: { gap: 0 },
  categoryTitle: { marginBottom: 6 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: pdfTheme.colors.border,
    paddingBottom: 4,
  },
  hMeasure: {
    width: '40%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
    paddingRight: 8,
  },
  hEnergy: {
    width: '20%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
  },
  hYear: {
    width: '20%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
  },
  hMonth: {
    width: '20%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
  },
});

function TableHeader() {
  const t = i18next.t.bind(i18next);
  return (
    <View style={styles.tableHeader}>
      <Text style={styles.hMeasure}>
        {t('energyCalculation:renovation.table.measure')}
      </Text>
      <Text style={styles.hEnergy}>
        {t('energyCalculation:export.energySavings')}
      </Text>
      <Text style={styles.hYear}>
        {t('energyCalculation:export.savingsYear')}
      </Text>
      <Text style={styles.hMonth}>
        {t('energyCalculation:export.savingsMonth')}
      </Text>
    </View>
  );
}

function renderCategory(
  titleKey: `energyCalculation:${ParseKeys<'energyCalculation'>}`,
  renovations: Renovation[],
  categoryBase: DETInput,
  baseEnergy: number,
  baseCost: number,
  originalEnergy: number,
  config: ReturnType<typeof $config.get>,
) {
  if (renovations.length === 0) return null;
  return (
    <View style={styles.category}>
      <Text style={[pdf.h3, styles.categoryTitle]}>
        {i18next.t('energyCalculation:export.categoryLabel')}:{' '}
        {i18next.t(titleKey)}
      </Text>
      <TableHeader />
      {renovations.map((r) => {
        const result = calculate(config, applyRenovation(categoryBase, r));
        const energyDelta = result.energyConsumptionPerSquareMeter - baseEnergy;
        const energySavingPercent = (energyDelta / originalEnergy) * 100;
        const costSaving = result.yearlyCost - baseCost;
        return (
          <PdfRenovationItem
            key={r.id}
            label={r.label}
            energySavingPercent={energySavingPercent}
            costSaving={costSaving}
          />
        );
      })}
    </View>
  );
}

export function PdfRenovationScenarios() {
  const config = $config.get();
  const rawBaseInput = $calculationInput.get();
  const currentState = $currentEnergyState.get();
  const baseInput = {
    ...rawBaseInput,
    preRenovationValues: currentState.preRenovationValues,
  };

  const selectedInsulation = $selectedInsulationRenovations.get();
  const selectedHeating = $selectedHeatingRenovations.get();
  const selectedHeatingSurface = $selectedHeatingSurfaceRenovations.get();

  const insulationPatchedInput =
    selectedInsulation.length > 0
      ? applyRenovation(baseInput, selectedInsulation)
      : baseInput;

  const heatingPatchedInput =
    selectedHeating.length > 0
      ? applyRenovation(insulationPatchedInput, selectedHeating)
      : insulationPatchedInput;

  const insulationBaseResult = currentState;
  const heatingBaseResult = calculate(config, insulationPatchedInput);
  const heatingSurfaceBaseResult = calculate(config, heatingPatchedInput);

  return (
    <View style={styles.content}>
      <Text style={pdf.sectionHeader}>
        {i18next.t('energyCalculation:export.renovationScenariosTitle')}
      </Text>
      {renderCategory(
        'energyCalculation:export.categoryInsulation',
        selectedInsulation,
        baseInput,
        insulationBaseResult.energyConsumptionPerSquareMeter,
        insulationBaseResult.yearlyCost,
        insulationBaseResult.energyConsumptionPerSquareMeter,
        config,
      )}
      {renderCategory(
        'energyCalculation:export.categoryHeating',
        selectedHeating,
        insulationPatchedInput,
        heatingBaseResult.energyConsumptionPerSquareMeter,
        heatingBaseResult.yearlyCost,
        insulationBaseResult.energyConsumptionPerSquareMeter,
        config,
      )}
      {renderCategory(
        'energyCalculation:export.categoryHeatingSurface',
        selectedHeatingSurface,
        heatingPatchedInput,
        heatingSurfaceBaseResult.energyConsumptionPerSquareMeter,
        heatingSurfaceBaseResult.yearlyCost,
        insulationBaseResult.energyConsumptionPerSquareMeter,
        config,
      )}
    </View>
  );
}
