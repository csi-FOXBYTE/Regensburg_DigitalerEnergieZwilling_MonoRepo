import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { municipalityDesign } from "@/config/theme";
import { useState } from "react";

interface EditDialogProps {
  open: boolean;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: string | number;
    type?: "text" | "number" | "select" | "color" | "string";
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
  onClose: () => void;
  onSave: (strings: Record<string, string>, numbers: Record<string, number>) => void;
}

export function EditDialog({
  open,
  title,
  fields,
  onClose,
  onSave,
}: EditDialogProps) {
  const [values, setValues] = useState<Record<string, string | number>>(
    fields.reduce((acc, field) => ({ ...acc, [field.key]: field.value }), {}),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});


  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && (!values[field.key] || values[field.key] === "")) {
        newErrors[field.key] = `${field.label} ist erforderlich`;
      }
      if (
        field.type === "number" &&
        values[field.key] !== "" &&
        isNaN(Number(values[field.key]))
      ) {
        newErrors[field.key] = `${field.label} muss eine Zahl sein`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const strings: Record<string, string> = {};
      const numbers: Record<string, number> = {};
      fields.forEach((field) => {
        if (field.type === "number") {
          const v = values[field.key];
          if (v !== "" && v !== undefined) numbers[field.key] = v as number;
        } else {
          strings[field.key] = (values[field.key] ?? "") as string;
        }
      });
      onSave(strings, numbers);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {fields.map((field) => {
            if (field.type === "color") {
              const colorValue = values[field.key] ?? municipalityDesign.colors.black;
              return (
                <Box key={field.key} sx={{ position: "relative" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      top: -9,
                      left: 10,
                      px: 0.5,
                      bgcolor: "background.paper",
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      lineHeight: 1,
                      zIndex: 1,
                    }}
                  >
                    {field.label}
                    {field.required ? " *" : ""}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 1.5,
                      py: 1.25,
                      border: "1px solid",
                      borderColor: "action.disabled",
                      borderRadius: 1,
                      "&:hover": { borderColor: "text.primary" },
                    }}
                  >
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          bgcolor: colorValue,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: (theme) =>
                            `inset 0 1px 3px ${theme.palette.action.disabled}`,
                        }}
                      />
                      <input
                        type="color"
                        value={colorValue}
                        onChange={(e) =>
                          setValues({ ...values, [field.key]: e.target.value })
                        }
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                          width: "100%",
                          height: "100%",
                          border: "none",
                          padding: 0,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        color: "text.secondary",
                        letterSpacing: 0.5,
                      }}
                    >
                      {colorValue}
                    </Typography>
                  </Box>
                </Box>
              );
            }

            if (field.type === "select" && field.options) {
              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  select
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [field.key]: e.target.value,
                    })
                  }
                  fullWidth
                  error={!!errors[field.key]}
                  helperText={errors[field.key]}
                  required={field.required}
                >
                  {field.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              );
            }

            return (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type || "text"}
                value={values[field.key] ?? ""}
                onChange={(e) =>
                  setValues({
                    ...values,
                    [field.key]:
                      field.type === "number"
                        ? e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value)
                        : e.target.value,
                  })
                }
                fullWidth
                error={!!errors[field.key]}
                helperText={errors[field.key]}
                required={field.required}
              />
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
