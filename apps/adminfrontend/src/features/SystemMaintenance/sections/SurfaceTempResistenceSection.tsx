import { HeatFlowDirection } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";

const HEAT_FLOW_LABELS: Record<HeatFlowDirection, string> = {
  [HeatFlowDirection.UPWARD]: "Aufwärts",
  [HeatFlowDirection.DOWNWARD]: "Abwärts",
  [HeatFlowDirection.HORIZONTAL]: "Horizontal",
};

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useStore } from "@nanostores/react";
import { CollapsibleSection } from "../CollapsibleSection";
import {
  updateInnerSurfaceThermalResistance,
  updateOuterSurfaceThermalResistance,
} from "../../../hooks/store";

export default function SurfaceTempResistenceSection({
  configStore,
  expandedSections,
  toggleSection,
}: {
  configStore: ReturnType<typeof useStore>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  return (
    <CollapsibleSection
      sectionKey="surfaceTempResistence"
      title="Wärmeübergangswiderstände"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Wärmeflussrichtung
                  </TableCell>
                  {(
                    configStore.heat.innerSurfaceThermalResistance as {
                      key: HeatFlowDirection;
                      value: number;
                    }[]
                  ).map((entry) => (
                    <TableCell
                      key={entry.key}
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      {HEAT_FLOW_LABELS[entry.key]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow hover>
                  <TableCell>
                    Innen (R<sub>si</sub>)
                  </TableCell>
                  {(
                    configStore.heat.innerSurfaceThermalResistance as {
                      key: HeatFlowDirection;
                      value: number;
                    }[]
                  ).map((innerEntry) => (
                    <TableCell key={innerEntry.key} align="center">
                      <TextField
                        size="small"
                        type="number"
                        value={innerEntry.value}
                        onChange={(e) =>
                          updateInnerSurfaceThermalResistance(
                            innerEntry.key,
                            parseFloat(e.target.value),
                          )
                        }
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow hover>
                  <TableCell>
                    Außen (R<sub>se</sub>)
                  </TableCell>
                  {(
                    configStore.heat.innerSurfaceThermalResistance as {
                      key: HeatFlowDirection;
                      value: number;
                    }[]
                  ).map((innerEntry) => {
                    const outerEntry = (
                      configStore.heat.outerSurfaceThermalResistance as {
                        key: HeatFlowDirection;
                        value: number;
                      }[]
                    ).find((o) => o.key === innerEntry.key);
                    return (
                      <TableCell key={innerEntry.key} align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={outerEntry?.value ?? ""}
                          onChange={(e) =>
                            updateOuterSurfaceThermalResistance(
                              innerEntry.key,
                              parseFloat(e.target.value),
                            )
                          }
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
    </CollapsibleSection>
  );
}
