import { Box, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
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
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            size="small"
            label="Globale Quelle"
            value={configStore.heat.globalDefaultSource}
            onChange={(event) =>
              updateSimpleValue("heat.globalDefaultSource", event.target.value)
            }
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            type="date"
            label="Globaler Datenstand"
            value={configStore.heat.globalDefaultDate.slice(0, 10)}
            onChange={(event) =>
              updateSimpleValue("heat.globalDefaultDate", event.target.value)
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <Typography variant="body1" fontWeight={"bold"} mb={1}>
          Standard‑Auswahl
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 200px 2rem 1fr 200px",
            gap: 1.5,
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography>Primärenergieträger</Typography>
          <Tooltip
            title={
              configStore.heat.primaryEnergyCarriers.find(
                (c) => c.value === configStore.heat.defaultPrimaryEnergyCarrier,
              )?.localization.de ?? ""
            }
            placement="top"
            arrow
            slotProps={{ tooltip: { sx: { fontSize: "0.85rem" } } }}
          >
            <TextField
              select
              size="small"
              value={configStore.heat.defaultPrimaryEnergyCarrier}
              onChange={(e) =>
                updateSimpleValue(
                  "heat.defaultPrimaryEnergyCarrier",
                  e.target.value,
                )
              }
            >
              {configStore.heat.primaryEnergyCarriers.map((carrier) => (
                <MenuItem key={carrier.value} value={carrier.value}>
                  {carrier.localization.de}
                </MenuItem>
              ))}
            </TextField>
          </Tooltip>
          <Box />
          <Typography>Standard-Stromtyp</Typography>
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
              size="small"
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
          <Typography>Heizflächenart</Typography>
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
              size="small"
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
          <Box />
          <Box />
          <Box />
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
