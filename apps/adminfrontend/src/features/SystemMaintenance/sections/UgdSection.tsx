import {
  Box,
  Checkbox,
  FormControlLabel,
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
  toggleAllowedBottomFloorConstructionType,
  updateBottomFloorDefaultConstructionType,
  updateBottomFloorUValue,
  updateConfig,
  updateSimpleValue,
} from "../../../hooks/store";
import {
  formatBand,
  getValueForBand,
  sortBands,
  type BandEntry,
  type YearBand,
} from "../../../lib/buildingTypes";
import { CollapsibleSection } from "../CollapsibleSection";

export default function UgdSection({
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
      sectionKey="bottomFloor"
      title="Unterste Geschossdecke"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" fontWeight={"bold"} mb={1}>
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
            value={configStore.bottomFloor.heatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "bottomFloor.heatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Dämmschichtdicke [m]"
            value={configStore.bottomFloor.assumedInsulationThickness}
            onChange={(e) =>
              updateSimpleValue(
                "bottomFloor.assumedInsulationThickness",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Wärmeleitfähigkeit λ [W/mK]"
            value={configStore.bottomFloor.thermalConductivity}
            onChange={(e) =>
              updateSimpleValue(
                "bottomFloor.thermalConductivity",
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
          {configStore.bottomFloor.constructionTypes.map(
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
                      const item = draft.bottomFloor.constructionTypes[i];
                      if (item) item.localization.de = val;
                    });
                  }}
                />
              </Fragment>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Erlaubte Konstruktionen nach beheiztem Keller
        </Typography>

        <Box sx={{ mb: 3 }}>
          {configStore.bottomFloor.allowedConstructionTypesByHeatedCellar.map(
            (
              entry: { key: boolean; allowedValues: string[] },
              index: number,
            ) => (
              <Box
                key={index}
                sx={{
                  display: "block",
                  mb: 1,
                }}
              >
                <Typography variant="body2" mb={0.5}>
                  Beheizter Keller: {entry.key ? "ja" : "nein"}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {configStore.bottomFloor.constructionTypes.map(
                    (ct: { value: string; localization: { de: string } }) => (
                      <FormControlLabel
                        key={ct.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={entry.allowedValues.includes(ct.value)}
                            onChange={(e) =>
                              toggleAllowedBottomFloorConstructionType(
                                index,
                                ct.value,
                                e.target.checked,
                              )
                            }
                          />
                        }
                        label={ct.localization.de}
                      />
                    ),
                  )}
                </Box>
              </Box>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Standard‑Konstruktion
        </Typography>

        <Box sx={{ mb: 3 }}>
          {configStore.bottomFloor.defaultConstructionType.map(
            (
              group: {
                key: boolean;
                value: { from?: number; to?: number; value: string }[];
              },
              groupIndex: number,
            ) => (
              <Box key={groupIndex} sx={{ mb: 2 }}>
                <Typography sx={{ mb: 0.75 }} variant="body2">
                  Beheizter Keller:{" "}
                  {String(group.key) == "true" ? "ja" : "nein"}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    columnGap: 2,
                    rowGap: 2,
                    pl: 2,
                  }}
                >
                  {group.value.map(
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
                          updateBottomFloorDefaultConstructionType(
                            groupIndex,
                            bandIndex,
                            e.target.value,
                          )
                        }
                        fullWidth
                      >
                        {configStore.bottomFloor.constructionTypes.map(
                          (ct: {
                            value: string;
                            localization: { de: string };
                          }) => (
                            <MenuItem key={ct.value} value={ct.value}>
                              {ct.localization.de}
                            </MenuItem>
                          ),
                        )}
                      </TextField>
                    ),
                  )}
                </Box>
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
              {configStore.bottomFloor.uValue.map(
                (
                  construction: {
                    key: string;
                    value: { value: number }[];
                  },
                  constructionIndex: number,
                ) => (
                  <TableRow key={construction.key}>
                    <TableCell>
                      {
                        configStore.bottomFloor.constructionTypes.find(
                          (ct: { value: string }) =>
                            ct.value === construction.key,
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
                              construction.value as BandEntry[],
                              band,
                            ) ?? ""
                          }
                          onChange={(e) =>
                            updateBottomFloorUValue(
                              constructionIndex,
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
