import { brand } from '@/config/brand';
import { pdfTheme } from '@/config/pdfTheme';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: pdfTheme.colors.foreground,
  },
  logo: {
    height: 36,
  },
});

type Props = {
  title: string;
};

export function PdfHeader({ title }: Props) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>{title}</Text>
      <Image src={brand.logo.src} style={styles.logo} />
    </View>
  );
}
