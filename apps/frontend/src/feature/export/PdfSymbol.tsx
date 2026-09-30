import { pdfTheme } from '@/config/pdfTheme';
import { Text } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

type Props = {
  style?: Style;
  children: string;
};

export function PdfSymbol({ children, style }: Props) {
  return (
    <Text style={{ ...style, fontFamily: pdfTheme.symbolFontFamily }}>
      {children}
    </Text>
  );
}
