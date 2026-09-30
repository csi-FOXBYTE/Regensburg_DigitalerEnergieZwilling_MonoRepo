import ComunityParameterSection from "@/features/SystemMaintenance/sections/ComunityParameterSection";
import ElectricityTypesSection from "@/features/SystemMaintenance/sections/ElectricityTypesSection";
import HeatingSurfaceTypesSection from "@/features/SystemMaintenance/sections/HeatingSurfaceTypesSection";
import HeatingTypesSection from "@/features/SystemMaintenance/sections/HeatingTypesSection";
import OgdSection from "@/features/SystemMaintenance/sections/OgdSection";
import OuterWallSection from "@/features/SystemMaintenance/sections/OuterWallSection";
import { PrimaryEnergyCarrierSection } from "@/features/SystemMaintenance/sections/PrimaryEnergyCarrierSection";
import RoofSection from "@/features/SystemMaintenance/sections/RoofSection";
import FoerderprogrammeSection from "@/features/SystemMaintenance/sections/SubsidySection";
import SurfaceTempResistenceSection from "@/features/SystemMaintenance/sections/SurfaceTempResistenceSection";
import UgdSection from "@/features/SystemMaintenance/sections/UgdSection";
import WindowSection from "@/features/SystemMaintenance/sections/WindowSection";
import type { DETConfig } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useStore } from "@nanostores/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../../components/ConfirmDeleteDialog";
import { EditDialog } from "../../components/EditDialog";
import { AppFooter } from "../../components/Footer";
import { SaveDialog } from "../../components/SaveDialog";
import {
  useActivateConfig,
  useActiveConfig,
  useConfigVersions,
  useDeleteConfig,
  useLoadConfig,
  useSaveConfig,
} from "../../hooks/configHooks";
import {
  config,
  foerderprogramme,
  type EnergyEfficiencyEntry,
  type SubsidyWrapper,
  type YearBandEntry,
} from "../../hooks/store";
import { ConfigManagementDialog } from "./ConfigManagementDialog";
import { EnergyEfficiencySection } from "./sections/EnergyEfficiencySection";
import { GeneralParametersSection } from "./sections/GeneralParametersSection";
import { YearBandSection } from "./sections/YearBandSection";

export interface EditState {
  open: boolean;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: string | number;
    type?: "text" | "number" | "color" | "select";
    required?: boolean;
  }>;
  onSave: (
    strings: Record<string, string>,
    numbers: Record<string, number>,
  ) => void;
}

export interface DeleteConfirmState {
  open: boolean;
  onConfirm: () => void;
}

export interface NamedTypeItem {
  value?: string;
  key?: string;
  localization?: { de: string; en: string };
}

export interface BandValidationResult {
  valid: boolean;
  errors: { index: number; error: string }[];
}

const YEAR_BAND_ERRORS: Record<string, string> = {
  first_must_have_only_to: "Erstes Band darf nur 'Bis' haben",
  middle_must_have_both: "Mittleres Band braucht 'Von' und 'Bis'",
  last_must_have_only_from: "Letztes Band darf nur 'Von' haben",
  gap_between_bands: "Lücke zum vorherigen Band",
  overlap_between_bands: "Überschneidung mit vorherigem Band",
  single_must_be_empty: "Einzelnes Band darf keine Werte haben",
};

const ENERGY_BAND_ERRORS: Record<string, string> = {
  ...YEAR_BAND_ERRORS,
  single_must_be_empty: "Einzelnes Band darf keine Bereichswerte haben",
  missing_value: "Klasse fehlt",
  missing_color: "Farbe fehlt",
};

function validateYearBands(bands: YearBandEntry[]): BandValidationResult {
  const errors: { index: number; error: string }[] = [];
  if (bands.length === 0) return { valid: true, errors: [] };
  if (bands.length === 1) {
    if (bands[0]!.from !== undefined || bands[0]!.to !== undefined)
      errors.push({
        index: 0,
        error: YEAR_BAND_ERRORS["single_must_be_empty"]!,
      });
    return { valid: errors.length === 0, errors };
  }
  bands.forEach((band, i) => {
    const isFirst = i === 0;
    const isLast = i === bands.length - 1;
    if (isFirst) {
      if (band.to === undefined || band.from !== undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["first_must_have_only_to"]!,
        });
    } else if (isLast) {
      if (band.from === undefined || band.to !== undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["last_must_have_only_from"]!,
        });
    } else {
      if (band.from === undefined || band.to === undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["middle_must_have_both"]!,
        });
    }
    if (i > 0) {
      const prevTo = bands[i - 1]!.to;
      const currFrom = band.from;
      if (prevTo !== undefined && currFrom !== undefined) {
        if (currFrom > prevTo + 1)
          errors.push({
            index: i,
            error: YEAR_BAND_ERRORS["gap_between_bands"]!,
          });
        else if (currFrom <= prevTo)
          errors.push({
            index: i,
            error: YEAR_BAND_ERRORS["overlap_between_bands"]!,
          });
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

type RangeBand = { from?: number; to?: number };

function validateCorrectionFactors(bands: RangeBand[]): BandValidationResult {
  const errors: { index: number; error: string }[] = [];
  if (bands.length === 0) return { valid: true, errors: [] };
  if (bands.length === 1) {
    if (bands[0]!.from !== undefined || bands[0]!.to !== undefined)
      errors.push({
        index: 0,
        error: YEAR_BAND_ERRORS["single_must_be_empty"]!,
      });
    return { valid: errors.length === 0, errors };
  }
  bands.forEach((band, i) => {
    const isFirst = i === 0;
    const isLast = i === bands.length - 1;
    if (isFirst) {
      if (band.to === undefined || band.from !== undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["first_must_have_only_to"]!,
        });
    } else if (isLast) {
      if (band.from === undefined || band.to !== undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["last_must_have_only_from"]!,
        });
    } else {
      if (band.from === undefined || band.to === undefined)
        errors.push({
          index: i,
          error: YEAR_BAND_ERRORS["middle_must_have_both"]!,
        });
    }
    if (i > 0) {
      const prevTo = bands[i - 1]!.to;
      const currFrom = band.from;
      if (prevTo !== undefined && currFrom !== undefined) {
        if (currFrom > prevTo)
          errors.push({
            index: i,
            error: YEAR_BAND_ERRORS["gap_between_bands"]!,
          });
        else if (currFrom < prevTo)
          errors.push({
            index: i,
            error: YEAR_BAND_ERRORS["overlap_between_bands"]!,
          });
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

function validateEnergyClasses(
  bands: EnergyEfficiencyEntry[],
  colorMap: { key: string; value: string }[],
): BandValidationResult {
  const hasColor = (band: EnergyEfficiencyEntry) =>
    !!(band.color || colorMap.find((c) => c.key === band.value)?.value);
  const errors: { index: number; error: string }[] = [];
  if (bands.length === 0) return { valid: true, errors: [] };
  if (bands.length === 1) {
    const b = bands[0]!;
    if (b.from !== undefined || b.to !== undefined)
      errors.push({
        index: 0,
        error: ENERGY_BAND_ERRORS["single_must_be_empty"]!,
      });
    if (!b.value)
      errors.push({ index: 0, error: ENERGY_BAND_ERRORS["missing_value"]! });
    if (!hasColor(b))
      errors.push({ index: 0, error: ENERGY_BAND_ERRORS["missing_color"]! });
    return { valid: errors.length === 0, errors };
  }
  bands.forEach((band, i) => {
    const isFirst = i === 0;
    const isLast = i === bands.length - 1;
    if (isFirst) {
      if (band.to === undefined || band.from !== undefined)
        errors.push({
          index: i,
          error: ENERGY_BAND_ERRORS["first_must_have_only_to"]!,
        });
    } else if (isLast) {
      if (band.from === undefined || band.to !== undefined)
        errors.push({
          index: i,
          error: ENERGY_BAND_ERRORS["last_must_have_only_from"]!,
        });
    } else {
      if (band.from === undefined || band.to === undefined)
        errors.push({
          index: i,
          error: ENERGY_BAND_ERRORS["middle_must_have_both"]!,
        });
    }
    if (!band.value)
      errors.push({ index: i, error: ENERGY_BAND_ERRORS["missing_value"]! });
    if (!hasColor(band))
      errors.push({ index: i, error: ENERGY_BAND_ERRORS["missing_color"]! });
    if (i > 0) {
      const prevTo = bands[i - 1]!.to;
      const currFrom = band.from;
      if (prevTo !== undefined && currFrom !== undefined) {
        if (currFrom > prevTo)
          errors.push({
            index: i,
            error: ENERGY_BAND_ERRORS["gap_between_bands"]!,
          });
        else if (currFrom < prevTo)
          errors.push({
            index: i,
            error: ENERGY_BAND_ERRORS["overlap_between_bands"]!,
          });
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

export function ConfigOverview() {
  const configStore = useStore(config);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [editState, setEditState] = useState<EditState>({
    open: false,
    title: "",
    fields: [],
    onSave: () => {},
  });

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    onConfirm: () => {},
  });

  const handleConfirmDelete = () => {
    deleteConfirm.onConfirm();
    setDeleteConfirm({ open: false, onConfirm: () => {} });
  };

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configManagementOpen, setConfigManagementOpen] = useState(false);

  const configVersions = useConfigVersions();
  const configs = configVersions.data?.configs ?? [];

  const [selectedConfigFile, setSelectedConfigFile] = useState<string>("");

  const loadConfig = useLoadConfig(selectedConfigFile);
  const publishConfig = useActivateConfig();
  const deleteConfig = useDeleteConfig();
  const activeConfig = useActiveConfig();

  useEffect(() => {
    if (!loadConfig.data) return;
    const calculationConfig = JSON.parse(
      String(loadConfig.data.calculationConfig),
    ) as DETConfig;
    const subsidies = JSON.parse(
      String(loadConfig.data.subsidies),
    ) as SubsidyWrapper[];
    config.set(calculationConfig);
    foerderprogramme.set(subsidies);
  }, [loadConfig.data]);

  const saveConfig = useSaveConfig();

  useEffect(() => {
    if (
      activeConfig.isSuccess &&
      activeConfig.data?.versionName &&
      !selectedConfigFile
    ) {
      setSelectedConfigFile(activeConfig.data.versionName);
    }
  }, [
    activeConfig.isSuccess,
    activeConfig.data?.versionName,
    selectedConfigFile,
  ]);

  const handleSaveAll = async (fileName: string, autoActivate: boolean) => {
    try {
      await saveConfig.mutateAsync({
        versionName: fileName,
        config: configStore,
        subsidies: foerderprogramme.get(),
      });
      toast.success(`Konfiguration gespeichert als „${fileName}"`);
      await configVersions.refetch();
      setSelectedConfigFile(fileName);
      if (autoActivate) {
        try {
          await publishConfig.mutateAsync({ versionName: fileName });
          await Promise.all([activeConfig.refetch(), configVersions.refetch()]);
        } catch {
          toast.error("Konfiguration konnte nicht aktiviert werden");
        }
      }
    } catch (err) {
      if ((err as { status?: number }).status === 409) {
        toast.error(`Version „${fileName}" existiert bereits`);
      } else {
        toast.error("Speichern fehlgeschlagen");
      }
    }
  };

  const activateConfig = async (fileName: string) => {
    try {
      await publishConfig.mutateAsync({ versionName: fileName });
      await Promise.all([activeConfig.refetch(), configVersions.refetch()]);
    } catch {
      toast.error("Konfiguration konnte nicht aktiviert werden");
    }
  };

  const handleDeleteConfig = (versionName: string) => {
    if (versionName === activeConfig.data?.versionName) {
      toast.error("Die aktive Konfiguration kann nicht gelöscht werden");
      return;
    }
    setDeleteConfirm({
      open: true,
      onConfirm: async () => {
        try {
          await deleteConfig.mutateAsync({ versionName });
          toast.success(`Konfiguration „${versionName}" gelöscht`);
          if (selectedConfigFile === versionName) setSelectedConfigFile("");
          await Promise.all([configVersions.refetch(), activeConfig.refetch()]);
        } catch (err) {
          if ((err as { status?: number }).status === 409) {
            toast.error("Aktive Konfiguration kann nicht gelöscht werden");
          } else if ((err as { status?: number }).status === 403) {
            toast.error("Die DEFAULT-Konfiguration kann nicht gelöscht werden");
          } else {
            toast.error("Löschen fehlgeschlagen");
          }
        }
      },
    });
  };

  const selectedConfigMeta = configs.find(
    (c) => c.versionName === selectedConfigFile,
  );

  const yearBandValidation = useMemo(
    () =>
      validateYearBands(
        [...(configStore.general.generalYearBands as YearBandEntry[])].sort(
          (a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity),
        ),
      ),
    [configStore.general.generalYearBands],
  );
  const energyClassValidation = useMemo(
    () =>
      validateEnergyClasses(
        [
          ...(configStore.general
            .energyEfficiencyClasses as unknown as EnergyEfficiencyEntry[]),
        ].sort((a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity)),
        configStore.general.energyEfficiencyClassColors as {
          key: string;
          value: string;
        }[],
      ),
    [
      configStore.general.energyEfficiencyClasses,
      configStore.general.energyEfficiencyClassColors,
    ],
  );
  const correctionFactorValidation = useMemo(
    () =>
      validateCorrectionFactors(
        [
          ...(configStore.general
            .heatedAirVolumeCorrectionFactor as RangeBand[]),
        ].sort((a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity)),
      ),
    [configStore.general.heatedAirVolumeCorrectionFactor],
  );
  const canSave =
    yearBandValidation.valid &&
    energyClassValidation.valid &&
    correctionFactorValidation.valid;
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={(theme) => ({
          maxWidth: theme.layout.contentMaxWidth,
          mx: "auto",
          py: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        })}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h2" gutterBottom>
              Systempflege
            </Typography>
            <Typography variant="body1">
              Konfiguration und Anpassung der Systemeinstellungen
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => setConfigManagementOpen(true)}
          >
            Konfigurationen verwalten
          </Button>
        </Box>

        {selectedConfigFile && (
          <Paper
            variant="outlined"
            sx={{ p: 2, display: "flex", gap: 4, alignItems: "center" }}
          >
            <Box>
              <Typography variant="h6" color="text.secondary" sx={{ pb: 0.5 }}>
                Konfiguration
              </Typography>
              <Typography variant="body1">{selectedConfigFile}</Typography>
            </Box>
            {!!selectedConfigMeta?.createdAt && (
              <Box>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ pb: 0.5 }}
                >
                  Erstellt
                </Typography>
                <Typography variant="body1">
                  {new Date(
                    String(selectedConfigMeta.createdAt),
                  ).toLocaleDateString("de-DE")}
                </Typography>
              </Box>
            )}
            {!!selectedConfigMeta?.publishedAt && (
              <Box>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ pb: 0.5 }}
                >
                  Veröffentlicht
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {new Date(
                    String(selectedConfigMeta.publishedAt),
                  ).toLocaleDateString("de-DE")}
                </Typography>
              </Box>
            )}
            {activeConfig.data?.versionName === selectedConfigFile && (
              <Chip
                label="Aktiv"
                size="small"
                color="success"
                icon={<CheckIcon />}
              />
            )}
          </Paper>
        )}

        <Box
          sx={{
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <GeneralParametersSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <ComunityParameterSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <YearBandSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <PrimaryEnergyCarrierSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <ElectricityTypesSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <HeatingTypesSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <HeatingSurfaceTypesSection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <EnergyEfficiencySection
            configStore={configStore}
            setEditState={setEditState}
            setDeleteConfirm={setDeleteConfirm}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <SurfaceTempResistenceSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <RoofSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <OgdSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <OuterWallSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <WindowSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <UgdSection
            configStore={configStore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          <FoerderprogrammeSection
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />

          <Box sx={{ mb: 10 }} />
        </Box>
      </Box>

      <AppFooter
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      >
        <Box
          sx={(theme) => ({
            maxWidth: theme.layout.contentMaxWidth,
            mx: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          })}
        >
          {!canSave && (
            <Typography sx={{ color: "error.main" }} variant="body2">
              {[
                ...(yearBandValidation.errors.length > 0
                  ? [
                      `Jahresbänder: ${yearBandValidation.errors.map((e) => e.error).join(", ")}`,
                    ]
                  : []),
                ...(energyClassValidation.errors.length > 0
                  ? [
                      `Energieeffizienzklassen: ${energyClassValidation.errors.map((e) => e.error).join(", ")}`,
                    ]
                  : []),
                ...(correctionFactorValidation.errors.length > 0
                  ? [
                      `Faktor beheiztes Luftvolumen: ${correctionFactorValidation.errors.map((e) => e.error).join(", ")}`,
                    ]
                  : []),
              ].join(" | ")}
            </Typography>
          )}
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              sx={{ mb: 1.5 }}
              disabled={!canSave}
              onClick={() => setSaveDialogOpen(true)}
            >
              Speichern
            </Button>
          </Box>
        </Box>
      </AppFooter>

      <SaveDialog
        key={String(saveDialogOpen)}
        open={saveDialogOpen}
        defaultName={selectedConfigFile}
        existingNames={configs.map((c) => c.versionName)}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveAll}
      />

      <EditDialog
        key={String(editState.open)}
        open={editState.open}
        title={editState.title}
        fields={editState.fields}
        onClose={() => setEditState({ ...editState, open: false })}
        onSave={editState.onSave}
      />

      <ConfirmDeleteDialog
        open={deleteConfirm.open}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, onConfirm: () => {} })}
      />

      <ConfigManagementDialog
        open={configManagementOpen}
        onClose={() => setConfigManagementOpen(false)}
        configs={configs}
        activeVersionName={activeConfig.data?.versionName}
        loadedVersionName={selectedConfigFile}
        onLoad={(versionName) => setSelectedConfigFile(versionName)}
        onActivate={(versionName) => void activateConfig(versionName)}
        onDelete={(versionName) => handleDeleteConfig(versionName)}
      />
    </Box>
  );
}
