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
  updateWindowDefaultType,
  updateWindowsUValue,
} from "../../../hooks/store";
import {
  formatBand,
  getValueForBand,
  sortBands,
  type BandEntry,
  type YearBand,
} from "../../../lib/buildingTypes";
import { CollapsibleSection } from "../CollapsibleSection";

export default function WindowSection({
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
      sectionKey="windows"
      title="Fenster"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" fontWeight="600" mb={1}>
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
          <Typography variant="body2">
            Wärmeverlustfaktor F - Dachfenster
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.windows.roofWindowsHeatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "windows.roofWindowsHeatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography variant="body2">
            Wärmeverlustfaktor F – Außenwandfenster
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.windows.exteriorWallWindowsHeatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "windows.exteriorWallWindowsHeatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography variant="body2">
            Faktor Fläche der Dachfenster über gesamter Dachfläche
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.windows.roofAreaFactor}
            onChange={(e) =>
              updateSimpleValue(
                "windows.roofAreaFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography variant="body2">
            Faktor Fläche der Außenwandfenster über gesamter Außenwandfläche
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.windows.exteriorWallAreaFactor}
            onChange={(e) =>
              updateSimpleValue(
                "windows.exteriorWallAreaFactor",
                parseFloat(e.target.value),
              )
            }
          />
        </Box>

        <Typography variant="body1" fontWeight="600" mb={1} mt={1}>
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
          {configStore.windows.windowTypes.map(
            (
              wt: { value: string; localization: Record<string, string> },
              i: number,
            ) => (
              <Fragment key={wt.value}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", color: "text.secondary" }}
                >
                  {wt.value}
                </Typography>
                <TextField
                  size="small"
                  value={wt.localization.de ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((draft) => {
                      const item = draft.windows.windowTypes[i];
                      if (item) item.localization.de = val;
                    });
                  }}
                />
              </Fragment>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight="600" mb={1}>
          Standard‑Fenstertyp nach Baujahr
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 10,
            rowGap: 2,
            mb: 3,
          }}
        >
          {configStore.windows.defaultWindowType.map(
            (
              band: { from?: number; to?: number; value: string },
              index: number,
            ) => (
              <Box
                key={index}
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
                    updateWindowDefaultType(index, e.target.value)
                  }
                  sx={{ flex: 1 }}
                >
                  {configStore.windows.windowTypes.map(
                    (wt: { value: string; localization: { de: string } }) => (
                      <MenuItem key={wt.value} value={wt.value}>
                        {wt.localization.de}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Box>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight="600" mb={1}>
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
              {configStore.windows.uValue.map(
                (
                  windowType: {
                    key: string;
                    value: { value: number }[];
                  },
                  windowTypeIndex: number,
                ) => (
                  <TableRow key={windowType.key}>
                    <TableCell>
                      {
                        configStore.windows.windowTypes.find(
                          (wt: { value: string }) =>
                            wt.value === windowType.key,
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
                              windowType.value as BandEntry[],
                              band,
                            ) ?? ""
                          }
                          onChange={(e) =>
                            updateWindowsUValue(
                              windowTypeIndex,
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
