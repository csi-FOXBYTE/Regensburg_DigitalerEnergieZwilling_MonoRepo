import { pdfTheme } from '@/config/pdfTheme';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import i18next from 'i18next';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  text: {
    fontSize: 10,
    color: pdfTheme.colors.muted,
  },
});

export function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text
        style={styles.text}
        render={({ pageNumber, totalPages }) =>
          i18next.t('energyCalculation:export.pageOf', {
            page: pageNumber,
            total: totalPages,
          })
        }
      />
    </View>
  );
}
