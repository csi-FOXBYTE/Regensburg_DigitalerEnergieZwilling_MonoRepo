import { pdfTheme } from '@/config/pdfTheme';
import { StyleSheet } from '@react-pdf/renderer';

export const pdf = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: pdfTheme.fontFamily,
    fontSize: 11,
    color: pdfTheme.colors.foreground,
    backgroundColor: pdfTheme.colors.background,
  },

  // Typography
  h1: { fontSize: 34, fontWeight: 700, lineHeight: 45 / 34 },
  h2: { fontSize: 24, fontWeight: 700, lineHeight: 32 / 24 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 700,
    color: pdfTheme.colors.foreground,
    marginBottom: 10,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: 700,
    color: pdfTheme.colors.foreground,
    marginBottom: 2,
  },
  h3: { fontSize: 12, fontWeight: 700, color: pdfTheme.colors.foreground },
  h4: { fontSize: 11, fontWeight: 700, color: pdfTheme.colors.foreground },
  muted: { fontSize: 10, color: pdfTheme.colors.muted },

  // Reusable flex-wrap row for stacked-label grids
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap' },

  // Card (white box with border, no rounded corners)
  card: {
    backgroundColor: pdfTheme.colors.background,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    padding: 16,
  },
});
