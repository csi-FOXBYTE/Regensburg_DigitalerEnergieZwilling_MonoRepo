import { pdfTheme } from '@/config/pdfTheme';
import { $subsidies } from '@/lib/state/calculation-config';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { pdf } from './pdfStyles';

const styles = StyleSheet.create({
  content: { gap: 0 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: pdfTheme.colors.border,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: pdfTheme.colors.border,
    paddingVertical: 6,
  },
  hTitle: {
    width: '45%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
    paddingRight: 8,
  },
  hLink: {
    width: '58%',
    fontSize: 9,
    color: pdfTheme.colors.muted,
    fontWeight: 700,
  },
  cTitle: { width: '42%', fontSize: 10, paddingRight: 8 },
  cLink: { width: '58%', fontSize: 9, color: pdfTheme.colors.primary },
});

// URLs contain no spaces, so react-pdf sees them as one unbreakable box that
// runs past the column instead of wrapping. Offering break opportunities at the
// URL delimiters lets the line breaker wrap inside the cell. No hyphen is drawn
// at the break.
const breakUrl = (word: string) => word.split(/(?<=[-/._?&=#])/);

export function hasActiveSubsidies() {
  return $subsidies.get().some(({ isActive }) => isActive);
}

export function PdfSubsidies() {
  const subsidies = $subsidies.get().filter(({ isActive }) => isActive);

  if (subsidies.length === 0) return null;

  return (
    <View style={styles.content}>
      <Text style={pdf.sectionHeader}>
        {i18next.t('energyCalculation:subsidy.sectionTitle')}
      </Text>
      <View style={styles.tableHeader}>
        <Text style={styles.hTitle}>
          {i18next.t('energyCalculation:export.subsidyColumnTitle')}
        </Text>
        <Text style={styles.hLink}>
          {i18next.t('energyCalculation:export.subsidyColumnLink')}
        </Text>
      </View>
      {subsidies.map(({ subsidy }) => (
        <View key={subsidy.title} wrap={false} style={styles.row}>
          <Text style={styles.cTitle}>{subsidy.title}</Text>
          <Text style={styles.cLink} hyphenationCallback={breakUrl}>
            <Link src={subsidy.href}>{subsidy.href}</Link>
          </Text>
        </View>
      ))}
    </View>
  );
}
