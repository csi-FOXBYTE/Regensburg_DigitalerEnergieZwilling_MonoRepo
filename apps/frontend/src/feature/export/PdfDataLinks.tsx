import { pdfTheme } from '@/config/pdfTheme';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { pdf } from './pdfStyles';

const styles = StyleSheet.create({
  section: { marginTop: 0 },
  item: { marginBottom: 10 },
  label: { ...pdf.muted, marginBottom: 3 },
  link: { fontSize: 10, color: pdfTheme.colors.primary },
});

type Props = {
  recoveryLink?: string;
  deletionLink?: string;
  jsonLink?: string;
};

export function PdfDataLinks({ recoveryLink, deletionLink, jsonLink }: Props) {
  if (!recoveryLink && !deletionLink && !jsonLink) return null;

  return (
    <View style={styles.section}>
      <Text style={pdf.sectionHeader}>
        {i18next.t('energyCalculation:export.dataLinksTitle')}
      </Text>

      {recoveryLink && (
        <View style={styles.item}>
          <Text style={styles.label}>
            {i18next.t('energyCalculation:export.recoveryLinkLabel')}
          </Text>
          <Link src={recoveryLink} style={styles.link}>
            {i18next.t('energyCalculation:export.recoveryLinkText')}
          </Link>
        </View>
      )}

      {jsonLink && (
        <View style={styles.item}>
          <Text style={styles.label}>
            {i18next.t('energyCalculation:export.jsonLinkLabel')}
          </Text>
          <Link src={jsonLink} style={styles.link}>
            {i18next.t('energyCalculation:export.jsonLinkText')}
          </Link>
        </View>
      )}

      {deletionLink && (
        <View style={styles.item}>
          <Text style={styles.label}>
            {i18next.t('energyCalculation:export.deletionLinkLabel')}
          </Text>
          <Link src={deletionLink} style={styles.link}>
            {i18next.t('energyCalculation:export.deletionLinkText')}
          </Link>
        </View>
      )}
    </View>
  );
}
