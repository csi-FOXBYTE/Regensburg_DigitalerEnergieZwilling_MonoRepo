import type { RecordStatus, SubmissionSummary } from "@/assets/types";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { AppFooter } from "@/components/Footer";
import {
  useAssignSubmission,
  useDeleteSubmission,
  useSubmissions,
} from "@/hooks/submissionHooks";
import { getDisplayName, useCurrentUser } from "@/hooks/useCurrentUser";
import { downloadDeletionReceipt } from "@/lib/deletionReceipt";
import { Alert, Box, Card, CardContent, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import FiltersControls from "./parts/FiltersControls";
import PaginationView from "./parts/Pagination";
import { consumePendingStatusFilter } from "./statusFilterHandoff";
import TableView from "./parts/Table";

export function Dashboard() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: records = [], isError } = useSubmissions();
  const assignMutation = useAssignSubmission();
  const deleteMutation = useDeleteSubmission();

  const [addressFilter, setAddressFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    () => consumePendingStatusFilter() ?? "all",
  );
  const [sortBy, setSortBy] = useState<
    "date" | "address" | "status" | "assignedTo"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [myRecordsOn, setMyRecordsOn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredAndSortedRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      const matchesAddress = record.buildingAddress
        .toLowerCase()
        .includes(addressFilter.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;
      const matchesMe = !myRecordsOn || record.assignedTo === currentUser?.sub;
      return matchesAddress && matchesStatus && matchesMe;
    });

    filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "date") {
        comp =
          new Date(a.receivedDate).getTime() -
          new Date(b.receivedDate).getTime();
      } else if (sortBy === "address") {
        comp = a.buildingAddress.localeCompare(b.buildingAddress);
      } else if (sortBy === "status") {
        comp = a.status.localeCompare(b.status);
      } else if (sortBy === "assignedTo") {
        comp = (a.assignedTo ?? "").localeCompare(b.assignedTo ?? "");
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return filtered;
  }, [
    records,
    addressFilter,
    statusFilter,
    sortBy,
    sortOrder,
    myRecordsOn,
    currentUser?.sub,
  ]);

  const variantGroupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of records) {
      if (r.variantGroup)
        counts.set(r.variantGroup, (counts.get(r.variantGroup) ?? 0) + 1);
    }
    return counts;
  }, [records]);

  const deduplicatedRecords = useMemo(() => {
    const statusPriority: Record<RecordStatus, number> = {
      IN_PRUEFUNG: 0,
      NEU: 1,
      FREIGEGEBEN: 2,
      ABGELEHNT: 3,
      ERSETZT: 4,
    };
    const best = new Map<string, SubmissionSummary>();
    for (const r of filteredAndSortedRecords) {
      if (!r.variantGroup) continue;
      const cur = best.get(r.variantGroup);
      if (!cur || statusPriority[r.status] < statusPriority[cur.status]) {
        best.set(r.variantGroup, r);
      }
    }
    return filteredAndSortedRecords.filter(
      (r) => !r.variantGroup || best.get(r.variantGroup)?.id === r.id,
    );
  }, [filteredAndSortedRecords]);

  const totalPages = Math.ceil(deduplicatedRecords.length / itemsPerPage);
  const effectivePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (effectivePage - 1) * itemsPerPage;
    return deduplicatedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [deduplicatedRecords, effectivePage, itemsPerPage]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["submissions"] });
  }, [queryClient]);

  const handleAssignToMe = useCallback(
    (record: SubmissionSummary) => {
      if (!currentUser?.sub) return toast.error("Kein Benutzer — Token fehlt.");
      if (record.assignedTo && record.assignedTo !== currentUser.sub)
        return toast.error(
          "Dieser Datensatz ist bereits einem anderen Prüfer zugewiesen.",
        );
      if (record.status !== "NEU")
        return toast.error("Nur neue Datensätze können zugewiesen werden.");
      assignMutation.mutate(
        { submissionId: record.id, userId: currentUser.sub },
        {
          onSuccess: () => {
            invalidate();
            toast.success("Datensatz zugewiesen. Status: In Prüfung");
          },
          onError: () => toast.error("Zuweisung fehlgeschlagen."),
        },
      );
    },
    [currentUser, assignMutation, invalidate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(
        { submissionId: id },
        {
          onSuccess: (result) => {
            invalidate();
            setRecordToDelete(null);
            downloadDeletionReceipt(result.receipt);
            toast.success(
              "Datensatz wurde gelöscht. Der Löschbeleg wurde heruntergeladen.",
            );
          },
          onError: () => toast.error("Löschen fehlgeschlagen."),
        },
      );
    },
    [deleteMutation, invalidate],
  );

  const resetSort = useCallback(() => {
    setSortBy("date");
    setSortOrder("desc");
  }, []);

  const toggleSort = useCallback(
    (field: "date" | "address" | "status" | "assignedTo") => {
      if (field === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  const refreshData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["submissions"] });
  }, [queryClient]);

  return (
    <Box sx={{ width: "full" }}>
      <Box
        sx={(theme) => ({
          maxWidth: theme.layout.contentMaxWidth,
          mx: "auto",
          py: 3,
          pb: 10,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: "90vh",
        })}
      >
        <Box>
          <Typography variant="h2" gutterBottom>
            Gebäudeliste
          </Typography>
          <Typography variant="body1">
            Verwalten und prüfen Sie alle eingereichten Gebäudedaten
          </Typography>
        </Box>

        {isError && (
          <Alert severity="error">
            Daten konnten nicht geladen werden. Bitte Seite neu laden.
          </Alert>
        )}

        <FiltersControls
          refreshData={refreshData}
          addressFilter={addressFilter}
          setAddressFilter={(v) => {
            setAddressFilter(v);
            setCurrentPage(1);
          }}
          setStatusFilter={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          resetSort={resetSort}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          }}
          myRecordsOn={myRecordsOn}
          setMyRecordsOn={(v) => {
            setMyRecordsOn(v);
            setCurrentPage(1);
          }}
        />

        <Card>
          <CardContent sx={{ pt: 2 }}>
            <TableView
              records={paginatedRecords}
              currentUserId={currentUser?.sub}
              currentUserDisplayName={getDisplayName(currentUser)}
              handleAssignToMe={handleAssignToMe}
              setRecordToDelete={setRecordToDelete}
              sortBy={sortBy}
              sortOrder={sortOrder}
              toggleSort={toggleSort}
              variantGroupCounts={variantGroupCounts}
            />
            <PaginationView
              setCurrentPage={setCurrentPage}
              currentPage={effectivePage}
              totalPages={totalPages}
            />
          </CardContent>
        </Card>
      </Box>

      <ConfirmDeleteDialog
        open={!!recordToDelete}
        title="Sind Sie sicher, dass Sie diesen unplausiblen Datensatz löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={() => recordToDelete && handleDelete(recordToDelete)}
        onCancel={() => setRecordToDelete(null)}
      />
      <AppFooter
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      />
    </Box>
  );
}
