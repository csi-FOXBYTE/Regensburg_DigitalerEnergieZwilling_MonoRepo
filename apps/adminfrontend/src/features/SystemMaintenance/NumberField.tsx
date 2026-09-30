import { TextField } from "@mui/material";
import { useState } from "react";

/** Commit complete, valid numbers; keep partially typed values local. */
export function NumberField({
  value,
  onCommit,
  label,
  min,
  max,
  step = "any",
}: {
  value: number;
  onCommit: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number | "any";
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <TextField
      size="small"
      type="number"
      label={label}
      sx={{ minWidth: 260, flex: "0 1 300px" }}
      value={draft ?? value}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        const input = event.target as HTMLInputElement;
        const next = input.valueAsNumber;
        if (Number.isFinite(next) && input.validity.valid) onCommit(next);
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") (event.target as HTMLInputElement).blur();
        if (event.key === "Escape") setDraft(null);
      }}
      slotProps={{ htmlInput: { min, max, step } }}
    />
  );
}
