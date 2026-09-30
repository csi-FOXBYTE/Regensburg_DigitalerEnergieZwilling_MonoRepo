import {
  ArrowDownward,
  ArrowUpward,
  SwapVertTwoTone,
} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import type { SubmissionSummary } from "../../../assets/types";
import { statusConfig } from "../../../assets/types";

type SortField = "date" | "address" | "status" | "assignedTo";

function SortIcon({
  field,
  sortBy,
  sortOrder,
}: {
  field: SortField;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
}) {
  if (sortBy !== field)
    return <SwapVertTwoTone fontSize="small" sx={{ color: "text.disabled" }} />;
  return sortOrder === "asc" ? (
    <ArrowUpward fontSize="small" />
  ) : (
    <ArrowDownward fontSize="small" />
  );
}

function TableView({
  records,
  currentUserId,
  currentUserDisplayName,
  handleAssignToMe,
  setRecordToDelete,
  sortBy,
  sortOrder,
  toggleSort,
  variantGroupCounts,
}: {
  records: SubmissionSummary[];
  currentUserId?: string | null;
  currentUserDisplayName?: string | null;
  handleAssignToMe: (record: SubmissionSummary) => void;
  setRecordToDelete: (id: string | null) => void;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  toggleSort: (field: SortField) => void;
  variantGroupCounts: Map<string, number>;
}) {
  const navigate = useNavigate();
  const sortableCellSx = {
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { bgcolor: "action.hover" },
  } as const;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={sortableCellSx} onClick={() => toggleSort("address")}>
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="h4">Adresse</Typography>
              <SortIcon field="address" sortBy={sortBy} sortOrder={sortOrder} />
            </Box>
          </TableCell>

          <TableCell sx={sortableCellSx} onClick={() => toggleSort("date")}>
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="h4">Eingereicht am</Typography>
              <SortIcon field="date" sortBy={sortBy} sortOrder={sortOrder} />
            </Box>
          </TableCell>

          <TableCell sx={sortableCellSx} onClick={() => toggleSort("status")}>
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="h4">Status</Typography>
              <SortIcon field="status" sortBy={sortBy} sortOrder={sortOrder} />
            </Box>
          </TableCell>
          <TableCell
            sx={sortableCellSx}
            onClick={() => toggleSort("assignedTo")}
          >
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="h4">Prüfer</Typography>

              <SortIcon
                field="assignedTo"
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </Box>
          </TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="right">
            <Typography variant="h4">Aktionen</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
              <Typography>Keine Datensätze gefunden.</Typography>
            </TableCell>
          </TableRow>
        ) : (
          records.map((record) => {
            const variantCount = record.variantGroup
              ? (variantGroupCounts.get(record.variantGroup) ?? 0)
              : 0;
            return (
              <TableRow
                key={record.id}
                hover
                sx={{
                  cursor: "pointer",
                  height: 52,
                }}
                onClick={() =>
                  navigate({
                    to: "/record/$id",
                    params: { id: record.id },
                  })
                }
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body1">
                      {record.buildingAddress}
                    </Typography>
                    {variantCount > 1 && (
                      <Chip
                        label={`${variantCount} Einreichungen`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          p: 1.7,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {new Date(record.receivedDate).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[record.status].label}
                    color={statusConfig[record.status].chipColor}
                    size="small"
                    sx={{ minWidth: 80, py: 1.7 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight:
                        record.assignedTo === currentUserId ? 600 : 400,
                      color: record.assignedTo
                        ? record.assignedTo === currentUserId
                          ? "secondary.main"
                          : "text.primary"
                        : "text.secondary",
                    }}
                  >
                    {record.assignedTo
                      ? record.assignedTo === currentUserId
                        ? (currentUserDisplayName ?? "Ich")
                        : "Anderer Prüfer"
                      : "Nicht zugewiesen"}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      minHeight: 36,
                      alignItems: "center",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {record.status === "NEU" && !record.assignedTo && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAssignToMe(record)}
                      >
                        Zuweisen
                      </Button>
                    )}
                    {record.status === "ABGELEHNT" && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setRecordToDelete(record.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

const MemoizedTableView = React.memo(TableView);
export default MemoizedTableView;
