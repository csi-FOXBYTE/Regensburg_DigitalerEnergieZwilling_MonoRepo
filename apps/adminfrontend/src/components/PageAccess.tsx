import { useAvailablePages, useCurrentUserQuery } from "@/hooks/useCurrentUser";
import { getPageForMatches } from "@/lib/pageAccess";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageAccess({
  children,
  landing = false,
}: {
  children?: ReactNode;
  landing?: boolean;
}) {
  const user = useCurrentUserQuery();
  const pages = useAvailablePages();
  const page = useRouterState({
    select: (state) => getPageForMatches(state.matches),
  });

  if (user.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress aria-label="Zugriffsrechte werden geladen" />
      </Box>
    );
  }

  if (user.isError) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Die Zugriffsrechte konnten nicht geprüft werden. Bitte erneut
          versuchen oder neu anmelden.
        </Alert>
        <Button onClick={() => void user.refetch()}>Erneut versuchen</Button>
        <Button href="/logout">Abmelden</Button>
      </Box>
    );
  }

  const home = pages[0]?.path;
  if (!home) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
        <Typography variant="h2" gutterBottom>
          Kein Zugriff
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Ihrem Konto ist keine Rolle für diesen Verwaltungsbereich zugewiesen.
        </Typography>
        <Button href="/logout">Abmelden</Button>
      </Box>
    );
  }

  if (landing || (page && !pages.some((entry) => entry.path === page))) {
    return <Navigate to={home} replace />;
  }

  // Unmatched URLs remain with the router so they display its not-found page.
  return children;
}
