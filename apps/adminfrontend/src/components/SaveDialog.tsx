import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface SaveDialogProps {
  open: boolean;
  defaultName?: string;
  existingNames?: string[];
  onClose: () => void;
  onSave: (fileName: string, autoActivate: boolean) => void;
}

export function SaveDialog({
  open,
  defaultName = "",
  existingNames = [],
  onClose,
  onSave,
}: SaveDialogProps) {
  const [fileName, setFileName] = useState(defaultName);
  const [error, setError] = useState("");
  const [autoActivate, setAutoActivate] = useState(false);

  const handleSave = () => {
    const trimmed = fileName.trim();
    if (!trimmed) {
      setError("Dateiname ist erforderlich");
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError(`Version „${trimmed}" existiert bereits`);
      return;
    }
    onSave(trimmed, autoActivate);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4">Konfiguration speichern</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          autoFocus
          label="Dateiname"
          value={fileName}
          onChange={(e) => {
            setFileName(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          fullWidth
          required
          error={!!error}
          helperText={error}
          sx={{ mt: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={autoActivate}
              onChange={(e) => setAutoActivate(e.target.checked)}
              color="success"
            />
          }
          label="Nach dem Speichern automatisch aktivieren"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
