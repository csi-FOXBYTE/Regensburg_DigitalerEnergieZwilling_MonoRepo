import { apiClient } from "@/lib/apiClient";
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

// Shows the caller's own token claims; a development aid only. Production
// builds answer /dev with the regular not-found page.
export const Route = createFileRoute("/_with_header/dev/")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: DevPage,
});

function DevPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["auth-verify"],
    queryFn: () =>
      apiClient<{ accessToken: Record<string, unknown> }>(
        "/api/admin/auth/verify",
      ),
  });

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 3 }}>
      <Typography variant="h2" gutterBottom>
        Auth Verify
      </Typography>
      <Card>
        <CardContent>
          {isPending && <CircularProgress />}
          {error && (
            <Typography color="error" fontFamily="monospace">
              {error.message}
            </Typography>
          )}
          {data && (
            <Box
              component="pre"
              sx={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0 }}
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
