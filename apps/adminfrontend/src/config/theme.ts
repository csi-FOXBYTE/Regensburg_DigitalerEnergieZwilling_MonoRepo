import { alpha, createTheme } from "@mui/material/styles";

/**
 * Municipality design configuration.
 *
 * A city adopting the application should be able to establish its visual
 * identity by changing this object. The MUI theme below maps these raw design
 * decisions to semantic palette roles and component defaults.
 */
export const municipalityDesign = {
  colors: {
    black: "#000000",
    brand: {
      main: "#e30613",
      dark: "#8b2412",
      contrastText: "#ffffff",
    },
    destructive: {
      main: "#e30613",
      dark: "#8b2412",
      contrastText: "#ffffff",
    },
    semantic: {
      secondary: "#9c27b0",
      success: "#2e7d32",
      warning: "#ed6c02",
      info: "#0288d1",
    },
    neutral: {
      foreground: "#191919",
      mutedForeground: "#757575",
      divider: "#e5e5e5",
      subtleSurface: "#f5f5f5",
      surface: "#ffffff",
    },
    status: {
      new: "#3b82f6",
      inReview: "#f59e0b",
      approved: "#22c55e",
      rejected: "#C1272D",
      superseded: "#6b7280",
    },
    map: {
      attributionText: "#333333",
    },
  },
  typography: {
    fontFamily: '"Open Sans", sans-serif',
    h1: { fontSize: 48, fontWeight: 700, lineHeight: "58px" },
    h2: { fontSize: 36, fontWeight: 700, lineHeight: "46px" },
    h3: { fontSize: 24, fontWeight: 400, lineHeight: "32px" },
    h4: { fontSize: 18, fontWeight: 700, lineHeight: "28px" },
    h5: { fontSize: 24, fontWeight: 400, lineHeight: "30px" },
    body1: { fontSize: 16, fontWeight: 400, lineHeight: "26px" },
    body2: { fontSize: 14, fontWeight: 400, lineHeight: "22px" },
  },
  shape: {
    borderRadius: 2,
    cardBorderRadius: 0,
  },
  layout: {
    contentMaxWidth: 1170,
    headerTitleHeight: 123,
    headerNavigationHeight: 68,
  },
  shadows: {
    card: "0 0 8px 0 rgb(0 0 0 / 10%)",
    header: "0 4px 10px 0 rgb(0 0 0 / 12%)",
    floating: "0 4px 14px rgb(0 0 0 / 18%)",
    mapMarker: "0 2px 7px rgb(0 0 0 / 35%)",
    selectedMapMarker:
      "0 0 0 3px #191919, 0 2px 7px rgb(0 0 0 / 40%)",
  },
} as const;

declare module "@mui/material/styles" {
  interface Theme {
    layout: typeof municipalityDesign.layout;
    customShadows: typeof municipalityDesign.shadows;
  }

  interface ThemeOptions {
    layout?: typeof municipalityDesign.layout;
    customShadows?: typeof municipalityDesign.shadows;
  }
}

const { colors, typography, shape, layout, shadows } = municipalityDesign;

const theme = createTheme({
  palette: {
    primary: colors.brand,
    // Regensburg currently uses the same red for brand and destructive UI.
    // Keeping the roles separate lets another municipality change either one.
    error: colors.destructive,
    secondary: {
      main: colors.semantic.secondary,
    },
    success: {
      main: colors.semantic.success,
    },
    warning: {
      main: colors.semantic.warning,
    },
    info: {
      main: colors.semantic.info,
    },
    common: {
      black: colors.black,
      white: colors.neutral.surface,
    },
    background: {
      default: colors.neutral.surface,
      paper: colors.neutral.surface,
    },
    text: {
      primary: colors.neutral.foreground,
      secondary: colors.neutral.mutedForeground,
    },
    divider: colors.neutral.divider,
  },
  typography: {
    fontFamily: typography.fontFamily,
    allVariants: {
      color: colors.neutral.foreground,
    },
    h1: typography.h1,
    h2: typography.h2,
    h3: typography.h3,
    h4: typography.h4,
    h5: typography.h5,
    body1: typography.body1,
    body2: typography.body2,
  },
  shape: {
    borderRadius: shape.borderRadius,
  },
  layout,
  customShadows: shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: colors.neutral.foreground,
          backgroundColor: colors.neutral.surface,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: typography.fontFamily,
          fontSize: typography.body1.fontSize,
          lineHeight: typography.body1.lineHeight,
          fontWeight: typography.body1.fontWeight,
          borderRadius: shape.borderRadius,
        },
        sizeMedium: {
          padding: "9px 29px",
        },
        sizeLarge: {
          padding: "9px 29px",
        },
        sizeSmall: {
          paddingLeft: 16,
          paddingRight: 12,
        },
        outlined: {
          "&:hover": {
            backgroundColor: "transparent",
            borderColor: colors.brand.dark,
            color: colors.brand.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: shape.cardBorderRadius,
          boxShadow: shadows.card,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: colors.brand.main,
          "&.Mui-checked": {
            color: colors.brand.main,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: alpha(colors.black, 0.1),
          },
        },
        paper: {
          border: `1px solid ${alpha(colors.black, 0.12)}`,
          boxShadow: "none",
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: typography.body2.fontSize,
          lineHeight: typography.body2.lineHeight,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        inputSizeSmall: {
          padding: "4px 8px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          color: colors.neutral.foreground,
          fontSize: typography.body1.fontSize,
          lineHeight: typography.body1.lineHeight,
          textTransform: "none",
          minHeight: layout.headerNavigationHeight,
          height: layout.headerNavigationHeight,
          paddingLeft: 0,
          paddingRight: 0,
          transition: "color 0.2s",
          "&:hover, &.Mui-selected": {
            color: colors.brand.main,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: layout.headerNavigationHeight,
          height: layout.headerNavigationHeight,
        },
        flexContainer: {
          gap: 24,
        },
        indicator: {
          backgroundColor: colors.brand.main,
          height: 3,
          left: 0,
          right: 24,
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  },
});

export default theme;
