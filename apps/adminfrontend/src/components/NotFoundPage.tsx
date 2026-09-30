import { Box, Button, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", px: 3, py: 6 }}>
      <Typography variant="h2" gutterBottom>
        Seite nicht gefunden
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Fehler 404: Die angeforderte Seite existiert nicht. Bitte prüfen Sie die
        Adresse oder kehren Sie zur Startseite zurück.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Zur Startseite
      </Button>
    </Box>
  );
}
