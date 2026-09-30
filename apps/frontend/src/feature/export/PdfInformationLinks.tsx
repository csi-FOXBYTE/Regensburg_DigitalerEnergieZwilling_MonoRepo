import { pdfTheme } from '@/config/pdfTheme';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';
import { pdf } from './pdfStyles';

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    gap: 6,
  },
  link: {
    fontSize: 10,
    color: pdfTheme.colors.primary,
  },
});

type Props = {
  methodologyLink: string;
  privacyLink: string;
};

export function PdfInformationLinks({ methodologyLink, privacyLink }: Props) {
  return (
    <View wrap={false} style={styles.section}>
      <Text style={pdf.sectionHeader}>
        {i18next.t('energyCalculation:export.informationLinksTitle')}
      </Text>
      <Link src={methodologyLink} style={styles.link}>
        {i18next.t('energyCalculation:export.methodologyLinkText')}
      </Link>
      <Link src={privacyLink} style={styles.link}>
        {i18next.t('energyCalculation:export.privacyLinkText')}
      </Link>
    </View>
  );
}
