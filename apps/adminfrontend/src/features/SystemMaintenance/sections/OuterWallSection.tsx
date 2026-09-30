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
  updateConfig,
  updateOuterWallConstructionType,
  updateOuterWallDefaultConstructionType,
  updateOuterWallUValue,
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

export default function OuterWallSection({
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
      sectionKey="outerWall"
      title="Außenwand"
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
            value={configStore.outerWall.heatLossFactor}
            onChange={(e) =>
              updateSimpleValue("outerWall.heatLossFactor", e.target.value)
            }
          />

          <Typography variant="body2">Dämmschichtdicke [m]</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.outerWall.assumedInsulationThickness}
            onChange={(e) =>
              updateSimpleValue(
                "outerWall.assumedInsulationThickness",
                e.target.value,
              )
            }
          />

          <Typography variant="body2">Wärmeleitfähigkeit λ [W/mK]</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.outerWall.thermalConductivity}
            onChange={(e) =>
              updateSimpleValue("outerWall.thermalConductivity", e.target.value)
            }
          />
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1} mt={1}>
          Bezeichnungen
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr auto",
            gap: 1.5,
            alignItems: "center",
            maxWidth: 900,
            mb: 3,
          }}
        >
          {configStore.outerWall.constructionTypes.map(
            (
              ct: {
                value: string;
                localization: Record<string, string>;
                allowsAdditionalInsulation?: boolean;
              },
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
                      const item = draft.outerWall.constructionTypes[i];
                      if (item) item.localization.de = val;
                    });
                  }}
                />
                <FormControlLabel
                  sx={{ whiteSpace: "nowrap", mr: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!ct.allowsAdditionalInsulation}
                      onChange={(e) =>
                        updateOuterWallConstructionType(i, (draft) => {
                          draft.allowsAdditionalInsulation = e.target.checked;
                        })
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Zusätzliche Dämmung möglich
                    </Typography>
                  }
                />
              </Fragment>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Standard‑Konstruktion nach Baujahr
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
          {configStore.outerWall.defaultConstructionType.map(
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
                    updateOuterWallDefaultConstructionType(
                      index,
                      e.target.value,
                    )
                  }
                  sx={{ flex: 1 }}
                >
                  {configStore.outerWall.constructionTypes.map(
                    (ct: { value: string; localization: { de: string } }) => (
                      <MenuItem key={ct.value} value={ct.value}>
                        {ct.localization.de}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Box>
            ),
          )}
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Pauschalwerte für den Wärmedurchgangskoeffizienten [W/m²K]
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
              {configStore.outerWall.uValue.map(
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
                        configStore.outerWall.constructionTypes.find(
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
                            updateOuterWallUValue(
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
