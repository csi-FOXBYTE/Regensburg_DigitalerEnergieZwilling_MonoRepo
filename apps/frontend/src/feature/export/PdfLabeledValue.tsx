import { pdfTheme } from '@/config/pdfTheme';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  field: {
    width: '33%',
    paddingRight: 12,
    marginBottom: 5,
  },
  label: {
    fontSize: 8,
    color: pdfTheme.colors.muted,
    marginBottom: 2,
    lineHeight: 1.3,
  },
  value: {
    fontSize: 11,
    color: pdfTheme.colors.foreground,
  },
});

type Props = {
  label: string;
  value: string;
};

export function PdfLabeledValue({ label, value }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
