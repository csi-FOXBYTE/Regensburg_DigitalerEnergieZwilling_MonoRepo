import { pdfTheme } from '@/config/pdfTheme';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { formatEuro, formatPercent } from './pdfFormat';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderColor: pdfTheme.colors.border,
  },
  measure: {
    width: '40%',
    fontSize: 11,
    color: pdfTheme.colors.foreground,
    paddingRight: 8,
  },
  energy: {
    width: '20%',
    fontSize: 11,
    color: pdfTheme.colors.foreground,
    fontWeight: 700,
  },
  year: {
    width: '20%',
    fontSize: 11,
    color: pdfTheme.colors.foreground,
    fontWeight: 700,
  },
  month: {
    width: '20%',
    fontSize: 11,
    color: pdfTheme.colors.foreground,
    fontWeight: 700,
  },
});

type Props = {
  label: string;
  energySavingPercent: number;
  costSaving: number;
};

export function PdfRenovationItem({
  label,
  energySavingPercent,
  costSaving,
}: Props) {
  const eurosPerYear = i18next.t('common:units.eurosPerYear');
  return (
    <View style={styles.row}>
      <Text style={styles.measure}>{label}</Text>
      <Text style={styles.energy}>
        {formatPercent(energySavingPercent, { signed: true })} %
      </Text>
      <Text style={styles.year}>
        {formatEuro(costSaving, { signed: true })} {eurosPerYear}
      </Text>
      <Text style={styles.month}>
        {formatEuro(costSaving / 12, { signed: true })} €/Mon.
      </Text>
    </View>
  );
}
