import { SearchRounded, SortRounded } from "@mui/icons-material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 35, 50, 100];

const sharedTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    "& input": {
      py: 1,
      px: 1,
    },
    "& .MuiSelect-select": {
      py: 1,
      px: 1.5,
    },
    "& fieldset": {
      borderColor: "divider",
      transition: "border-color 0.2s",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: "1.5px",
    },
  },
} as const;

export function FiltersControls({
  refreshData,
  addressFilter,
  setAddressFilter,
  setStatusFilter,
  statusFilter,
  resetSort,
  itemsPerPage,
  setItemsPerPage,
  myRecordsOn,
  setMyRecordsOn,
}: {
  refreshData: () => void;
  addressFilter: string;
  setAddressFilter: React.Dispatch<React.SetStateAction<string>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  resetSort: () => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  myRecordsOn: boolean;
  setMyRecordsOn: (v: boolean) => void;
}) {
  const [localAddressFilter, setLocalAddressFilter] = useState(addressFilter);
  const debouncedAddressFilter = useDebounce(localAddressFilter, 500);

  useEffect(() => {
    setAddressFilter(debouncedAddressFilter);
  }, [debouncedAddressFilter, setAddressFilter]);

  useEffect(() => {
    setLocalAddressFilter(addressFilter);
  }, [addressFilter]);

  return (
    <Paper sx={(theme) => ({ p: 2, boxShadow: theme.customShadows.card })}>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h3">Filter und Suche</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={refreshData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sortierung zurücksetzen">
            <IconButton onClick={resetSort} size="small">
              <SortRounded />
            </IconButton>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Suche nach Adresse..."
            value={localAddressFilter}
            onChange={(e) => setLocalAddressFilter(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small"></SearchRounded>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              maxWidth: 450,
              ...sharedTextFieldSx,
            }}
          />

          <TextField
            size="small"
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string)}
            sx={{
              minWidth: 140,
              ...sharedTextFieldSx,
            }}
          >
            <MenuItem value="all">Alle Status</MenuItem>
            <MenuItem value="NEU">Neu</MenuItem>
            <MenuItem value="IN_PRUEFUNG">In Prüfung</MenuItem>
            <MenuItem value="FREIGEGEBEN">Freigegeben</MenuItem>
            <MenuItem value="ABGELEHNT">Abgelehnt</MenuItem>
            <MenuItem value="ERSETZT">Ersetzt</MenuItem>
          </TextField>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              Einträge pro Seite:
            </Typography>
            <TextField
              size="small"
              select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              sx={{ minWidth: 90, ...sharedTextFieldSx }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={myRecordsOn}
                onChange={(e) => setMyRecordsOn(e.target.checked)}
                size="small"
                sx={{
                  color: "text.disabled",
                }}
              />
            }
            label="Nur meine"
            sx={{ ml: 0, whiteSpace: "nowrap" }}
          />
        </Box>
      </Box>
    </Paper>
  );
}

export default FiltersControls;
