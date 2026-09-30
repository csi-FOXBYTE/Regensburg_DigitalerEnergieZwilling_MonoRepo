import { pdfTheme } from '@/config/pdfTheme';
import OpenSansBold from '@fontsource/open-sans/files/open-sans-math-700-normal.woff?url';
import OpenSansRegular from '@fontsource/open-sans/files/open-sans-math-400-normal.woff?url';
import OpenSansSymbolsBold from '@fontsource/open-sans/files/open-sans-symbols-700-normal.woff?url';
import OpenSansSymbolsRegular from '@fontsource/open-sans/files/open-sans-symbols-400-normal.woff?url';
import { Font } from '@react-pdf/renderer';

Font.register({
  family: pdfTheme.fontFamily,
  fonts: [
    { src: OpenSansRegular, fontWeight: 400 },
    { src: OpenSansBold, fontWeight: 700 },
  ],
});

Font.register({
  family: pdfTheme.symbolFontFamily,
  fonts: [
    { src: OpenSansSymbolsRegular, fontWeight: 400 },
    { src: OpenSansSymbolsBold, fontWeight: 700 },
  ],
});

// Disable automatic hyphenation
Font.registerHyphenationCallback((word) => [word]);
