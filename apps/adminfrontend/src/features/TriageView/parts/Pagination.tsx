import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Typography } from "@mui/material";

export function PaginationView({
  setCurrentPage,
  currentPage,
  totalPages,
}: {
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  currentPage: number;
  totalPages: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
      }}
    >
      <Button
        variant="outlined"
        size="small"
        startIcon={<ChevronLeftIcon />}
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        Vorherige
      </Button>
      <Typography variant="body1">
        {totalPages === 0 ? "Keine Ergebnisse" : `Seite ${currentPage} von ${totalPages}`}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        endIcon={<ChevronRightIcon />}
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        Nächste
      </Button>
    </Box>
  );
}

export default PaginationView;
