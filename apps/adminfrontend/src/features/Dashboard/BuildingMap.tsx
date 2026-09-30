import {
  LeafletPortalMap,
  type LeafletPortalMarkerDefinition,
} from "@/components/LeafletPortalMap";
import { Box, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { useMemo, useState, type MouseEvent } from "react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type SubmissionSummary,
} from "../../assets/types";

interface BuildingMapProps {
  submissions: SubmissionSummary[];
  onBuildingClick?: (submission: SubmissionSummary) => void;
  selectedSubmissionId?: string;
}

type BuildingLocation = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  submissions: SubmissionSummary[];
};

function groupByBuilding(submissions: SubmissionSummary[]): BuildingLocation[] {
  const locations = new Map<string, BuildingLocation>();

  for (const submission of submissions) {
    const location = locations.get(submission.buildingId);
    if (location) {
      location.submissions.push(submission);
      continue;
    }

    locations.set(submission.buildingId, {
      id: submission.buildingId,
      address: submission.buildingAddress,
      latitude: submission.latitude,
      longitude: submission.longitude,
      submissions: [submission],
    });
  }

  for (const location of locations.values()) {
    location.submissions.sort(
      (a, b) =>
        new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime(),
    );
  }

  return [...locations.values()];
}

function BuildingMarker({
  location,
  selectedSubmissionId,
  onBuildingClick,
}: {
  location: BuildingLocation;
  selectedSubmissionId?: string;
  onBuildingClick?: (submission: SubmissionSummary) => void;
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const representative = location.submissions[0]!;
  const isSelected = location.submissions.some(
    ({ id }) => id === selectedSubmissionId,
  );
  const street = location.address.split(",")[0];
  const hasVariants = location.submissions.length > 1;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (hasVariants) {
      setMenuAnchor(event.currentTarget);
    } else {
      onBuildingClick?.(representative);
    }
  };

  return (
    <>
      <Tooltip
        arrow
        placement="top"
        disableHoverListener={Boolean(menuAnchor)}
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: "background.paper",
              color: "text.primary",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 0,
              boxShadow: (theme) => theme.customShadows.floating,
            },
          },
          arrow: {
            sx: { color: "background.paper" },
          },
        }}
        title={
          <Box sx={{ minWidth: 180 }}>
            <Typography component="strong" variant="body2">
              {street}
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 1 }}>
              {hasVariants
                ? `${location.submissions.length} Einreichungen – klicken zur Auswahl`
                : `Status: ${STATUS_LABELS[representative.status]}`}
            </Typography>
            {!hasVariants && (
              <Typography variant="caption" component="div">
                Eingereicht: {formatDate(representative.receivedDate)}
              </Typography>
            )}
          </Box>
        }
      >
        <Box
          component="button"
          type="button"
          aria-label={
            hasVariants
              ? `${street}: ${location.submissions.length} Einreichungen auswählen`
              : `${street}: ${STATUS_LABELS[representative.status]}`
          }
          aria-haspopup={hasVariants ? "menu" : undefined}
          aria-expanded={hasVariants ? Boolean(menuAnchor) : undefined}
          aria-pressed={isSelected}
          onClick={handleClick}
          sx={(theme) => ({
            position: "relative",
            display: "block",
            appearance: "none",
            width: 30,
            height: 30,
            p: 0,
            borderRadius: "50%",
            border: `${isSelected ? 5 : 3}px solid`,
            borderColor: "common.white",
            bgcolor: STATUS_COLORS[representative.status],
            boxShadow: isSelected
              ? theme.customShadows.selectedMapMarker
              : theme.customShadows.mapMarker,
            cursor: "pointer",
            transition: "transform 120ms ease, box-shadow 120ms ease",
            "&:hover": { transform: "scale(1.12)" },
            "&:focus-visible": {
              outline: `3px solid ${theme.palette.text.primary}`,
              outlineOffset: 3,
            },
          })}
        >
          {hasVariants && (
            <Box
              component="span"
              sx={{
                position: "absolute",
                top: -9,
                right: -9,
                display: "grid",
                placeItems: "center",
                minWidth: 18,
                height: 18,
                px: 0.5,
                borderRadius: 9,
                bgcolor: "text.primary",
                color: "common.white",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {location.submissions.length}
            </Box>
          )}
        </Box>
      </Tooltip>

      {hasVariants && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          MenuListProps={{ "aria-label": `Einreichungen für ${street}` }}
          slotProps={{
            paper: {
              sx: {
                color: "text.primary",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 0,
                boxShadow: (theme) => theme.customShadows.floating,
              },
            },
          }}
        >
          {location.submissions.map((submission) => (
            <MenuItem
              key={submission.id}
              selected={submission.id === selectedSubmissionId}
              onClick={() => {
                setMenuAnchor(null);
                onBuildingClick?.(submission);
              }}
            >
              <Stack spacing={0.25} sx={{ minWidth: 220 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      flexShrink: 0,
                      borderRadius: "50%",
                      bgcolor: STATUS_COLORS[submission.status],
                    }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {submission.variantLabel ?? "Einreichung"}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {STATUS_LABELS[submission.status]} ·{" "}
                  {formatDate(submission.receivedDate)}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE");
}

export default function BuildingMap({
  submissions,
  onBuildingClick,
  selectedSubmissionId,
}: BuildingMapProps) {
  const locations = useMemo(() => groupByBuilding(submissions), [submissions]);
  const markers = useMemo<LeafletPortalMarkerDefinition[]>(
    () =>
      locations.map((location) => ({
        id: location.id,
        position: [location.latitude, location.longitude],
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        zIndexOffset: location.submissions.some(
          ({ id }) => id === selectedSubmissionId,
        )
          ? 1000
          : 0,
        content: (
          <BuildingMarker
            location={location}
            selectedSubmissionId={selectedSubmissionId}
            onBuildingClick={onBuildingClick}
          />
        ),
      })),
    [locations, onBuildingClick, selectedSubmissionId],
  );

  return (
    <LeafletPortalMap
      markers={markers}
      initialCenter={[49.0207, 12.0972]}
      initialZoom={13}
      tileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution={
        <>
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors
        </>
      }
      ariaLabel="Interaktive Karte der eingereichten Gebäude"
      fitMarkers
      fitBoundsOptions={{ padding: [40, 40], maxZoom: 15 }}
      style={{ width: "100%", height: "100%", minHeight: 360 }}
    />
  );
}
