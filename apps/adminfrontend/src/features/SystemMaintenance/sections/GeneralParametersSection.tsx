import { Add, Delete, Edit } from "@mui/icons-material";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import type { DETConfig } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { Fragment } from "react";
import { toast } from "sonner";
import {
  addCorrectionFactor,
  deleteCorrectionFactor,
  updateCorrectionFactor,
  updateConfig,
  updateInternalGainsFactorByBuildingType,
  updateNetFloorAreaFromUsableFloorAreaFactor,
  updateSimpleValue,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import { NumberField } from "../NumberField";
import { type DeleteConfirmState, type EditState } from "../ConfigOverview";

export function GeneralParametersSection({
  configStore,
  setEditState,
  setDeleteConfirm,
  expandedSections,
  toggleSection,
}: {
  configStore: DETConfig;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<DeleteConfirmState>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const handleDeleteConfirm = (onConfirm: () => void) => {
    setDeleteConfirm({ open: true, onConfirm });
  };

  const handleEditCorrectionFactor = (index: number) => {
    const item = configStore.general.heatedAirVolumeCorrectionFactor[index];
    if (!item) return;
    setEditState({
      open: true,
      title: "Korrekturfaktor bearbeiten",
      fields: [
        {
          key: "from",
          label: "Von",
          value: "from" in item ? item.from : "",
          type: "number",
        },
        {
          key: "to",
          label: "Bis",
          value: "to" in item ? item.to : "",
          type: "number",
        },
        {
          key: "value",
          label: "Faktor",
          value: item.value,
          type: "number",
          required: true,
        },
      ],
      onSave: (_, numbers) => {
        updateCorrectionFactor(index, (draft) => {
          draft.from = numbers.from;
          draft.to = numbers.to;
          draft.value = numbers.value ?? draft.value;
        });
        toast.success("Korrekturfaktor aktualisiert");
      },
    });
  };

  const handleAddCorrectionFactor = () => {
    setEditState({
      open: true,
      title: "Neuer Korrekturfaktor hinzufügen für beheiztes Luftvolumen",
      fields: [
        { key: "from", label: "Von", value: "", type: "number" },
        { key: "to", label: "Bis", value: "", type: "number" },
        {
          key: "value",
          label: "Faktor",
          value: "",
          type: "number",
          required: true,
        },
      ],
      onSave: (_, numbers) => {
        addCorrectionFactor({
          from: numbers.from,
          to: numbers.to,
          value: numbers.value!,
        });
        toast.success("Korrekturfaktor hinzugefügt");
      },
    });
  };

  const NAME_TABLE: Record<string, string> = {
    singleFamily: "Einfamilienhaus",
    multiFamily: "Mehrfamilienhaus",
  };

  const lookUpForNames = (key: string): string => NAME_TABLE[key] ?? key;

  const gridSx = {
    display: "grid",
    gridTemplateColumns: "1fr 140px 2rem 1fr 140px",
    gap: 1.5,
    alignItems: "center",
  };

  return (
    <CollapsibleSection
      sectionKey="generalParams"
      title="Allgemeine Parameter"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" fontWeight="bold" mb={1}>
          Standardwerte für Wohnungen und Belegung
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Diese Werte werden verwendet, wenn Angaben zur Anzahl der Wohnungen
          oder Personen fehlen.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          {configStore.general.defaultNumberOfApartments.map((entry) => (
            <NumberField
              key={entry.key}
              label={`Wohnungen: ${lookUpForNames(entry.key)}`}
              value={entry.value}
              min={1}
              step={1}
              onCommit={(value) =>
                updateConfig((draft) => {
                  const target = draft.general.defaultNumberOfApartments.find(
                    (item) => item.key === entry.key,
                  );
                  if (target) target.value = value;
                })
              }
            />
          ))}
          <NumberField
            label="Personen je Wohnung"
            value={configStore.general.defaultPeoplePerApartment}
            min={0.01}
            onCommit={(value) =>
              updateSimpleValue("general.defaultPeoplePerApartment", value)
            }
          />
        </Box>
        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Geometrische Annahmen
        </Typography>
        <Box sx={{ ...gridSx, mb: 3 }}>
          <Typography>Geschossdeckenstärke [m]</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.general.assumedFloorSlabThickness}
            onChange={(e) =>
              updateSimpleValue(
                "general.assumedFloorSlabThickness",
                parseFloat(e.target.value),
              )
            }
          />
          <Box />
          <Typography>Geschosshöhe Innenraum [m]</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.general.assumedInteriorStoryHeight}
            onChange={(e) =>
              updateSimpleValue(
                "general.assumedInteriorStoryHeight",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography>
            Faktor Nutzfläche über beheiztes Gebäudevolumen
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.general.usableFloorAreaFactor}
            onChange={(e) =>
              updateSimpleValue(
                "general.usableFloorAreaFactor",
                parseFloat(e.target.value),
              )
            }
          />
          <Box />
          <Typography>Faktor Nettogrundfläche über Wohnfläche</Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.general.netFloorAreaFromLivingAreaFactor}
            onChange={(e) =>
              updateSimpleValue(
                "general.netFloorAreaFromLivingAreaFactor",
                parseFloat(e.target.value),
              )
            }
          />

          <Typography>
            Faktor Lüftungswärmeverlust (Gesamtluftwechsel ohne mechanische
            Lüftung)
          </Typography>
          <TextField
            size="small"
            type="number"
            value={configStore.heat.ventilationHeatLossCorrectionFactor}
            onChange={(e) =>
              updateSimpleValue(
                "heat.ventilationHeatLossCorrectionFactor",
                parseFloat(e.target.value),
              )
            }
          />
          <Box />
          <Box />
          <Box />
          <Box />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight={"bold"} mb={1}>
            Faktor Nettogrundfläche über Nutzfläche
          </Typography>
          <Box sx={gridSx}>
            {configStore.general.netFloorAreaFromUsableFloorAreaFactor.map(
              (entry: {
                key: string;
                value: { key: boolean; value: number }[];
              }) => {
                const ohneKeller = entry.value.find((v) => v.key === false);
                const mitKeller = entry.value.find((v) => v.key === true);
                return (
                  <Fragment key={entry.key}>
                    <Typography>
                      {lookUpForNames(entry.key)} ohne Keller
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={ohneKeller?.value ?? ""}
                      onChange={(e) =>
                        updateNetFloorAreaFromUsableFloorAreaFactor(
                          entry.key,
                          false,
                          parseFloat(e.target.value),
                        )
                      }
                    />
                    <Box />
                    <Typography>
                      {lookUpForNames(entry.key)} mit Keller
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={mitKeller?.value ?? ""}
                      onChange={(e) =>
                        updateNetFloorAreaFromUsableFloorAreaFactor(
                          entry.key,
                          true,
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </Fragment>
                );
              },
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight={"bold"} mb={1}>
            Faktor interne Wärmegewinne je Gebäudetyp
          </Typography>
          <Box sx={gridSx}>
            {configStore.heat.internalGainsFactorByBuildingType.map(
              (entry: { key: string; value: number }) => (
                <Fragment key={entry.key}>
                  <Typography>{lookUpForNames(entry.key)}</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={entry.value}
                    onChange={(e) =>
                      updateInternalGainsFactorByBuildingType(
                        entry.key,
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <Box />
                  <Box />
                  <Box />
                </Fragment>
              ),
            )}
          </Box>
        </Box>

        <Box sx={{ width: "50%" }}>
          <Typography variant="body1" fontWeight={"bold"} mb={1}>
            Faktor beheiztes Luftvolumen
          </Typography>
          {configStore.general.heatedAirVolumeCorrectionFactor.map(
            (
              item: { from?: number; to?: number; value: number },
              index: number,
            ) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.25,
                }}
              >
                <Typography sx={{ flex: 1 }}>
                  {item.from &&
                    item.to &&
                    `ab ${item.from} bis ${item.to} Geschosse`}
                  {item.from && !item.to && `ab ${item.from} Geschosse`}
                  {!item.from && item.to && `bis ${item.to} Geschosse`}
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={item.value}
                  onChange={(e) =>
                    updateCorrectionFactor(index, (draft) => {
                      draft.value = parseFloat(e.target.value);
                    })
                  }
                  sx={{ width: 100 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleEditCorrectionFactor(index)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() =>
                    handleDeleteConfirm(() => {
                      deleteCorrectionFactor(index);
                      toast.success("Korrekturfaktor gelöscht");
                    })
                  }
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ),
          )}
          <IconButton
            size="small"
            onClick={handleAddCorrectionFactor}
            sx={{ color: "error.main", mt: 0.25 }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </CollapsibleSection>
  );
}
