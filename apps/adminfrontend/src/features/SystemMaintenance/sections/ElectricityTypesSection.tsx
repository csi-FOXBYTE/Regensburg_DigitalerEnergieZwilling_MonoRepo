import { ChevronRight, Delete, Edit, ExpandMore } from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import {
  addElectricityType,
  config,
  deleteElectricityType,
  updateConfig,
  updateElectricityType,
  updateElectricityTypeData,
  updateElectricityTypeDate,
  updateElectricityTypeSource,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import { type DeleteConfirmState, type EditState } from "../ConfigOverview";

const gridSx = {
  display: "grid",
  gridTemplateColumns: "1fr 140px 2rem 1fr 140px",
  gap: 1.5,
  alignItems: "center",
};

export default function ElectricityTypesSection({
  configStore,
  setEditState,
  setDeleteConfirm,
  expandedSections,
  toggleSection,
}: {
  configStore: ReturnType<typeof config.get>;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<DeleteConfirmState>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const [expandedTypes, setExpandedTypes] = useState<Record<number, boolean>>(
    {},
  );

  const handleDeleteConfirm = (onConfirm: () => void) =>
    setDeleteConfirm({ open: true, onConfirm });

  const toggleType = (index: number) =>
    setExpandedTypes((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleAddElectricityType = () => {
    setEditState({
      open: true,
      title: "Neuen Stromtyp hinzufügen",
      fields: [
        {
          key: "value",
          label: "Key (technischer Bezeichner)",
          value: "",
          type: "text",
          required: true,
        },
        {
          key: "de",
          label: "Bezeichnung (Deutsch)",
          value: "",
          type: "text",
          required: true,
        },
      ],
      onSave: (strings) => {
        addElectricityType({
          value: strings.value ?? "",
          localization: { de: strings.de ?? "", en: strings.de ?? "" },
        });
        toast.success("Stromtyp hinzugefügt");
      },
    });
  };

  const handleEditElectricityType = (
    index: number,
    item: { value: string; localization: Record<string, string> },
  ) => {
    setEditState({
      open: true,
      title: "Stromtyp bearbeiten",
      fields: [
        {
          key: "value",
          label: "Key (technischer Bezeichner)",
          value: item.value,
          type: "text",
          required: true,
        },
        {
          key: "de",
          label: "Bezeichnung",
          value: item.localization.de ?? "",
          type: "text",
          required: true,
        },
      ],
      onSave: (strings) => {
        const oldKey = item.value;
        const newKey = (strings.value ?? "").trim();
        const newDe = strings.de ?? "";
        if (newKey !== oldKey) {
          updateConfig((draft) => {
            const type = draft.heat.electricityTypes.find(
              (t) => t.value === oldKey,
            );
            if (type) {
              type.value = newKey;
              type.localization.de = newDe;
              type.localization.en = newDe;
            }
            const data = draft.heat.electricityTypeData.find(
              (d) => d.key === oldKey,
            );
            if (data) data.key = newKey;
            if (draft.heat.defaultElectricityType === oldKey) {
              draft.heat.defaultElectricityType = newKey;
            }
          });
        } else {
          updateElectricityType(index, (draft) => {
            draft.localization.de = newDe;
            draft.localization.en = newDe;
          });
        }
        toast.success("Stromtyp aktualisiert");
      },
    });
  };

  return (
    <CollapsibleSection
      sectionKey="electricityTypes"
      title={`Stromtypen (${configStore.heat.electricityTypes.length})`}
      expandedSections={expandedSections}
      toggleSection={toggleSection}
      action={
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            handleAddElectricityType();
          }}
        >
          Neuer Stromtyp +
        </Button>
      }
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: "bold" }}>Bezeichnung</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: "bold" }}>Aktionen</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configStore.heat.electricityTypes.map((item, index) => {
              const data = configStore.heat.electricityTypeData.find(
                (d) => d.key === item.value,
              )?.value;

              return (
                <Fragment>
                  <TableRow hover key={index}>
                    <TableCell sx={{ fontSize: "medium" }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleType(index)}
                      >
                        {expandedTypes[index] ? (
                          <ExpandMore fontSize="small" />
                        ) : (
                          <ChevronRight fontSize="small" />
                        )}
                      </IconButton>
                      {item.localization.de}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditElectricityType(index, item)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteConfirm(() => {
                            deleteElectricityType(item.value);
                            toast.success("Stromtyp gelöscht");
                          })
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={2} sx={{ p: 0 }}>
                      <Collapse in={!!expandedTypes[index]} unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mb={2}
                          >
                            Quelle und Datum überschreiben die globalen Angaben
                            nur für diesen Stromtyp. Leere Felder verwenden
                            jeweils den Standard aus den kommunalen Parametern.
                          </Typography>
                          <Box sx={{ ...gridSx, mb: 1.5 }}>
                            <Typography variant="body2">
                              Abweichende Quelle (optional)
                            </Typography>
                            <TextField
                              size="small"
                              value={data?.source ?? ""}
                              placeholder={configStore.heat.globalDefaultSource}
                              helperText={`Globale Quelle: ${configStore.heat.globalDefaultSource || "nicht angegeben"}`}
                              slotProps={{
                                htmlInput: {
                                  "aria-label":
                                    "Abweichende Quelle für diesen Stromtyp",
                                },
                              }}
                              onChange={(e) =>
                                updateElectricityTypeSource(
                                  item.value,
                                  e.target.value,
                                )
                              }
                            />
                            <Box />
                            <Typography variant="body2">
                              Abweichender Datenstand (optional)
                            </Typography>
                            <TextField
                              size="small"
                              type="date"
                              value={data?.date?.slice(0, 10) ?? ""}
                              helperText={`Globaler Datenstand: ${configStore.heat.globalDefaultDate.slice(0, 10) || "nicht angegeben"}`}
                              slotProps={{
                                htmlInput: {
                                  "aria-label":
                                    "Abweichender Datenstand für diesen Stromtyp",
                                },
                              }}
                              onChange={(e) =>
                                updateElectricityTypeDate(
                                  item.value,
                                  e.target.value,
                                )
                              }
                            />

                            <Typography variant="body2">
                              Primärenergiefaktor
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={data?.primaryEnergyFactor ?? ""}
                              onChange={(e) =>
                                updateElectricityTypeData(item.value, (d) => {
                                  d.primaryEnergyFactor = parseFloat(
                                    e.target.value,
                                  );
                                })
                              }
                            />
                            <Box />
                            <Typography variant="body2">
                              CO₂-Faktor [gCO₂/kWh]
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={data?.co2Factor ?? ""}
                              onChange={(e) =>
                                updateElectricityTypeData(item.value, (d) => {
                                  d.co2Factor = parseFloat(e.target.value);
                                })
                              }
                            />

                            <Typography variant="body2">
                              Arbeitspreis [€/kWh]
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={data?.unitRate ?? ""}
                              onChange={(e) =>
                                updateElectricityTypeData(item.value, (d) => {
                                  d.unitRate = parseFloat(e.target.value);
                                })
                              }
                            />
                            <Box />
                            <Typography variant="body2">
                              Grundpreis [€/a]
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={data?.baseRate ?? ""}
                              onChange={(e) =>
                                updateElectricityTypeData(item.value, (d) => {
                                  d.baseRate = parseFloat(e.target.value);
                                })
                              }
                            />
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </CollapsibleSection>
  );
}
