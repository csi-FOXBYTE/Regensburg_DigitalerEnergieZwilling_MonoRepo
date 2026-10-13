import {
  Box,
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
  updateRoofUValue,
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

export default function RoofSection({
  configStore,
  expandedSections,
  toggleSection,
}: {
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  configStore: ReturnType<typeof useStore>;
}) {
  const yearBands = sortBands(
    configStore.general.generalYearBands as YearBand[],
  );

  return (
    <CollapsibleSection
      sectionKey="roof"
      title="Dach"
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
            value={configStore.roof.heatLossFactor}
            onChange={(e) =>
              updateSimpleValue(
                "roof.heatLossFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Dämmschichtdicke [m]"
            value={configStore.roof.assumedInsulationThickness}
            onChange={(e) =>
              updateSimpleValue(
                "roof.assumedInsulationThickness",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Wärmeleitfähigkeit λ [W/mK]"
            value={configStore.roof.thermalConductivity}
            onChange={(e) =>
              updateSimpleValue(
                "roof.thermalConductivity",
                parseFloat(e.target.value),
              )
            }
          />

          <TextField
            size="medium"
            type="number"
            label="Minderungsfaktor Zwischensparrendämmung"
            value={configStore.roof.insulationReductionFactor}
            onChange={(e) =>
              updateSimpleValue(
                "roof.insulationReductionFactor",
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
          {configStore.roof.constructionTypes.map(
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
                      const item = draft.roof.constructionTypes[i];
                      if (item) item.localization.de = val;
                    });
                  }}
                />
              </Fragment>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Pauschalwerte für den Wärmedurchgangskoeffizienten in W/(m² · K)
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
              {configStore.roof.uValue.map(
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
                        configStore.roof.constructionTypes.find(
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
                            updateRoofUValue(
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
