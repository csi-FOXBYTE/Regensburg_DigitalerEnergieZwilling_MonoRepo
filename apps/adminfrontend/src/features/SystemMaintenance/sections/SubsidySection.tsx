import type { SubsidyBenefit } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import {
  BoldItalicUnderlineToggles,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Delete, Edit, OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useStore } from "@nanostores/react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../../../components/ConfirmDeleteDialog";
import {
  addFoerderprogramm,
  deleteFoerderprogramm,
  foerderprogramme,
  updateFoerderprogramm,
  type SubsidyWrapper,
} from "../../../hooks/store";
import { CollapsibleSection } from "../CollapsibleSection";
import type { DeleteConfirmState } from "../ConfigOverview";

type FoerderartType = "euro" | "percent";

type FinanzierungType = "keine" | "kredit" | "zuschuss";

type FormState = {
  title: string;
  content: string;
  href: string;
  foerderart: FoerderartType;
  betrag: number | "";
  maximalbetrag: number | "";
  finanzierung: FinanzierungType;
  hinweis: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  href: "",
  foerderart: "euro",
  betrag: "",
  maximalbetrag: "",
  finanzierung: "keine",
  hinweis: "",
  isActive: true,
};

function toWrapper(form: FormState): SubsidyWrapper {
  const base = form.hinweis ? { for: form.hinweis } : {};
  let benefits: SubsidyBenefit;
  if (form.foerderart === "euro") {
    benefits = {
      ...base,
      type: "exactly",
      unit: "€",
      value: Number(form.betrag) || 0,
    };
  } else {
    benefits = {
      ...base,
      type: "range",
      unit: "%",
      from: Number(form.betrag) || 0,
      to: Number(form.maximalbetrag) || 0,
    };
  }
  const financing =
    form.finanzierung === "kredit"
      ? { financing: "loan" as const }
      : form.finanzierung === "zuschuss"
        ? { financing: "grant" as const }
        : {};
  return {
    subsidy: {
      title: form.title,
      ...financing,
      content: form.content,
      href: form.href,
      benefits,
    },
    isActive: form.isActive,
  };
}

function fromWrapper(w: SubsidyWrapper): FormState {
  const s = w.subsidy;
  const b = s.benefits;
  const isPercent = b.type === "range" || b.unit === "%";
  const foerderart: FoerderartType = isPercent ? "percent" : "euro";
  return {
    title: s.title,
    content: s.content,
    href: s.href,
    foerderart,
    betrag: b.type === "range" ? b.from : (b as { value: number }).value,
    maximalbetrag: b.type === "range" && b.to ? b.to : "",
    hinweis: b.for ?? "",
    isActive: w.isActive,
    finanzierung:
      s.financing === "loan"
        ? "kredit"
        : s.financing === "grant"
          ? "zuschuss"
          : "keine",
  };
}

interface FoerderprogrammDialogProps {
  open: boolean;
  initial?: SubsidyWrapper;
  onClose: () => void;
  onSave: (data: SubsidyWrapper) => void;
}

function FoerderprogrammDialog({
  open,
  initial,
  onClose,
  onSave,
}: FoerderprogrammDialogProps) {
  const [form, setFormState] = useState<FormState>(
    initial ? fromWrapper(initial) : { ...EMPTY_FORM },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Name ist erforderlich";
    const isPercent = form.foerderart === "percent";
    if (!isPercent) {
      if (form.betrag === "" || Number(form.betrag) < 0)
        newErrors.betrag = "Gültigen Betrag in € angeben";
    } else {
      if (
        form.betrag === "" ||
        Number(form.betrag) < 0 ||
        Number(form.betrag) > 100
      )
        newErrors.betrag = "Gültigen Betrag in % angeben";
      if (form.maximalbetrag !== "" && Number(form.maximalbetrag) < 0)
        newErrors.maximalbetrag = "Ungültiger Maximalbetrag";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(toWrapper(form));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {initial ? "Förderprogramm bearbeiten" : "Neues Förderprogramm"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            fullWidth
            error={!!errors.title}
            helperText={errors.title}
          />

          {/* Link */}
          <TextField
            label="Link (optional)"
            value={form.href}
            onChange={(e) => set("href", e.target.value)}
            fullWidth
            placeholder="https://..."
          />

          {/* Förderart + Beträge */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <FormControl sx={{ minWidth: 130 }}>
              <InputLabel>Förderart</InputLabel>
              <Select
                label="Förderart"
                value={form.foerderart}
                onChange={(e) => {
                  set("foerderart", e.target.value as FoerderartType);
                  set("betrag", "");
                  set("maximalbetrag", "");
                }}
              >
                <MenuItem value="euro">€ Absolut</MenuItem>
                <MenuItem value="percent">% Prozentual</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flex: 1, display: "flex", gap: 2 }}>
              {form.foerderart === "euro" ? (
                <TextField
                  label="Betrag"
                  type="number"
                  value={form.betrag}
                  onChange={(e) =>
                    set(
                      "betrag",
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  sx={{ flex: "0 0 calc(50% - 8px)" }}
                  required
                  error={!!errors.betrag}
                  helperText={errors.betrag}
                  slotProps={{
                    htmlInput: { min: 0 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">€</InputAdornment>
                      ),
                    },
                  }}
                />
              ) : (
                <>
                  <TextField
                    label="Betrag"
                    type="number"
                    value={form.betrag}
                    onChange={(e) =>
                      set(
                        "betrag",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    sx={{ flex: 1 }}
                    required
                    error={!!errors.betrag}
                    helperText={errors.betrag}
                    slotProps={{
                      htmlInput: { min: 0 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Maximalbetrag"
                    type="number"
                    value={form.maximalbetrag}
                    onChange={(e) =>
                      set(
                        "maximalbetrag",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    sx={{ flex: 1 }}
                    error={!!errors.maximalbetrag}
                    helperText={errors.maximalbetrag}
                    slotProps={{
                      htmlInput: { min: 0 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">€</InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Hinweis / for */}
          <TextField
            label="Hinweis (optional)"
            value={form.hinweis}
            onChange={(e) => set("hinweis", e.target.value)}
            fullWidth
            placeholder="z. B. pro m²"
          />
          <Box
            sx={{ display: "flex", flex: 1, gap: 2, alignItems: "flex-start" }}
          >
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Finanzierung</InputLabel>
              <Select
                label="Finanzierung"
                value={form.finanzierung}
                onChange={(e) => {
                  set("finanzierung", e.target.value as FinanzierungType);
                }}
              >
                <MenuItem value="keine">Keine</MenuItem>
                <MenuItem value="kredit">Kredit</MenuItem>
                <MenuItem value="zuschuss">Zuschuss</MenuItem>
              </Select>
            </FormControl>

            {/* Aktiv-Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
              }
              label="Aktiv"
            />
          </Box>

          {/* Beschreibung */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "action.disabled",
              borderRadius: 1,
              overflow: "hidden",
              "&:hover": { borderColor: "text.primary" },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                px: 1.75,
                pt: 0.75,
                pb: 0,
                display: "block",
                color: "text.secondary",
              }}
            >
              Beschreibung (optional)
            </Typography>
            <MDXEditor
              key={`desc-${open}-${initial?.subsidy.title ?? "new"}`}
              markdown={form.content}
              onChange={(val) => set("content", val)}
              contentEditableClassName="mdx-editor-content"
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <UndoRedo />
                      <BoldItalicUnderlineToggles />
                      <ListsToggle />
                    </>
                  ),
                }),
              ]}
            />
          </Box>
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

function formatPromotion(f: SubsidyWrapper["subsidy"]): string {
  const b = f.benefits;
  const forStr = b.for ? ` ${b.for}` : "";
  if (b.type === "range") {
    const maxStr = b.to ? ` (max. ${b.to.toLocaleString("de-DE")} €)` : "";
    return `${b.from.toLocaleString("de-DE")} %${forStr}${maxStr}`;
  }
  const prefix = b.type === "upTo" ? "bis " : "";
  return `${prefix}${b.value.toLocaleString("de-DE")} ${b.unit}${forStr}`;
}

export default function FoerderprogrammeSection({
  expandedSections,
  toggleSection,
}: {
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}) {
  const programs = useStore(foerderprogramme);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubsidyWrapper | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    onConfirm: () => {},
  });

  const openAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (w: SubsidyWrapper) => {
    setEditing(w);
    setDialogOpen(true);
  };

  const handleSave = (data: SubsidyWrapper) => {
    if (editing) {
      updateFoerderprogramm(editing.subsidy.title, (draft) =>
        Object.assign(draft, data),
      );
      toast.success("Förderprogramm aktualisiert");
    } else {
      addFoerderprogramm(data);
      toast.success("Förderprogramm hinzugefügt");
    }
  };

  const handleDelete = (title: string) => {
    setDeleteConfirm({
      open: true,
      onConfirm: () => {
        deleteFoerderprogramm(title);
        toast.success("Förderprogramm gelöscht");
        setDeleteConfirm({ open: false, onConfirm: () => {} });
      },
    });
  };

  return (
    <>
      <CollapsibleSection
        sectionKey="foerderprogramme"
        title={`Förderprogramme (${programs.length})`}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        action={
          <Button
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              openAdd();
            }}
          >
            Neues Programm +
          </Button>
        }
      >
        {programs.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body1">
              Noch keine Förderprogramme hinterlegt.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Beschreibung</TableCell>
                  <TableCell align="right">
                    Förderung
                  </TableCell>
                  <TableCell>Finanzierung</TableCell>
                  <TableCell align="center">
                    Status
                  </TableCell>
                  <TableCell align="right">
                    Aktionen
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {programs.map((w) => (
                  <TableRow key={w.subsidy.title} hover>
                    <TableCell sx={{ fontSize: "medium" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {w.subsidy.title}
                        {w.subsidy.href && (
                          <IconButton
                            size="small"
                            component="a"
                            href={w.subsidy.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ p: 0.25 }}
                          >
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 260 }}
                      >
                        {w.subsidy.content || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ whiteSpace: "nowrap", fontWeight: 500 }}
                    >
                      {formatPromotion(w.subsidy)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {w.subsidy.financing === "loan"
                        ? "Kredit"
                        : w.subsidy.financing === "grant"
                          ? "Zuschuss"
                          : "Keine"}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={w.isActive ? "Aktiv" : "Inaktiv"}
                        color={w.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <IconButton size="small" onClick={() => openEdit(w)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(w.subsidy.title)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CollapsibleSection>

      <FoerderprogrammDialog
        key={dialogOpen ? (editing?.subsidy.title ?? "new") : "closed"}
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={deleteConfirm.open}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm({ open: false, onConfirm: () => {} })}
      />
    </>
  );
}
