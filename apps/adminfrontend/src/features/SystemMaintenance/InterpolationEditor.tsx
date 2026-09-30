import type { LinearInterpolation } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { Add, Delete } from "@mui/icons-material";
import { Box, Button, IconButton } from "@mui/material";
import { NumberField } from "./NumberField";

export function InterpolationEditor({
  value,
  onChange,
  atLabel,
  valueLabel,
  atStep,
}: {
  value: LinearInterpolation;
  onChange: (value: LinearInterpolation) => void;
  atLabel: string;
  valueLabel: string;
  atStep: number;
}) {
  const updatePoint = (index: number, field: "at" | "value", next: number) => {
    const updated = structuredClone(value);
    updated.points[index]![field] = next;
    onChange(updated);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
      {value.points.map((point, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
          }}
        >
          <NumberField
            label={atLabel}
            value={point.at}
            min={index === 0 ? atStep : value.points[index - 1]!.at + atStep}
            max={
              value.points[index + 1]
                ? value.points[index + 1]!.at - atStep
                : undefined
            }
            step={atStep}
            onCommit={(next) => updatePoint(index, "at", next)}
          />
          <NumberField
            label={valueLabel}
            value={point.value}
            min={0}
            onCommit={(next) => updatePoint(index, "value", next)}
          />
          <IconButton
            size="small"
            aria-label={`Stützpunkt ${index + 1} entfernen`}
            disabled={value.points.length <= 2}
            onClick={() => {
              const updated = structuredClone(value);
              updated.points.splice(index, 1);
              onChange(updated);
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<Add />}
        sx={{ alignSelf: "flex-start" }}
        onClick={() => {
          const updated = structuredClone(value);
          const last = updated.points[updated.points.length - 1]!;
          updated.points.push({ at: last.at + atStep, value: last.value });
          onChange(updated);
        }}
      >
        Stützpunkt hinzufügen
      </Button>
    </Box>
  );
}
