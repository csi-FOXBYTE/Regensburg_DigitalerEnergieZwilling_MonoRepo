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
            gridTemplateColumns: "1fr 110px 1fr 110px",
            alignItems: "center",
            columnGap: 10,
            rowGap: 2,
            mb: 3,
          }}
        >
          <Typography variant="body2">Wärmeverlustfaktor F</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.topFloor.heatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "topFloor.heatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography variant="body2">Dämmschichtdicke [m]</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.topFloor.assumedInsulationThickness}
            onChange={(e) =>
              updateSimpleValue(
                "topFloor.assumedInsulationThickness",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography variant="body2">Wärmeleitfähigkeit λ [W/mK]</Typography>
          <TextField
            size="small"
            type="number"
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
            gridTemplateColumns: "1fr 2fr",
            gap: 1.5,
            alignItems: "center",
            maxWidth: 800,
            mb: 3,
          }}
        >
          {configStore.topFloor.topFloorTypes.map(
            (
              ct: { value: string; localization: Record<string, string> },
              i: number,
            ) => (
              <Fragment key={ct.value}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", color: "text.secondary" }}
                >
                  {ct.value}
                </Typography>
                <TextField
                  size="small"
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
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            mb: 3,
          }}
        >
          {configStore.topFloor.defaultTopFloorType.map(
            (
              band: { from?: number; to?: number; value: string },
              bandIndex: number,
            ) => (
              <Box
                key={bandIndex}
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <Typography sx={{ minWidth: 120 }} variant="body2">
                  Baujahr&nbsp;{formatBand(band)}
                </Typography>
                <TextField
                  select
                  size="small"
                  value={band.value}
                  onChange={(e) =>
                    updateTopFloorDefaultType(bandIndex, e.target.value)
                  }
                  sx={{ flex: 1 }}
                >
                  {configStore.topFloor.topFloorTypes.map(
                    (type: { value: string; localization: { de: string } }) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.localization.de}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Box>
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
