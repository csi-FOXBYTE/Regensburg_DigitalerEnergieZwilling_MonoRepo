import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import LanguageIcon from "@mui/icons-material/Language";
import PublicOffIcon from "@mui/icons-material/PublicOff";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { ConfigMeta } from "../../hooks/configHooks";

interface ConfigManagementDialogProps {
  open: boolean;
  onClose: () => void;
  configs: ConfigMeta[];
  activeVersionName?: string;
  loadedVersionName: string;
  onLoad: (versionName: string) => void;
  onActivate: (versionName: string) => void;
  onDelete: (versionName: string) => void;
}

function formatDate(iso?: unknown) {
  if (!iso) return "–";
  return new Date(String(iso)).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ConfigManagementDialog({
  open,
  onClose,
  configs,
  activeVersionName,
  loadedVersionName,
  onLoad,
  onActivate,
  onDelete,
}: ConfigManagementDialogProps) {
  const [page, setPage] = useState(0);
  const [activeErrorOpen, setActiveErrorOpen] = useState(false);

  const sortedConfigs = activeVersionName
    ? [
        ...configs.filter((c) => c.versionName === activeVersionName),
        ...configs.filter((c) => c.versionName !== activeVersionName),
      ]
    : configs;

  const pageSize = 3;
  const maxPage = Math.max(0, Math.ceil(sortedConfigs.length / pageSize) - 1);
  const safePage = Math.min(page, maxPage);
  const paginated = sortedConfigs.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const handleDeleteClick = (versionName: string, isActive: boolean) => {
    if (isActive) {
      setActiveErrorOpen(true);
    } else {
      onDelete(versionName);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h3">Konfigurationen verwalten</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="body1" fontWeight={"bold"}>
                    Konfiguration
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight={"bold"}>
                    Erstellt
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight={"bold"}>
                    Veröffentlicht
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight={"bold"}>
                    Aktionen
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((cfg) => {
                const isActive = cfg.versionName === activeVersionName;
                const isLoaded = cfg.versionName === loadedVersionName;
                return (
                  <TableRow
                    key={cfg.versionName}
                    hover
                    onClick={() => onLoad(cfg.versionName)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isActive
                        ? "success.50"
                        : isLoaded
                          ? "action.selected"
                          : undefined,
                      "&:hover": {
                        bgcolor: isActive ? "success.100" : undefined,
                      },
                      "&:last-child td": { border: 0 },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body1">
                          {cfg.versionName}
                        </Typography>
                        {isLoaded && (
                          <Typography variant="body2" color="text.secondary">
                            (geladen)
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {formatDate(cfg.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        color={isActive ? "text.primary" : "text.disabled"}
                      >
                        {isActive ? formatDate(cfg.publishedAt) : "Deaktiviert"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Tooltip title={isActive ? "Aktiv" : "Aktivieren"}>
                          <IconButton
                            color={isActive ? "success" : "default"}
                            onClick={() => { if (!isActive) onActivate(cfg.versionName); }}
                          >
                            {isActive ? <LanguageIcon /> : <PublicOffIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleDeleteClick(cfg.versionName, isActive)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedConfigs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Keine Konfigurationen vorhanden
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={sortedConfigs.length}
            page={safePage}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[]}
            onPageChange={(_, newPage) => setPage(newPage)}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} von ${count}`
            }
          />
        </DialogContent>
      </Dialog>

      {/* Active config error dialog */}
      <Dialog
        open={activeErrorOpen}
        onClose={() => setActiveErrorOpen(false)}
      >
        <DialogTitle>Löschen nicht möglich</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Die aktive Konfiguration kann nicht gelöscht werden. Bitte zuerst
            eine andere Konfiguration aktivieren.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActiveErrorOpen(false)}
            variant="contained"
          >
            Verstanden
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
