import { ChevronRight, Delete, Edit, ExpandMore } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
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
import { Fragment, useState } from "react";
import { toast } from "sonner";
import {
  addAllowedHeatingSystemType,
  addPrimaryEnergyCarrier,
  config,
  deleteAllowedHeatingSystemType,
  deletePrimaryEnergyCarrier,
  updateCO2Factor,
  updateConfig,
  updateDefaultHeatingSystemType,
  updatePrimaryEnergyCarrier,
  updatePrimaryEnergyCarrierData,
  updatePrimaryEnergyCarrierDate,
  updatePrimaryEnergyCarrierEfficiencyFactor,
  updatePrimaryEnergyCarrierSource,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import { type DeleteConfirmState, type EditState } from "../ConfigOverview";

export function PrimaryEnergyCarrierSection({
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
  const [expandedEnergyCarriers, setExpandedEnergyCarriers] = useState<
    Record<number, boolean>
  >({});

  const handleDeleteConfirm = (onConfirm: () => void) => {
    setDeleteConfirm({ open: true, onConfirm });
  };

  const toggleEnergyCarrier = (index: number) => {
    setExpandedEnergyCarriers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddPrimaryEnergyCarrier = () => {
    setEditState({
      open: true,
      title: "Neuer Energieträger hinzufügen",
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
        addPrimaryEnergyCarrier({
          value: strings.value ?? "",
          localization: { de: strings.de ?? "", en: strings.de ?? "" },
        });
        toast.success("Energieträger hinzugefügt");
      },
    });
  };

  const handleEditPrimaryEnergyCarrier = (item: {
    value: string;
    localization: Record<string, string>;
  }) => {
    setEditState({
      open: true,
      title: "Energieträger bearbeiten",
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
          label: "Bezeichnung (Deutsch)",
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
            const carrier = draft.heat.primaryEnergyCarriers.find(
              (c) => c.value === oldKey,
            );
            if (carrier) {
              carrier.value = newKey;
              carrier.localization.de = newDe;
              carrier.localization.en = newDe;
            }
            const data = draft.heat.primaryEnergyCarrierData.find(
              (d) => d.key === oldKey,
            );
            if (data) data.key = newKey;
            const allowed = draft.heat.allowedHeatingSystemTypesByCarrier.find(
              (c) => c.key === oldKey,
            );
            if (allowed) allowed.key = newKey;
            if (draft.heat.defaultPrimaryEnergyCarrier === oldKey)
              draft.heat.defaultPrimaryEnergyCarrier = newKey;
            const defaultHeat = draft.heat.defaultHeatingSystemType.find(
              (e) => e.key === oldKey,
            );
            if (defaultHeat) defaultHeat.key = newKey;
          });
        } else {
          const idx = configStore.heat.primaryEnergyCarriers.findIndex(
            (c) => c.value === oldKey,
          );
          if (idx >= 0) {
            updatePrimaryEnergyCarrier(idx, (draft) => {
              draft.localization.de = newDe;
            });
          }
        }
        toast.success("Energieträger aktualisiert");
      },
    });
  };

  const gridSx = {
    display: "grid",
    gridTemplateColumns: "1fr 140px 2rem 1fr 140px",
    gap: 1.5,
    alignItems: "center",
  };

  return (
    <CollapsibleSection
      sectionKey="energyCarriers"
      title={`Primäre Energieträger (${configStore.heat.primaryEnergyCarriers.length})`}
      expandedSections={expandedSections}
      toggleSection={toggleSection}
      action={
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            handleAddPrimaryEnergyCarrier();
          }}
        >
          Neuer Energieträger +
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
            {configStore.heat.primaryEnergyCarriers.map((item, index) => {
              const carrierData = configStore.heat.primaryEnergyCarrierData.find(
                (c) => c.key === item.value,
              )?.value;

              return (
              <Fragment key={index}>
                <TableRow hover>
                  <TableCell sx={{ fontSize: "medium" }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleEnergyCarrier(index)}
                    >
                      {expandedEnergyCarriers[index] ? (
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
                      onClick={() => handleEditPrimaryEnergyCarrier(item)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleDeleteConfirm(() => {
                          deletePrimaryEnergyCarrier(item.value);
                          toast.success("Energieträger gelöscht");
                        })
                      }
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={4} sx={{ p: 0 }}>
                    <Collapse in={expandedEnergyCarriers[index]} unmountOnExit>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" fontWeight={"bold"} mb={1}>
                          Daten zum Energieträger
                        </Typography>

                        <FormControlLabel
                          sx={{ mb: 1.5 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={!!item.excludeFromSystemRenewal}
                              onChange={(e) =>
                                updatePrimaryEnergyCarrier(index, (draft) => {
                                  draft.excludeFromSystemRenewal =
                                    e.target.checked;
                                })
                              }
                            />
                          }
                          label={
                            <Typography variant="body2">
                              Von Systemerneuerung ausschließen
                            </Typography>
                          }
                        />

                        <Box sx={{ ...gridSx, mb: 1.5 }}>
                          <Typography variant="body2">
                            Primärenergiefaktor
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.primaryEnergyFactor ?? ""
                            }
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierEfficiencyFactor(
                                item.value,
                                parseFloat(e.target.value),
                              )
                            }
                          />
                        </Box>

                        <Box sx={{ ...gridSx, mb: 2 }}>
                          <Typography variant="body2">
                            CO₂-Faktor gemäß Informationsblatt
                            <br />
                            CO₂-Faktoren der Bafa [gCO₂/kWh]
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.co2Factor ?? ""
                            }
                            onChange={(e) =>
                              updateCO2Factor(
                                item.value,
                                parseFloat(e.target.value),
                              )
                            }
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          fontWeight={"bold"}
                          mb={1}
                        >
                          Brennstoffdaten gemäß{" "}
                          {carrierData?.source ||
                            configStore.heat.globalDefaultSource}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={2}
                        >
                          Quelle und Datum überschreiben die globalen Angaben
                          nur für diesen Energieträger. Leere Felder verwenden
                          jeweils den Standard aus den kommunalen Parametern.
                        </Typography>
                        <Box sx={{ ...gridSx, mb: 2 }}>
                          <Typography variant="body2">
                            Abweichende Quelle (optional)
                          </Typography>
                          <TextField
                            size="small"
                            value={carrierData?.source ?? ""}
                            placeholder={configStore.heat.globalDefaultSource}
                            helperText={`Globale Quelle: ${configStore.heat.globalDefaultSource || "nicht angegeben"}`}
                            slotProps={{
                              htmlInput: {
                                "aria-label":
                                  "Abweichende Quelle für diesen Energieträger",
                              },
                            }}
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierSource(
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
                            value={carrierData?.date?.slice(0, 10) ?? ""}
                            helperText={`Globaler Datenstand: ${configStore.heat.globalDefaultDate.slice(0, 10) || "nicht angegeben"}`}
                            slotProps={{
                              htmlInput: {
                                "aria-label":
                                  "Abweichender Datenstand für diesen Energieträger",
                              },
                            }}
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierDate(
                                item.value,
                                e.target.value,
                              )
                            }
                          />

                          <Typography variant="body2">Mengeneinheit</Typography>
                          <TextField
                            select
                            size="small"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.unit ?? ""
                            }
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierData(
                                item.value,
                                (draft) => {
                                  draft.unit = e.target.value;
                                },
                              )
                            }
                          >
                            {["rm", "kg", "kWh", "m³", "L"].map((u) => (
                              <MenuItem key={u} value={u}>
                                {u}
                              </MenuItem>
                            ))}
                          </TextField>

                          <Box />

                          <Typography variant="body2">
                            {(() => {
                              const unit =
                                configStore.heat.primaryEnergyCarrierData.find(
                                  (c) => c.key === item.value,
                                )?.value.unit || "x";
                              return `Heizwert [kWh/${unit}]`;
                            })()}
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.energyPerUnit ?? ""
                            }
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierData(
                                item.value,
                                (draft) => {
                                  draft.energyPerUnit = parseFloat(
                                    e.target.value,
                                  );
                                },
                              )
                            }
                          />

                          <Typography variant="body2">
                            {(() => {
                              const unit =
                                configStore.heat.primaryEnergyCarrierData.find(
                                  (c) => c.key === item.value,
                                )?.value.unit || "x";
                              return `Arbeitspreis [€/${unit}]`;
                            })()}
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.unitRate ?? ""
                            }
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierData(
                                item.value,
                                (draft) => {
                                  draft.unitRate = parseFloat(e.target.value);
                                },
                              )
                            }
                          />

                          <Box />

                          <Typography variant="body2">
                            Grundpreis [€/a]
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              configStore.heat.primaryEnergyCarrierData.find(
                                (c) => c.key === item.value,
                              )?.value.baseRate ?? ""
                            }
                            onChange={(e) =>
                              updatePrimaryEnergyCarrierData(
                                item.value,
                                (draft) => {
                                  draft.baseRate = parseFloat(e.target.value);
                                },
                              )
                            }
                          />
                        </Box>

                        <Typography variant="body2" fontWeight={"bold"} mb={1}>
                          Erlaubte Heizsysteme
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 0,
                          }}
                        >
                          {configStore.heat.heatingSystemTypes.map((sys) => {
                            const allowedValues =
                              configStore.heat.allowedHeatingSystemTypesByCarrier.find(
                                (c) => c.key === item.value,
                              )?.allowedValues ?? [];
                            const isAllowed = allowedValues.includes(sys.value);
                            return (
                              <FormControlLabel
                                key={sys.value}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={isAllowed}
                                    onChange={() => {
                                      const idx = allowedValues.indexOf(
                                        sys.value,
                                      );
                                      if (idx >= 0) {
                                        deleteAllowedHeatingSystemType(
                                          item.value,
                                          idx,
                                        );
                                      } else {
                                        addAllowedHeatingSystemType(
                                          item.value,
                                          sys.value,
                                        );
                                      }
                                    }}
                                  />
                                }
                                label={sys.localization.de}
                                sx={{ mr: 2 }}
                              />
                            );
                          })}
                        </Box>

                        <Box sx={{ ...gridSx, mt: 1.5 }}>
                          <Typography variant="body2">
                            Standard-Heizsystem
                          </Typography>
                          <TextField
                            select
                            size="small"
                            value={
                              configStore.heat.defaultHeatingSystemType.find(
                                (e) => e.key === item.value,
                              )?.value ?? ""
                            }
                            onChange={(e) =>
                              updateDefaultHeatingSystemType(
                                item.value,
                                e.target.value,
                              )
                            }
                          >
                            {configStore.heat.allowedHeatingSystemTypesByCarrier
                              .find((c) => c.key === item.value)
                              ?.allowedValues.map((v: string) => {
                                const sys =
                                  configStore.heat.heatingSystemTypes.find(
                                    (s) => s.value === v,
                                  );
                                return (
                                  <MenuItem key={v} value={v}>
                                    {sys?.localization.de ?? v}
                                  </MenuItem>
                                );
                              })}
                          </TextField>
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
