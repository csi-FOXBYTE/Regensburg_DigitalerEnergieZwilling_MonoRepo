import { Add, ArrowDownward, ArrowUpward, DeleteOutline } from "@mui/icons-material";
import { Box, Button, IconButton, Menu, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { config, updateConfig, updateSimpleValue } from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import { InterpolationEditor } from "../InterpolationEditor";
import { NumberField } from "../NumberField";

export default function ComunityParameterSection({
  configStore,
  expandedSections,
  toggleSection,
}: {
  configStore: ReturnType<typeof config.get>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const [addCarrierAnchor, setAddCarrierAnchor] = useState<HTMLElement | null>(null);
  const availableToAdd = configStore.heat.primaryEnergyCarriers.filter(
    (carrier) =>
      !configStore.heat.defaultPrimaryEnergyCarrierPriority.includes(carrier.value),
  );

  return (
    <CollapsibleSection
      sectionKey="communityParams"
      title="Kommunale Parameter"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" fontWeight="bold" mb={1}>
          Globale Datenquelle
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Quelle und Datenstand gelten als Standard. Abweichende Angaben bei
          einem Energieträger oder Stromtyp überschreiben diese nur für dessen
          Daten. Quelle und Datum können unabhängig voneinander überschrieben
          werden.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            size="medium"
            label="Globale Quelle"
            slotProps={{ inputLabel: { shrink: true } }}
            value={configStore.heat.globalDefaultSource}
            onChange={(event) =>
              updateSimpleValue("heat.globalDefaultSource", event.target.value)
            }
            fullWidth
          />
          <TextField
            size="medium"
            type="date"
            label="Globaler Datenstand"
            value={configStore.heat.globalDefaultDate.slice(0, 10)}
            onChange={(event) =>
              updateSimpleValue("heat.globalDefaultDate", event.target.value)
            }
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Box>
        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Standard‑Auswahl
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 2,
            alignItems: "start",
            mb: 3,
          }}
        >
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography mb={1}>
              Standard-Energieträger nach Verfügbarkeit
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Der erste verfügbare Energieträger wird verwendet. Das
              Standard-Heizsystem des gewählten Energieträgers wird übernommen.
            </Typography>
            {configStore.heat.defaultPrimaryEnergyCarrierPriority.map(
              (value, index) => (
                <Box
                  key={`${value}-${index}`}
                  sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}
                >
                  <Typography sx={{ minWidth: 24 }}>{index + 1}.</Typography>
                  <TextField
                    select
                    size="medium"
                    aria-label={`Energieträger Priorität ${index + 1}`}
                    value={value}
                    onChange={(event) =>
                      updateConfig((draft) => {
                        draft.heat.defaultPrimaryEnergyCarrierPriority[index] =
                          event.target.value;
                      })
                    }
                    sx={{ minWidth: 180, flex: 1 }}
                  >
                    {configStore.heat.primaryEnergyCarriers
                      .filter(
                        (carrier) =>
                          carrier.value === value ||
                          !configStore.heat.defaultPrimaryEnergyCarrierPriority.includes(
                            carrier.value,
                          ),
                      )
                      .map((carrier) => (
                        <MenuItem key={carrier.value} value={carrier.value}>
                          {carrier.localization.de ?? carrier.value}
                        </MenuItem>
                      ))}
                  </TextField>
                  <IconButton
                    size="small"
                    aria-label={`Energieträger auf Position ${index + 1} nach oben verschieben`}
                    disabled={index === 0}
                    onClick={() =>
                      updateConfig((draft) => {
                        const priority =
                          draft.heat.defaultPrimaryEnergyCarrierPriority;
                        [priority[index - 1], priority[index]] = [
                          priority[index]!,
                          priority[index - 1]!,
                        ];
                      })
                    }
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Energieträger auf Position ${index + 1} nach unten verschieben`}
                    disabled={
                      index ===
                      configStore.heat.defaultPrimaryEnergyCarrierPriority.length - 1
                    }
                    onClick={() =>
                      updateConfig((draft) => {
                        const priority =
                          draft.heat.defaultPrimaryEnergyCarrierPriority;
                        [priority[index], priority[index + 1]] = [
                          priority[index + 1]!,
                          priority[index]!,
                        ];
                      })
                    }
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Energieträger auf Position ${index + 1} entfernen`}
                    color="error"
                    disabled={
                      configStore.heat.defaultPrimaryEnergyCarrierPriority.length === 1
                    }
                    onClick={() =>
                      updateConfig((draft) => {
                        draft.heat.defaultPrimaryEnergyCarrierPriority.splice(
                          index,
                          1,
                        );
                      })
                    }
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Box>
              ),
            )}
            {availableToAdd.length > 0 && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={(event) => setAddCarrierAnchor(event.currentTarget)}
                >
                  Energieträger hinzufügen
                </Button>
                <Menu
                  anchorEl={addCarrierAnchor}
                  open={Boolean(addCarrierAnchor)}
                  onClose={() => setAddCarrierAnchor(null)}
                >
                  {availableToAdd.map((carrier) => (
                    <MenuItem
                      key={carrier.value}
                      onClick={() => {
                        updateConfig((draft) => {
                          draft.heat.defaultPrimaryEnergyCarrierPriority.push(
                            carrier.value,
                          );
                        });
                        setAddCarrierAnchor(null);
                      }}
                    >
                      {carrier.localization.de ?? carrier.value}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
          <Tooltip
            title={
              configStore.heat.electricityTypes.find(
                (t) => t.value === configStore.heat.defaultElectricityType,
              )?.localization.de ?? ""
            }
            placement="top"
            arrow
            slotProps={{ tooltip: { sx: { fontSize: "0.85rem" } } }}
          >
            <TextField
              select
              size="medium"
              label="Standard-Stromtyp"
              slotProps={{ inputLabel: { shrink: true } }}
              value={configStore.heat.defaultElectricityType}
              onChange={(e) =>
                updateSimpleValue("heat.defaultElectricityType", e.target.value)
              }
            >
              {configStore.heat.electricityTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.localization.de}
                </MenuItem>
              ))}
            </TextField>
          </Tooltip>
          <Tooltip
            title={
              configStore.heat.heatingSurfaceTypes.find(
                (t) => t.value === configStore.heat.defaultHeatingSurfaceType,
              )?.localization.de ?? ""
            }
            placement="top"
            arrow
            slotProps={{ tooltip: { sx: { fontSize: "0.85rem" } } }}
          >
            <TextField
              select
              size="medium"
              label="Heizflächenart"
              slotProps={{ inputLabel: { shrink: true } }}
              value={configStore.heat.defaultHeatingSurfaceType}
              onChange={(e) =>
                updateSimpleValue(
                  "heat.defaultHeatingSurfaceType",
                  e.target.value,
                )
              }
            >
              {configStore.heat.heatingSurfaceTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.localization.de}
                </MenuItem>
              ))}
            </TextField>
          </Tooltip>
        </Box>

        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Energetische Kennwerte
        </Typography>

        <Box sx={{ display: "flex" }}>
          <NumberField
            label="Heizgradtage [HDD]"
            value={configStore.heat.heatingDegreeDays}
            min={0}
            onCommit={(value) =>
              updateSimpleValue("heat.heatingDegreeDays", value)
            }
          />
        </Box>
        <Typography variant="body1" fontWeight="bold" mt={3} mb={2}>
          Warmwasserbedarf je Gebäudetyp
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {configStore.heat.hotWaterEnergyDemandFromAreaFactor.map((entry) => (
            <NumberField
              key={entry.key}
              label={`${entry.key === "singleFamily" ? "Einfamilienhaus" : "Mehrfamilienhaus"} [kWh/m²a]`}
              value={entry.value}
              min={0}
              onCommit={(value) =>
                updateConfig((draft) => {
                  const target =
                    draft.heat.hotWaterEnergyDemandFromAreaFactor.find(
                      (item) => item.key === entry.key,
                    );
                  if (target) target.value = value;
                })
              }
            />
          ))}
        </Box>
        <Typography variant="body1" fontWeight="bold" mt={3} mb={1}>
          Haushaltsstrom je Wohnung
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Jahresverbrauch je Wohnung nach Personenzahl. Bis einschließlich zwei
          Wohnungen wird die Einfamilienhaus-Tabelle verwendet, darüber die
          Mehrfamilienhaus-Tabelle. Die Stützpunkte dienen der Interpolation und
          der linearen Regression für mehrere Wohnungen bzw. höhere
          Personenzahlen. Mindestens zwei Stützpunkte sind nötig.
        </Typography>
        {configStore.heat.householdElectricityPerApartment.map((entry) => (
          <Box key={entry.key} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              {entry.key === "singleFamily"
                ? "Einfamilienhaus (1–2 Wohnungen)"
                : "Mehrfamilienhaus (ab 3 Wohnungen)"}
            </Typography>
            <InterpolationEditor
              value={entry.value}
              atLabel="Personen je Wohnung"
              valueLabel="Strombedarf [kWh/a je Wohnung]"
              atStep={1}
              onChange={(value) =>
                updateConfig((draft) => {
                  const target =
                    draft.heat.householdElectricityPerApartment.find(
                      (item) => item.key === entry.key,
                    );
                  if (target) target.value = value;
                })
              }
            />
          </Box>
        ))}
      </Box>
    </CollapsibleSection>
  );
}
