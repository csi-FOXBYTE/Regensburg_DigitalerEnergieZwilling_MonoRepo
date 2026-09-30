import { Box, type SxProps, type Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState, type ReactNode } from "react";

function getVersionString(): string {
  return `Frontend v${__FRONTEND_VERSION__} | Core v${__CORE_VERSION__}`;
}

interface AppFooterProps {
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

export function AppFooter({ children, sx }: AppFooterProps) {
  const [appVersion, setAppVersion] = useState("");
  useEffect(() => {
    fetch("/release.json", { cache: "no-store" }).then(response => response.json()).then(data => {
      if (typeof data.appVersion === "string") setAppVersion(data.appVersion);
    }).catch(() => {});
  }, []);
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "text.primary",
        color: (theme) => alpha(theme.palette.common.white, 0.8),
        position: "relative",
        flexShrink: 0,
        px: { xs: "20px", md: "28px" },
        minHeight: 28,
        ...(children && { py: 2.5 }),
        ...sx,
      }}
    >
      {children}
      <Box
        component="span"
        sx={{
          position: "absolute",
          right: "12px",
          bottom: "4px",
          fontSize: "0.75rem",
          opacity: 0.8,
        }}
      >
        App {appVersion ? `v${appVersion}` : "—"} | {getVersionString()}
      </Box>
    </Box>
  );
}
