import {
  Box,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useStore } from "@nanostores/react";
import { Fragment } from "react";
import {
  updateConfig,
  updateSimpleValue,
  updateTopFloorDefaultType,
  updateTopFloorUValue,
} from "../../../hooks/store";
import {
  formatBand,
  getValueForBand,
  sortBands,
  type BandEntry,
  type YearBand,
} from "../../../lib/buildingTypes";
import { CollapsibleSection } from "../CollapsibleSection";

export default function OgdSection({
  configStore,
  expandedSections,
  toggleSection,
}: {
  configStore: ReturnType<typeof useStore>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const yearBands = sortBands(
    configStore.general.generalYearBands as YearBand[],
  );

  return (
    <CollapsibleSection
      sectionKey="topFloor"
      title="Oberste Geschossdecke"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" fontWeight={"bold"} mb={1.5}>
          Allgemeine Parameter
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            alignItems: "start",
            columnGap: 2,
            rowGap: 2,
            mb: 3,
          }}
        >
          <TextField
            size="medium"
            type="number"
            label="Wärmeverlustfaktor F"
            value={configStore.topFloor.heatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "topFloor.heatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Dämmschichtdicke [m]"
            value={configStore.topFloor.assumedInsulationThickness}
            onChange={(e) =>
              updateSimpleValue(
                "topFloor.assumedInsulationThickness",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Wärmeleitfähigkeit λ [W/mK]"
            value={configStore.topFloor.thermalConductivity}
            onChange={(e) =>
              updateSimpleValue(
                "topFloor.thermalConductivity",
                parseFloat(e.target.value),
              )
            }
          />
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1} mt={1}>
          Bezeichnungen
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 1.5,
            alignItems: "start",
            mb: 3,
          }}
        >
          {configStore.topFloor.topFloorTypes.map(
            (
              ct: { value: string; localization: Record<string, string> },
              i: number,
            ) => (
              <Fragment key={ct.value}>
                <TextField
                  size="medium"
                  label={ct.value}
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={ct.localization.de ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((draft) => {
                      const item = draft.topFloor.topFloorTypes[i];
                      if (item) item.localization.de = val;
                    });
                  }}
                />
              </Fragment>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Standard‑Deckentyp nach Baujahr
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          {configStore.topFloor.defaultTopFloorType.map(
            (
              band: { from?: number; to?: number; value: string },
              bandIndex: number,
            ) => (
              <TextField
                key={bandIndex}
                select
                size="medium"
                label={`Baujahr ${formatBand(band)}`}
                slotProps={{ inputLabel: { shrink: true } }}
                value={band.value}
                onChange={(e) =>
                  updateTopFloorDefaultType(bandIndex, e.target.value)
                }
                fullWidth
              >
                {configStore.topFloor.topFloorTypes.map(
                  (type: { value: string; localization: { de: string } }) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.localization.de}
                    </MenuItem>
                  ),
                )}
              </TextField>
            ),
          )}
        </Box>
        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Pauschalwerte für den Wärmedurchgangskoeffizienten in W/(m² * K)
        </Typography>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Konstruktion \ Baualtersklasse</TableCell>
                {yearBands.map((band, bandIndex) => (
                  <TableCell key={bandIndex} align="center">
                    {formatBand(band)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {configStore.topFloor.uValue.map(
                (
                  ceilingType: {
                    key: string;
                    value: { value: number }[];
                  },
                  ceilingIndex: number,
                ) => (
                  <TableRow key={ceilingType.key}>
                    <TableCell>
                      {
                        configStore.topFloor.topFloorTypes.find(
                          (ct: { value: string }) =>
                            ct.value === ceilingType.key,
                        ).localization.de
                      }
                    </TableCell>
                    {yearBands.map((band, bandIndex) => (
                      <TableCell key={bandIndex} align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={
                            getValueForBand(
                              ceilingType.value as BandEntry[],
                              band,
                            ) ?? ""
                          }
                          onChange={(e) =>
                            updateTopFloorUValue(
                              ceilingIndex,
                              band,
                              parseFloat(e.target.value),
                            )
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </CollapsibleSection>
  );
}
