import {
  getDisplayName,
  useAvailablePages,
  useCurrentUser,
} from "@/hooks/useCurrentUser";
import { getPageForMatches, type PagePath } from "@/lib/pageAccess";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

export function AppHeader() {
  const currentUser = useCurrentUser();
  const pages = useAvailablePages();
  const navigate = useNavigate();
  const activePage = useRouterState({
    select: (state) => getPageForMatches(state.matches),
  });
  const [logoutOpen, setLogoutOpen] = useState(false);

  const tabValue = pages.some((page) => page.path === activePage)
    ? activePage
    : false;

  return (
    <Box
      sx={(theme) => ({
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: theme.customShadows.header,
      })}
    >
      {/* Top section — 123 px */}
      <Box
        sx={(theme) => ({
          maxWidth: theme.layout.contentMaxWidth,
          mx: "auto",
          pl: 0,
          height: theme.layout.headerTitleHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid",
          borderColor: "divider",
        })}
      >
        <Typography
          variant="h3"
          sx={{
            color: "primary.main",
            whiteSpace: "nowrap",
            fontWeight: 700,
          }}
        >
          Digitaler Energie Zwilling
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: "100%",
            py: 1.5,
          }}
        >
          <Typography
            onClick={() => setLogoutOpen(true)}
            sx={{
              fontSize: 14,
              lineHeight: "22px",
              color: "text.secondary",
              cursor: "pointer",
              "&:hover": { color: "primary.main" },
            }}
          >
            {getDisplayName(currentUser)}
          </Typography>

          {/* Logo */}
          <Box
            component="img"
            src="/logo.png"
            onClick={() => location.assign("https://www.regensburg.de/")}
            alt="Stadt Regensburg"
            sx={{ height: 60, width: "auto", cursor: "pointer" }}
          />
        </Box>
      </Box>

      {/* Bottom nav section — 68 px */}
      <Box
        sx={(theme) => ({
          maxWidth: theme.layout.contentMaxWidth,
          mx: "auto",
          height: theme.layout.headerNavigationHeight,
          display: "flex",
        })}
      >
        <Tabs
          value={tabValue}
          onChange={(_, path: PagePath) => navigate({ to: path })}
        >
          {pages.map((item) => (
            <Tab key={item.path} value={item.path} label={item.label} />
          ))}
        </Tabs>
      </Box>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <DialogTitle>Abmelden</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie sich wirklich abmelden?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setLogoutOpen(false)}>
            Abbrechen
          </Button>
          <Button variant="contained" href="/logout">
            Abmelden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
