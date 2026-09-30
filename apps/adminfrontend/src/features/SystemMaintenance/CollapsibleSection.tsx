import { ChevronRight, ExpandMore } from "@mui/icons-material";
import { Box, Collapse, Paper, Typography } from "@mui/material";

interface CollapsibleSectionProps {
  sectionKey: string;
  title: React.ReactNode;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function CollapsibleSection({
  sectionKey,
  title,
  expandedSections,
  toggleSection,
  action,
  children,
}: CollapsibleSectionProps) {
  return (
    <Paper sx={{ mb: 3, overflow: "hidden", boxShadow: "none" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          color: "primary.main",
          borderBottom: "2px solid",
          borderColor: "common.black",
          cursor: "pointer",
        }}
        onClick={() => toggleSection(sectionKey)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {expandedSections[sectionKey] ? <ExpandMore /> : <ChevronRight />}
          <Typography variant="h3" color="primary">
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Collapse in={expandedSections[sectionKey]} mountOnEnter unmountOnExit>{children}</Collapse>
    </Paper>
  );
}
