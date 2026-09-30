import { $config } from '@/lib/state/calculation-config';
import { $currentEnergyState } from '@/lib/state/computed/current-energy-state';
import { $resolvedInputState } from '@/lib/state/computed/resolved-input';
import {
  BuildingType,
  RoofInsulationType,
  type RangeKey,
  type Selection,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ParseKeys } from 'i18next';
import i18next from 'i18next';
import { formatNumber } from './pdfFormat';
import { PdfLabeledValue } from './PdfLabeledValue';
import { pdf } from './pdfStyles';

const ec = (key: ParseKeys<'energyCalculation'>) =>
  i18next.t(`energyCalculation:${key}`);

type BoolKey =
  | `common:${ParseKeys<'common'>}`
  | `energyCalculation:${ParseKeys<'energyCalculation'>}`;

// --- formatters ---

function fmt(
  value: number | null | undefined,
  decimals: number,
  unit: string,
): string {
  if (value == null) return '–';
  const n = formatNumber(value, decimals);
  return unit ? `${n} ${unit}` : n;
}

function metersToCentimeters(value: number | null | undefined) {
  return value == null ? value : value * 100;
}

function fmtRange(key: RangeKey | null | undefined): string {
  if (!key) return '–';
  const r = key as { from?: number; to?: number };
  if (r.from != null && r.to != null)
    return i18next.t('common:yearRange.between', { from: r.from, to: r.to });
  if (r.to != null) return i18next.t('common:yearRange.upTo', { year: r.to });
  if (r.from != null)
    return i18next.t('common:yearRange.from', { year: r.from });
  return '–';
}

function fmtBool(
  value: boolean | null | undefined,
  trueKey: BoolKey,
  falseKey: BoolKey,
): string {
  if (value == null) return '–';
  return i18next.t(value ? trueKey : falseKey);
}

function findLabel(
  options: Selection[],
  value: string | null | undefined,
): string {
  if (value == null) return '–';
  const option = options.find((o) => o.value === value);
  if (!option) return value;
  const lang = i18next.language;
  return (
    option.localization[lang] ??
    option.localization[lang.split('-')[0]] ??
    Object.values(option.localization)[0] ??
    value
  );
}

// --- layout ---

const styles = StyleSheet.create({
  content: { gap: 7 },
  group: { gap: 5 },
  section: { gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
});

export function PdfInputSummary() {
  const resolved = $resolvedInputState.get();
  const config = $config.get();
  const result = $currentEnergyState.get();
  const kilowattHoursPerYear = i18next.t('common:units.kilowattHoursPerYear');
  const eurosPerYear = i18next.t('common:units.eurosPerYear');

  const {
    general,
    roof,
    topFloor,
    roofWindows,
    outerWall,
    exteriorWallWindows: extWin,
    bottomFloor,
    heat,
    electricity,
  } = resolved;

  // visibility conditions
  const hasAttic = topFloor.hasAttic;
  const isAtticHeated = topFloor.isAtticHeated;
  const showTopFloor = hasAttic === true && isAtticHeated !== true;
  const showRoofWindows = !showTopFloor;
  const hasBasement = bottomFloor.hasBasement;
  const isOnlyElectrical =
    heat.heatingSystemType != null &&
    (config.heat.electricalRatio.find((r) => r.key === heat.heatingSystemType)
      ?.value ?? 0) >= 1;

  const bfCtx: 'noBasement' | 'heated' | 'default' =
    hasBasement === false
      ? 'noBasement'
      : bottomFloor.isBasementHeated === true
        ? 'heated'
        : 'default';

  return (
    <View style={styles.content}>
      <Text style={pdf.sectionHeader}>{ec('export.inputSummaryTitle')}</Text>

      {/* General */}
      <View wrap={false} style={styles.section}>
        <Text style={pdf.groupHeader}>{ec('export.sectionGeneral')}</Text>
        <View style={styles.grid}>
          <PdfLabeledValue
            label={ec('export.labels.general.constructionYear')}
            value={fmtRange(general.buildingYear as RangeKey)}
          />
          <PdfLabeledValue
            label={ec('export.labels.general.buildingType')}
            value={
              general.type === BuildingType.SINGLE_FAMILY
                ? ec('generalData.buildingType.singleFamily')
                : general.type === BuildingType.MULTI_FAMILY
                  ? ec('generalData.buildingType.multiFamily')
                  : (general.type ?? '–')
            }
          />
          <PdfLabeledValue
            label={ec('export.labels.general.numberOfFloors')}
            value={fmt(general.numberOfStories, 0, '')}
          />
          <PdfLabeledValue
            label={ec('export.labels.general.livingArea')}
            value={fmt(general.livingArea, 1, 'm²')}
          />
        </View>
      </View>

      {/* Outer Parts group */}
      <View style={styles.group}>
        <View wrap={false}>
          <Text style={pdf.groupHeader}>{ec('export.sectionOuterParts')}</Text>

          {/* Roof */}
          <View style={styles.section}>
            <Text style={pdf.h3}>{ec('outerParts.roof.roof')}</Text>
            <View style={styles.grid}>
              <PdfLabeledValue
                label={ec('export.labels.roof.year')}
                value={fmtRange(roof.year as RangeKey)}
              />
              <PdfLabeledValue
                label={ec('export.labels.roof.area')}
                value={fmt(roof.area, 1, 'm²')}
              />
              <PdfLabeledValue
                label={ec('export.labels.roof.constructionType')}
                value={findLabel(
                  config.roof.constructionTypes,
                  roof.constructionType,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.roof.hasAttic')}
                value={fmtBool(hasAttic, 'common:yes', 'common:no')}
              />
              {hasAttic && (
                <PdfLabeledValue
                  label={ec('export.labels.roof.isAtticHeated')}
                  value={fmtBool(
                    isAtticHeated,
                    'energyCalculation:booleanLabels.heated',
                    'energyCalculation:booleanLabels.notHeated',
                  )}
                />
              )}
              <PdfLabeledValue
                label={ec('export.labels.roof.hasInsulation')}
                value={fmtBool(
                  roof.hasInsulation,
                  'energyCalculation:booleanLabels.insulated',
                  'energyCalculation:booleanLabels.notInsulated',
                )}
              />
              {roof.hasInsulation && (
                <>
                  <PdfLabeledValue
                    label={ec('export.labels.roof.insulationThickness')}
                    value={fmt(
                      metersToCentimeters(roof.insulationThickness),
                      0,
                      'cm',
                    )}
                  />
                  <PdfLabeledValue
                    label={ec('export.labels.roof.insulationType')}
                    value={
                      roof.insulationType === RoofInsulationType.BETWEEN_RAFTER
                        ? ec('outerParts.roof.insulationTypes.betweenRafter')
                        : roof.insulationType ===
                            RoofInsulationType.ABOVE_RAFTER
                          ? ec('outerParts.roof.insulationTypes.aboveRafter')
                          : (roof.insulationType ?? '–')
                    }
                  />
                </>
              )}
            </View>
          </View>
        </View>
        {/* end anchor */}

        {/* Top Floor (conditional) */}
        {showTopFloor && (
          <View wrap={false} style={styles.section}>
            <Text style={pdf.h3}>{ec('outerParts.topFloor.topFloor')}</Text>
            <View style={styles.grid}>
              <PdfLabeledValue
                label={ec('export.labels.topFloor.year')}
                value={fmtRange(topFloor.year as RangeKey)}
              />
              <PdfLabeledValue
                label={ec('export.labels.topFloor.area')}
                value={fmt(topFloor.area, 1, 'm²')}
              />
              <PdfLabeledValue
                label={ec('export.labels.topFloor.type')}
                value={findLabel(
                  config.topFloor.topFloorTypes,
                  topFloor.topFloorType,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.topFloor.hasInsulation')}
                value={fmtBool(
                  topFloor.hasInsulation,
                  'energyCalculation:booleanLabels.insulated',
                  'energyCalculation:booleanLabels.notInsulated',
                )}
              />
              {topFloor.hasInsulation && (
                <PdfLabeledValue
                  label={ec('export.labels.topFloor.insulationThickness')}
                  value={fmt(
                    metersToCentimeters(topFloor.insulationThickness),
                    0,
                    'cm',
                  )}
                />
              )}
            </View>
          </View>
        )}

        {/* Roof Windows (conditional) */}
        {showRoofWindows && (
          <View wrap={false} style={styles.section}>
            <Text style={pdf.h3}>
              {ec('outerParts.roofWindows.roofWindows')}
            </Text>
            <View style={styles.grid}>
              <PdfLabeledValue
                label={ec('export.labels.roofWindows.year')}
                value={fmtRange(roofWindows.year as RangeKey)}
              />
              <PdfLabeledValue
                label={ec('export.labels.roofWindows.area')}
                value={fmt(roofWindows.area, 1, 'm²')}
              />
              <PdfLabeledValue
                label={ec('export.labels.roofWindows.windowType')}
                value={findLabel(
                  config.windows.windowTypes,
                  roofWindows.windowType,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.roofWindows.uValue')}
                value={fmt(roofWindows.uValue, 2, 'W/m²K')}
              />
            </View>
          </View>
        )}

        {/* Outer Wall */}
        <View wrap={false} style={styles.section}>
          <Text style={pdf.h3}>{ec('outerParts.outerWall.outerWall')}</Text>
          <View style={styles.grid}>
            <PdfLabeledValue
              label={ec('export.labels.outerWall.year')}
              value={fmtRange(outerWall.year as RangeKey)}
            />
            <PdfLabeledValue
              label={ec('export.labels.outerWall.area')}
              value={fmt(outerWall.area, 1, 'm²')}
            />
            <PdfLabeledValue
              label={ec('export.labels.outerWall.adjacentWallArea')}
              value={fmt(outerWall.adjacentWallArea, 1, 'm²')}
            />
            <PdfLabeledValue
              label={ec('export.labels.outerWall.constructionType')}
              value={findLabel(
                config.outerWall.constructionTypes,
                outerWall.constructionType,
              )}
            />
            {result.resolvedInput.outerWall.allowsAdditionalInsulation && (
              <>
                <PdfLabeledValue
                  label={ec('export.labels.outerWall.hasInsulation')}
                  value={fmtBool(
                    outerWall.hasInsulation,
                    'energyCalculation:booleanLabels.insulated',
                    'energyCalculation:booleanLabels.notInsulated',
                  )}
                />
                {outerWall.hasInsulation && (
                  <PdfLabeledValue
                    label={ec('export.labels.outerWall.insulationThickness')}
                    value={fmt(
                      metersToCentimeters(outerWall.insulationThickness),
                      0,
                      'cm',
                    )}
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* Windows */}
        <View wrap={false} style={styles.section}>
          <Text style={pdf.h3}>{ec('outerParts.windows.windows')}</Text>
          <View style={styles.grid}>
            <PdfLabeledValue
              label={ec('export.labels.windows.year')}
              value={fmtRange(extWin.year as RangeKey)}
            />
            <PdfLabeledValue
              label={ec('export.labels.windows.area')}
              value={fmt(extWin.area, 1, 'm²')}
            />
            <PdfLabeledValue
              label={ec('export.labels.windows.windowType')}
              value={findLabel(config.windows.windowTypes, extWin.windowType)}
            />
            <PdfLabeledValue
              label={ec('export.labels.windows.uValue')}
              value={fmt(extWin.uValue, 2, 'W/m²K')}
            />
          </View>
        </View>

        {/* Bottom Floor */}
        <View wrap={false} style={styles.section}>
          <Text style={pdf.h3}>{ec('outerParts.bottomFloor.bottomFloor')}</Text>
          <View style={styles.grid}>
            <PdfLabeledValue
              label={ec(`export.labels.bottomFloor.year.${bfCtx}`)}
              value={fmtRange(bottomFloor.year as RangeKey)}
            />
            <PdfLabeledValue
              label={ec('export.labels.bottomFloor.hasBasement')}
              value={fmtBool(hasBasement, 'common:yes', 'common:no')}
            />
            {hasBasement && (
              <PdfLabeledValue
                label={ec('export.labels.bottomFloor.isBasementHeated')}
                value={fmtBool(
                  bottomFloor.isBasementHeated,
                  'energyCalculation:booleanLabels.heated',
                  'energyCalculation:booleanLabels.notHeated',
                )}
              />
            )}
            <PdfLabeledValue
              label={ec(`export.labels.bottomFloor.area.${bfCtx}`)}
              value={fmt(bottomFloor.area, 1, 'm²')}
            />
            <PdfLabeledValue
              label={ec('export.labels.bottomFloor.constructionType')}
              value={findLabel(
                config.bottomFloor.constructionTypes,
                bottomFloor.constructionType,
              )}
            />
            <PdfLabeledValue
              label={ec('export.labels.bottomFloor.hasInsulation')}
              value={fmtBool(
                bottomFloor.hasInsulation,
                'energyCalculation:booleanLabels.insulated',
                'energyCalculation:booleanLabels.notInsulated',
              )}
            />
            {bottomFloor.hasInsulation && (
              <PdfLabeledValue
                label={ec('export.labels.bottomFloor.insulationThickness')}
                value={fmt(
                  metersToCentimeters(bottomFloor.insulationThickness),
                  0,
                  'cm',
                )}
              />
            )}
          </View>
        </View>
      </View>
      {/* end Outer Parts group */}

      {/* Heat group */}
      <View style={styles.group}>
        <View wrap={false}>
          <Text style={pdf.groupHeader}>{ec('heat.title')}</Text>

          {/* Heat Supply */}
          <View style={styles.section}>
            <Text style={pdf.h3}>{ec('heat.supply.title')}</Text>
            <View style={styles.grid}>
              <PdfLabeledValue
                label={ec('export.labels.heat.hasGasSupply')}
                value={fmtBool(heat.hasGasSupply, 'common:yes', 'common:no')}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.hasStorage')}
                value={fmtBool(heat.hasStorage, 'common:yes', 'common:no')}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.hasGeothermalAvailability')}
                value={fmtBool(
                  heat.hasGeothermalAvailability,
                  'common:yes',
                  'common:no',
                )}
              />
            </View>
          </View>
        </View>
        {/* end anchor */}

        {/* Heating System */}
        <View wrap={false} style={styles.section}>
          <Text style={pdf.h3}>{ec('heat.heating.title')}</Text>
          <View style={styles.grid}>
            <PdfLabeledValue
              label={ec('export.labels.heat.constructionYear')}
              value={fmtRange(heat.heatingSystemConstructionYear as RangeKey)}
            />
            <PdfLabeledValue
              label={ec('export.labels.heat.primaryEnergyCarrier')}
              value={findLabel(
                config.heat.primaryEnergyCarriers,
                heat.primaryEnergyCarrier,
              )}
            />
            <PdfLabeledValue
              label={ec('export.labels.heat.heatingSystemType')}
              value={findLabel(
                config.heat.heatingSystemTypes,
                heat.heatingSystemType,
              )}
            />
            <PdfLabeledValue
              label={ec('export.labels.heat.heatingSurfaceType')}
              value={findLabel(
                config.heat.heatingSurfaceTypes,
                heat.heatingSurfaceType,
              )}
            />
          </View>
        </View>

        {/* Thermal Bills (conditional) */}
        {!isOnlyElectrical && (
          <View wrap={false} style={styles.section}>
            <Text style={pdf.h3}>{ec('export.heatBillsTitle')}</Text>
            <View style={styles.grid}>
              <PdfLabeledValue
                label={ec('export.labels.heat.heatingDemand')}
                value={fmt(
                  result.annualHeatingEnergyDemand,
                  0,
                  kilowattHoursPerYear,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.carrierDemand')}
                value={fmt(
                  result.annualCarrierHeatingEnergyDemand,
                  0,
                  result.energyCarrierUnit,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.totalCost')}
                value={fmt(result.annualTotalHeatingCost, 2, eurosPerYear)}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.unitRate')}
                value={fmt(
                  result.energyCarrierUnitRate,
                  2,
                  `€/${result.energyCarrierUnit}`,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.heat.baseRate')}
                value={fmt(result.energyCarrierBaseRate, 2, eurosPerYear)}
              />
            </View>
          </View>
        )}
      </View>
      {/* end Heat group */}

      {/* Electricity */}
      <View wrap={false} style={styles.section}>
        <Text style={pdf.groupHeader}>{ec('electricity.title')}</Text>
        <View style={styles.grid}>
          <PdfLabeledValue
            label={ec('export.labels.electricity.type')}
            value={findLabel(
              config.heat.electricityTypes,
              electricity.electricityType,
            )}
          />
          <PdfLabeledValue
            label={ec('export.labels.electricity.unitRate')}
            value={fmt(electricity.electricityUnitRate, 2, '€/kWh')}
          />
          <PdfLabeledValue
            label={ec('export.labels.electricity.baseRate')}
            value={fmt(electricity.userElectricityBaseRate, 2, eurosPerYear)}
          />
          {result.annualElectricalHeatingEnergyDemand > 0 ? (
            <>
              <PdfLabeledValue
                label={ec('export.labels.electricity.totalDemand')}
                value={fmt(
                  result.annualTotalElectricalEnergyDemand,
                  0,
                  kilowattHoursPerYear,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.electricity.heatingDemand')}
                value={fmt(
                  result.annualElectricalHeatingEnergyDemand,
                  0,
                  kilowattHoursPerYear,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.electricity.householdDemand')}
                value={fmt(
                  result.annualHouseholdElectricalEnergyDemand,
                  0,
                  kilowattHoursPerYear,
                )}
              />
              <PdfLabeledValue
                label={ec('export.labels.electricity.householdCost')}
                value={fmt(
                  result.annualHouseholdElectricalEnergyCost,
                  2,
                  eurosPerYear,
                )}
              />
            </>
          ) : (
            <PdfLabeledValue
              label={ec('export.labels.electricity.householdDemand')}
              value={fmt(
                result.annualHouseholdElectricalEnergyDemand,
                0,
                kilowattHoursPerYear,
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}
