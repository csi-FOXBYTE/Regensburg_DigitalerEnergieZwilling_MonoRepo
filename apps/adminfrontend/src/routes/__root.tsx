import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import theme from "../config/theme";
import "../lib/localization/i18next";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
