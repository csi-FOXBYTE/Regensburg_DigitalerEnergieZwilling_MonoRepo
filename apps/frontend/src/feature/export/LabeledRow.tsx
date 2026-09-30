import { pdfTheme } from '@/config/pdfTheme';
import { StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  label: {
    width: '60%',
    color: pdfTheme.colors.foreground,
  },
  value: {
    width: '40%',
    color: pdfTheme.colors.foreground,
    fontWeight: 700,
  },
});

type Props = {
  label: string;
  value: string;
  fontSize?: number;
};

export function LabeledRow({ label, value, fontSize = 11 }: Props) {
  const textStyle = { fontSize, lineHeight: (fontSize + 6) / fontSize };
  return (
    <View style={styles.row}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <Text style={[styles.value, textStyle]}>{value}</Text>
    </View>
  );
}
