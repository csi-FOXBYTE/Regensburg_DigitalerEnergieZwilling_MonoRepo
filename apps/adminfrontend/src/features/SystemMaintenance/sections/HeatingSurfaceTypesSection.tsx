import { Delete, Edit } from "@mui/icons-material";
import {
  Button,
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
import type { TempControlEntry } from "../../../hooks/store";
import {
  addHeatingSurfaceType,
  deleteHeatingSurfaceType,
  updateConfig,
  updateHeatingSurfaceType,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import type { DeleteConfirmState, EditState } from "../ConfigOverview";

export default function HeatingSurfaceTypesSection({
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

  const handleAddHeatingSurfaceType = () => {
    setEditState({
      open: true,
      title: "Neue Heizflächenart hinzufügen",
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
        addHeatingSurfaceType({
          value: strings.value ?? "",
          localization: { de: strings.de ?? "", en: strings.de ?? "" },
        });
        toast.success("Heizflächentyp hinzugefügt");
      },
    });
  };

  const handleEditHeatingSurfaceType = (index: number) => {
    const item = configStore.heat.heatingSurfaceTypes[index];
    if (!item) return;
    setEditState({
      open: true,
      title: "Heizflächenart bearbeiten",
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
          value: item.localization.de,
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
            const type = draft.heat.heatingSurfaceTypes.find(
              (t) => t.value === oldKey,
            );
            if (type) {
              type.value = newKey;
              type.localization.de = newDe;
              type.localization.en = newDe;
            }
            if (draft.heat.defaultHeatingSurfaceType === oldKey) {
              draft.heat.defaultHeatingSurfaceType = newKey;
            }
            (
              draft.heat
                .temperatureControlPerformanceFactor as TempControlEntry[]
            ).forEach((entry) => {
              entry.value.forEach((yearRow) => {
                yearRow.value.forEach((cell) => {
                  if (cell.key === oldKey) cell.key = newKey;
                });
              });
            });
          });
        } else {
          updateHeatingSurfaceType(index, (draft) => {
            draft.localization.de = newDe;
            draft.localization.en = newDe;
          });
        }
        toast.success("Heizflächenart aktualisiert");
      },
    });
  };

  return (
    <CollapsibleSection
      sectionKey="heatingSurfaceTypes"
      title={`Heizflächenarten (${configStore.heat.heatingSurfaceTypes.length})`}
      expandedSections={expandedSections}
      toggleSection={toggleSection}
      action={
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            handleAddHeatingSurfaceType();
          }}
        >
          Neue Heizflächenart +
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
            {configStore.heat.heatingSurfaceTypes.map(
              (
                item: { value: string; localization: { de: string } },
                index: number,
              ) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontSize: "medium" }}>
                    {item.localization.de}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditHeatingSurfaceType(index)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleDeleteConfirm(() => {
                          deleteHeatingSurfaceType(index);
                          toast.success("Heizflächentyp gelöscht");
                        })
                      }
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CollapsibleSection>
  );
}
