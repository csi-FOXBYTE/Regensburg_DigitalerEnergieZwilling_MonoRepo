import { Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useStore } from "@nanostores/react";
import { toast } from "sonner";
import {
  addEnergyEfficiencyClass,
  deleteEnergyEfficiencyClass,
  type EnergyEfficiencyEntry,
  updateEnergyEfficiencyClass,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import { type DeleteConfirmState, type EditState } from "../ConfigOverview";

export function EnergyEfficiencySection({
  configStore,
  setEditState,
  setDeleteConfirm,
  expandedSections,
  toggleSection,
}: {
  configStore: ReturnType<typeof useStore>;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<DeleteConfirmState>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const handleDeleteConfirm = (onConfirm: () => void) => {
    setDeleteConfirm({ open: true, onConfirm });
  };

  const handleEditEnergyClass = (index: number) => {
    const bands = configStore.general
      .energyEfficiencyClasses as EnergyEfficiencyEntry[];
    const item = bands[index];
    if (!item) return;

    const colorEntry = (
      configStore.general.energyEfficiencyClassColors as {
        key: string;
        value: string;
      }[]
    ).find((c) => c.key === item.value);
    const color = colorEntry?.value ?? municipalityDesign.colors.black;

    setEditState({
      open: true,
      title: "Energieeffizienzklasse bearbeiten",
      fields: [
        {
          key: "from",
          label: "Von (kWh/m²a)",
          value: item.from ?? "",
          type: "number" as const,
        },
        {
          key: "to",
          label: "Bis (kWh/m²a)",
          value: item.to ?? "",
          type: "number" as const,
        },
        {
          key: "value",
          label: "Klasse",
          value: item.value,
          type: "text" as const,
          required: true,
        },
        {
          key: "color",
          label: "Farbe",
          value: color,
          type: "color" as const,
          required: true,
        },
      ],
      onSave: (strings, numbers) => {
        updateEnergyEfficiencyClass(index, (draft) => {
          draft.from = numbers.from;
          draft.to = numbers.to;
          if (strings.value) draft.value = strings.value;
          if (strings.color) draft.color = strings.color;
        });
      },
    });
  };

  const handleAddEnergyEfficiencyClass = () => {
    const bands = configStore.general
      .energyEfficiencyClasses as EnergyEfficiencyEntry[];
    const isEmpty = bands.length === 0;

    setEditState({
      open: true,
      title: "Neue Energieeffizienzklasse hinzufügen",
      fields: [
        ...(!isEmpty
          ? [
              {
                key: "from",
                label: "Von (kWh/m²a) — leer = neuer Anfang",
                value: "",
                type: "number" as const,
              },
            ]
          : []),
        ...(!isEmpty
          ? [
              {
                key: "to",
                label: "Bis (kWh/m²a) — leer = neues Ende",
                value: "",
                type: "number" as const,
              },
            ]
          : []),
        {
          key: "value",
          label: "Klasse",
          value: "",
          type: "text" as const,
          required: true,
        },
        {
          key: "color",
          label: "Farbe",
          value: municipalityDesign.colors.status.approved,
          type: "color" as const,
          required: true,
        },
      ],
      onSave: (strings, numbers) => {
        addEnergyEfficiencyClass({
          from: numbers.from,
          to: numbers.to,
          value: strings.value!,
          color: strings.color!,
        });
      },
    });
  };

  return (
    <CollapsibleSection
      sectionKey="energyEfficiency"
      title="Energieeffizienzklassen"
      expandedSections={expandedSections}
      toggleSection={toggleSection}
      action={
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            handleAddEnergyEfficiencyClass();
          }}
        >
          Neue Energieeffizienzklasse +
        </Button>
      }
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography fontWeight={"bold"}>Klasse</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight={"bold"}>Hex-Wert Farbe</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight={"bold"}>Primärenergiebedarf</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight={"bold"}>Aktionen</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configStore.general.energyEfficiencyClasses.map(
              (item: EnergyEfficiencyEntry, index: number) => {
                const colorEntry = (
                  configStore.general.energyEfficiencyClassColors as {
                    key: string;
                    value: string;
                  }[]
                ).find((c) => c.key === item.value);
                const color = colorEntry?.value;
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        label={item.value}
                        size="small"
                        sx={{
                          minWidth: 50,
                          bgcolor: color,
                          color: "common.white",
                          fontWeight: "600",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 0.5,
                            bgcolor: color,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Typography variant="body1">{color}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {item.to == null && item.from != null
                          ? ` > ${item.from} kWh/m²a`
                          : item.from == null
                            ? `< ${item.to} kWh/m²a`
                            : `${item.from} - ${item.to} kWh/m²a`}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditEnergyClass(index)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteConfirm(() => {
                            deleteEnergyEfficiencyClass(index);
                            toast.success("Energieeffizienzklasse gelöscht");
                          })
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              },
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CollapsibleSection>
  );
}
import { municipalityDesign } from "@/config/theme";
