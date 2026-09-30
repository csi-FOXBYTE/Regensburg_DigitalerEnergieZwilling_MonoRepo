import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({
  open,
  title = "Sind Sie sicher, dass Sie den Eintrag löschen möchten?",
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
    >
      <DialogTitle>
        <Typography variant="h4">Bestätigung erforderlich</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{title}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          Abbrechen
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Löschen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
