import { useSubmissions } from "@/hooks/submissionHooks";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DomainIcon from "@mui/icons-material/Domain";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { STATUS_COLORS, statusConfig } from "../../assets/types";
import { AppFooter } from "../../components/Footer";
import { setPendingStatusFilter } from "../TriageView/statusFilterHandoff";
import BuildingMap from "./BuildingMap";

export default function DashboardPage() {
  const { data: submissionsData = [], isError } = useSubmissions();
  const navigate = useNavigate();

  const statusCounts = useMemo(() => {
    const counts = {
      NEU: 0,
      IN_PRUEFUNG: 0,
      FREIGEGEBEN: 0,
      ABGELEHNT: 0,
      ERSETZT: 0,
    };

    for (const submission of submissionsData) {
      counts[submission.status]++;
    }
    return counts;
  }, [submissionsData]);

  const handleBuildingClick = useCallback(
    (r: (typeof submissionsData)[number]) =>
      navigate({ to: "/record/$id", params: { id: r.id } }),
    [navigate],
  );

  const stats: {
    title: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
    status?: keyof typeof statusCounts;
  }[] = [
    {
      title: "Alle Einreichungen",
      value: submissionsData.length,
      icon: <DomainIcon sx={{ fontSize: 28, color: "primary.main" }} />,
      bgColor: "primary.50",
    },
    {
      title: "Neu",
      value: statusCounts.NEU,
      icon: <ErrorOutlineIcon sx={{ fontSize: 28, color: "primary.main" }} />,
      bgColor: "primary.50",
      status: "NEU",
    },
    {
      title: "Freigegeben",
      value: statusCounts.FREIGEGEBEN,
      icon: (
        <CheckCircleOutlineIcon sx={{ fontSize: 28, color: "success.main" }} />
      ),
      bgColor: "success.50",
      status: "FREIGEGEBEN",
    },
    {
      title: "In Prüfung",
      value: statusCounts.IN_PRUEFUNG,
      icon: <HourglassEmptyIcon sx={{ fontSize: 28, color: "warning.main" }} />,
      bgColor: "warning.50",
      status: "IN_PRUEFUNG",
    },
    {
      title: "Ersetzt",
      value: statusCounts.ERSETZT,
      icon: (
        <PublishedWithChangesIcon
          sx={{ fontSize: 28, color: "text.secondary" }}
        />
      ),
      bgColor: "grey.100",
      status: "ERSETZT",
    },
  ];

  const handleStatCardClick = useCallback(
    (status?: keyof typeof statusCounts) => {
      setPendingStatusFilter(status);
      navigate({ to: "/maintenance" });
    },
    [navigate],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={(theme) => ({
          maxWidth: theme.layout.contentMaxWidth,
          mx: "auto",
          py: 3,
          pb: 10,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        })}
      >
        <Box>
          <Typography variant="h2" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1">
            Übersicht aller eingereichten Gebäudedaten
          </Typography>
        </Box>

        {isError && (
          <Alert severity="error">
            Daten konnten nicht geladen werden. Bitte Seite neu laden.
          </Alert>
        )}

        {/* Stats cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(5, 1fr)",
            },
            gap: 2,
          }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.title}
              elevation={2}
              onClick={() => handleStatCardClick(stat.status)}
              sx={{ cursor: "pointer" }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  p: 3,
                  borderRadius: "0px",
                }}
              >
                <Typography variant="h4">{stat.title}</Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: stat.bgColor,
                      borderRadius: 1,
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h3">{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.5fr 1fr" },
            gap: 3,
          }}
        >
          {/* Newest Data */}
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" gutterBottom>
                Neueste Einreichungen
              </Typography>
              <Typography variant="body2" gutterBottom>
                Zuletzt übermittelte Gebäudedaten
              </Typography>
              <List disablePadding>
                {[...submissionsData]
                  .sort(
                    (a, b) =>
                      new Date(b.receivedDate).getTime() -
                      new Date(a.receivedDate).getTime(),
                  )
                  .slice(0, 5)
                  .map((submission, i) => {
                  const cfg = statusConfig[submission.status];
                  return (
                    <Box key={submission.id}>
                      {i > 0 && <Divider />}
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() =>
                            navigate({
                              to: "/record/$id",
                              params: { id: submission.id },
                            })
                          }
                          sx={{ p: 1.5 }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography variant="body1">
                                  {submission.buildingAddress.split(",")[0]}
                                </Typography>
                                <Chip
                                  label={cfg.label}
                                  color={cfg.chipColor}
                                  size="small"
                                  sx={{ flexShrink: 0, px: 2.2, py: 1.7 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Typography component="span" variant="body2">
                                  {`Gebäude-Id: ${submission.buildingId}`}
                                </Typography>
                                <br />
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(
                                    submission.receivedDate,
                                  ).toLocaleString("de-DE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          {/* Map */}
          <Card elevation={2}>
            <CardContent
              sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Box>
                <Typography variant="h3" mb={0.5}>
                  Gebäudekarte
                </Typography>
                <Typography variant="body2">
                  Standorte aller eingereichten Gebäude
                </Typography>
              </Box>

              {/* Legend */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {(
                  [
                    { status: "NEU", label: "Neu" },
                    { status: "IN_PRUEFUNG", label: "In Prüfung" },
                    { status: "FREIGEGEBEN", label: "Freigegeben" },
                    { status: "ABGELEHNT", label: "Abgelehnt" },
                    { status: "ERSETZT", label: "Ersetzt" },
                  ] as const
                ).map(({ status, label }) => (
                  <Box
                    key={label}
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: STATUS_COLORS[status],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Map */}
              <Box
                sx={{
                  height: 360,
                  borderRadius: 0,
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <BuildingMap
                  submissions={submissionsData}
                  onBuildingClick={handleBuildingClick}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <AppFooter
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      />
    </Box>
  );
}
