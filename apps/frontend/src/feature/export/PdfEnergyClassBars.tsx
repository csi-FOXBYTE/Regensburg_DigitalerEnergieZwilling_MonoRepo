import { pdfTheme } from '@/config/pdfTheme';
import {
  $config,
  $energyEfficiencyClasses,
} from '@/lib/state/calculation-config';
import { $currentEnergyState } from '@/lib/state/computed/current-energy-state';
import { $renovatedEnergyState } from '@/lib/state/computed/renovated-energy-state';
import type { EnergyEfficiencyClass } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import {
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import i18next from 'i18next';
import { PdfIcon } from './PdfIcon';

// A4 content width: 595pt − 2×48pt padding = 499pt
const LABEL_W = 24;
const GAP = 3;
const BAR_W = 499 - LABEL_W - GAP; // 472
const ACTIVE_H = 20;
const INACTIVE_H = 11;
// Keep a consistent chevron angle by scaling tip width with row height
const ARROW_TIP_RATIO = 0.4; // tipWidth = rowHeight * ratio

const styles = StyleSheet.create({
  list: { flexDirection: 'column', gap: 1 },
  row: { flexDirection: 'row', gap: GAP },
  label: { alignItems: 'center', justifyContent: 'center' },
  labelTextActive: {
    fontSize: 10,
    fontWeight: 700,
    color: pdfTheme.colors.onSolid,
  },
  labelTextInactive: {
    fontSize: 7,
    fontWeight: 700,
    color: pdfTheme.colors.onSolid,
  },
  barContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 4,
  },
  rangeText: { fontSize: 9, fontWeight: 700, color: pdfTheme.colors.onSolid },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 8, fontWeight: 700, color: pdfTheme.colors.onSolid },
});

function formatRange(
  from: number | undefined,
  to: number | undefined,
  unit: string,
): string {
  if (from == null) return `< ${to} ${unit}`;
  if (to == null) return `> ${from} ${unit}`;
  return `${from} – ${to} ${unit}`;
}

export function PdfEnergyClassBars() {
  const config = $config.get();
  const effClasses = $energyEfficiencyClasses.get();
  const current = $currentEnergyState.get();
  const renovated = $renovatedEnergyState.get();
  const t = i18next.t.bind(i18next);
  const energyDemandUnit = t('common:units.kilowattHoursPerSquareMeterPerYear');

  const bands = config.general.energyEfficiencyClasses;
  const steps = bands.length - 1;
  const beforeClass = current.energyEfficiencyClass;
  const afterClass = renovated.energyEfficiencyClass;
  const same = beforeClass === afterClass;

  const classIndex = Object.fromEntries(
    bands.map((band, i) => [band.value, i]),
  );
  const improved = classIndex[afterClass] < classIndex[beforeClass];

  function badge(
    cls: EnergyEfficiencyClass,
  ):
    | { label: string; color: string; arrow?: 'arrow-up' | 'arrow-down' }
    | undefined {
    if (cls === afterClass && !same)
      return {
        label: t('energyCalculation:stats.afterRenovation'),
        color: improved ? pdfTheme.colors.positive : pdfTheme.colors.negative,
        arrow: improved ? 'arrow-up' : 'arrow-down',
      } as const;
    if (cls === beforeClass)
      return {
        label: t('energyCalculation:stats.beforeRenovation'),
        color: pdfTheme.colors.foreground,
      };
    return undefined;
  }

  return (
    <View style={styles.list}>
      {bands.map((band, i) => {
        const color = effClasses.get(band.value)?.color ?? '';
        const isActive =
          band.value === beforeClass || band.value === afterClass;
        const rowHeight = isActive ? ACTIVE_H : INACTIVE_H;
        const fillWidth = Math.round(((20 + (i * 80) / steps) / 100) * BAR_W);
        const arrowTip = Math.round(rowHeight * ARROW_TIP_RATIO);
        const tipX = fillWidth - arrowTip;
        const arrowPoints = `0,0 ${tipX},0 ${fillWidth},${rowHeight / 2} ${tipX},${rowHeight} 0,${rowHeight}`;
        const b = badge(band.value);
        const rangeText = isActive
          ? formatRange(
              'from' in band ? band.from : undefined,
              'to' in band ? band.to : undefined,
              energyDemandUnit,
            )
          : null;

        return (
          <View key={band.value} style={styles.row}>
            <View
              style={[
                styles.label,
                { width: LABEL_W, height: rowHeight, backgroundColor: color },
              ]}
            >
              <Text
                style={
                  isActive ? styles.labelTextActive : styles.labelTextInactive
                }
              >
                {band.value}
              </Text>
            </View>
            <View
              style={{ width: BAR_W, height: rowHeight, position: 'relative' }}
            >
              <Svg
                style={{ position: 'absolute', top: 0, left: 0 }}
                width={BAR_W}
                height={rowHeight}
              >
                <Rect
                  x={0}
                  y={0}
                  width={BAR_W}
                  height={rowHeight}
                  fill={pdfTheme.colors.inactive}
                />
                <Polygon points={arrowPoints} fill={color} />
              </Svg>
              {isActive && (
                <View
                  style={[
                    styles.barContent,
                    { width: BAR_W, height: rowHeight },
                  ]}
                >
                  {rangeText && (
                    <Text style={styles.rangeText}>{rangeText}</Text>
                  )}
                  {b && (
                    <View style={[styles.badge, { backgroundColor: b.color }]}>
                      {b.arrow && (
                        <PdfIcon
                          name={b.arrow}
                          size={8}
                          color={pdfTheme.colors.onSolid}
                        />
                      )}
                      <Text style={styles.badgeText}>{b.label}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
