import { AppFooter } from "@/components/Footer";
import {
  useFeedbackMailTemplate,
  useFeedbackMailTemplatePreview,
  useResetFeedbackMailTemplate,
  useSaveFeedbackMailTemplate,
} from "@/hooks/mailTemplateHooks";
import { useDebounce } from "@/hooks/useDebounce";
import { isApiError } from "@/lib/apiClient";
import { findHtmlIssues, insertPlaceholder } from "@/lib/mailTemplateEditing";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useBlocker } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

const EDITOR_LINE_HEIGHT = 22;
const MAX_LISTED_HTML_ISSUES = 8;

// Two panels (editor, preview) whose headers and bodies share grid rows, so
// both line up at every width where they sit side by side.
const panelHeaderSx = {
  border: 1,
  borderColor: "divider",
  borderBottom: 0,
  borderRadius: "4px 4px 0 0",
  bgcolor: "background.default",
  px: 2,
  py: 1.5,
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minWidth: 0,
} as const;
const panelBodySx = {
  border: 1,
  borderColor: "divider",
  borderRadius: "0 0 4px 4px",
  bgcolor: "#fff",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
} as const;

// Mirrors toTemplateValues in apps/backend/src/mail/mail.templates.ts.
const PLACEHOLDERS = [
  { token: "{{category}}", label: "Kategorie", hint: "z. B. „Fehlermeldung“ oder „Verbesserungsvorschlag“" },
  { token: "{{message}}", label: "Nachricht", hint: "Der eingegebene Feedback-Text" },
  { token: "{{createdAt}}", label: "Eingangszeit", hint: "z. B. „19.10.2026, 14:32 Uhr (Europe/Berlin)“" },
  { token: "{{emailAddress}}", label: "E-Mail-Adresse", hint: "Nur vorhanden, wenn die Person eine angegeben hat" },
  { token: "{{id}}", label: "Feedback-ID", hint: "Technische Kennung des Feedbacks" },
  {
    token: "{{matomoSessionId}}",
    label: "Matomo-Session-ID",
    hint: "Nur vorhanden, wenn die Person der Webanalyse zugestimmt hat und die ID mit dem Feedback übermittelt wird",
  },
] as const;

// Turns the backend's technical reason into an explanation for non-developers.
function explainTemplateError(detail: string | undefined) {
  if (!detail) return "Die Vorlage konnte nicht verarbeitet werden.";
  if (/Unescaped output/.test(detail))
    return "Dreifache geschweifte Klammern {{{ … }}} sind nicht erlaubt. Bitte zwei Klammern {{ … }} verwenden, damit Inhalte aus dem Feedback sicher dargestellt werden.";
  if (/Partials/.test(detail))
    return "Teilvorlagen ({{> …}}) werden nicht unterstützt.";
  if (/Decorators/.test(detail))
    return "Die Schreibweise {{* …}} wird nicht unterstützt.";
  const helper = /unknown helper (\S+)/.exec(detail)?.[1];
  if (helper)
    return `„${helper}“ ist kein verfügbarer Platzhalter und keine verfügbare Funktion. Erlaubt sind die unten aufgeführten Platzhalter sowie {{#if}}, {{#unless}}, {{#each}} und {{#with}}.`;
  if (/must not be empty/.test(detail)) return "Die Vorlage darf nicht leer sein.";
  if (/must not exceed/.test(detail)) return "Die Vorlage ist zu lang.";
  return "Die Platzhalter sind fehlerhaft geschrieben, z. B. fehlt eine schließende Klammer }} oder zu einem {{#if …}} das passende {{/if}}.";
}

const errorDetail = (error: unknown) =>
  isApiError(error) && error.status === 400 ? error.detail : undefined;

/**
 * Shows the rendered mail at its own height, so the template's page
 * background does not stretch over empty space. The sandbox allows no
 * scripts, forms or navigation; allow-same-origin only lets this page read
 * the content height, since without scripts the template cannot use it.
 */
function PreviewFrame({ html }: { html: string }) {
  const [height, setHeight] = useState(480);
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  const measure = (frame: HTMLIFrameElement) => {
    observer.current?.disconnect();
    const root = frame.contentDocument?.documentElement;
    if (!root) return;
    // The root element's box spans the whole content including body margins
    // (unlike scrollHeight, which never drops below the frame height), so the
    // frame can grow and shrink with it. Follows layout changes, e.g. when a
    // narrower column wraps the text.
    observer.current = new ResizeObserver(() =>
      setHeight(Math.ceil(root.getBoundingClientRect().height)),
    );
    observer.current.observe(root);
  };

  return (
    <iframe
      title="Vorschau der Mail-Vorlage"
      sandbox="allow-same-origin"
      srcDoc={html}
      onLoad={(event) => measure(event.currentTarget)}
      style={{ display: "block", border: 0, width: "100%", height, background: "#fff" }}
    />
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function MailTemplatePage() {
  const template = useFeedbackMailTemplate();
  const save = useSaveFeedbackMailTemplate();
  const reset = useResetFeedbackMailTemplate();

  // null until the stored template has loaded, then the editor content.
  const [draft, setDraft] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (template.data && draft === null) setDraft(template.data.html);

  const html = draft ?? "";
  const isDirty = draft !== null && draft !== template.data?.html;
  const previewSource = useDebounce(html, 500);
  const preview = useFeedbackMailTemplatePreview(previewSource);
  // Keeps showing the last valid rendering while the draft has an error.
  const [lastPreviewHtml, setLastPreviewHtml] = useState<string | null>(null);
  if (preview.data && preview.data.html !== lastPreviewHtml)
    setLastPreviewHtml(preview.data.html);
  const previewHtml = preview.data?.html ?? lastPreviewHtml;
  const isPreviewCurrent = previewSource === html && !preview.isFetching;
  const previewError = preview.isError && isPreviewCurrent ? preview.error : null;
  const missingMessage = html.trim().length > 0 && !/\{\{\s*message\s*\}\}/.test(html);
  // Warnings only: browsers repair such markup, mail clients may not.
  const htmlIssues = findHtmlIssues(previewSource);
  const canSave = isDirty && !save.isPending && html.trim().length > 0 && !previewError;

  useBlocker({
    shouldBlockFn: () =>
      isDirty &&
      !window.confirm("Die Vorlage hat ungespeicherte Änderungen. Seite trotzdem verlassen?"),
    enableBeforeUnload: () => isDirty,
  });

  // Replaces a range of the editor text through the browser's own text
  // input, so the change lands in the editor's undo history (Ctrl+Z,
  // Ctrl+Y). Setting the value from script would clear that history.
  const replaceInEditor = (start: number, end: number, text: string) => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      editor.setSelectionRange(start, end);
      // Deprecated, but still the only way to edit a text field with undo
      // support. Fires an input event, which updates the draft via onChange.
      if (document.execCommand("insertText", false, text)) return;
    }
    const result = insertPlaceholder(html, start, end, text);
    setDraft(result.text);
    requestAnimationFrame(() => {
      editor?.focus();
      editor?.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const handleInsertPlaceholder = (token: string) => {
    const editor = editorRef.current;
    replaceInEditor(
      editor?.selectionStart ?? html.length,
      editor?.selectionEnd ?? html.length,
      token,
    );
  };

  // Selects the line in the editor and scrolls it into the upper third.
  const goToLine = (line: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    const lines = html.split("\n");
    const start = lines.slice(0, line - 1).reduce((sum, text) => sum + text.length + 1, 0);
    editor.focus();
    editor.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
    editor.scrollTop = Math.max(0, (line - 1) * EDITOR_LINE_HEIGHT - editor.clientHeight / 3);
  };

  const handleSave = () => {
    save.mutate(html, {
      onSuccess: (saved) => {
        setDraft(saved.html);
        toast.success("Mail-Vorlage gespeichert");
      },
      onError: (error) =>
        toast.error("Die Vorlage wurde nicht gespeichert", {
          description: errorDetail(error)
            ? explainTemplateError(errorDetail(error))
            : "Bitte später erneut versuchen.",
        }),
    });
  };

  // Ctrl+S / Cmd+S saves instead of opening the browser's "save page" dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (canSave) handleSave();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleReset = () => {
    reset.mutate(undefined, {
      onSuccess: (restored) => {
        setDraft(restored.html);
        setResetOpen(false);
        toast.success("Standardvorlage wiederhergestellt");
      },
      onError: () => toast.error("Die Standardvorlage konnte nicht wiederhergestellt werden"),
    });
  };

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
        <Box>
          <Typography variant="h2" gutterBottom>
            Mail-Vorlage
          </Typography>
          <Typography variant="body1">
            Gestaltung der Benachrichtigungsmail, die bei neuem Feedback versendet wird
          </Typography>
        </Box>

        {template.isPending && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress aria-label="Mail-Vorlage wird geladen" />
          </Box>
        )}

        {template.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => void template.refetch()}>Erneut versuchen</Button>}
          >
            Die Mail-Vorlage konnte nicht geladen werden.
          </Alert>
        )}

        {template.data && (
          <>
            <Paper
              variant="outlined"
              sx={{ p: 2, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Verwendete Vorlage
                </Typography>
                <Typography variant="body1">
                  {template.data.isDefault ? "Standardvorlage" : "Eigene Vorlage"}
                </Typography>
              </Box>
              {template.data.updatedAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Zuletzt geändert
                  </Typography>
                  <Typography variant="body1">
                    {dateTimeFormatter.format(new Date(template.data.updatedAt))} Uhr
                  </Typography>
                </Box>
              )}
              {isDirty && <Chip label="Ungespeicherte Änderungen" color="warning" />}
              {!template.data.isDefault && (
                <Button
                  variant="outlined"
                  onClick={() => setResetOpen(true)}
                  sx={{ ml: "auto" }}
                >
                  Standardvorlage wiederherstellen
                </Button>
              )}
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" },
                gridTemplateAreas: {
                  xs: '"editorHead" "editorBody" "editorNotes" "previewHead" "previewBody"',
                  lg: '"editorHead previewHead" "editorBody previewBody" "editorNotes previewNotes"',
                },
                columnGap: 3,
              }}
            >
              <Box sx={{ ...panelHeaderSx, gridArea: "editorHead" }}>
                <Typography variant="h4">HTML-Vorlage</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Platzhalter einfügen:
                  </Typography>
                  {PLACEHOLDERS.map((placeholder) => (
                    <Tooltip
                      key={placeholder.token}
                      title={`${placeholder.token} – ${placeholder.hint}`}
                    >
                      <Chip
                        label={placeholder.label}
                        size="small"
                        variant="outlined"
                        onClick={() => handleInsertPlaceholder(placeholder.token)}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  ...panelBodySx,
                  gridArea: "editorBody",
                  "&:focus-within": { borderColor: "primary.main" },
                }}
              >
                <Box
                  component="textarea"
                  ref={editorRef}
                  value={html}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
                  spellCheck={false}
                  aria-label="HTML-Vorlage"
                  sx={{
                    flex: 1,
                    width: "100%",
                    minHeight: 560,
                    m: 0,
                    p: 2,
                    border: 0,
                    outline: "none",
                    // The panel row sets the height (grid stretch), so a handle would do nothing.
                    resize: "none",
                    bgcolor: "transparent",
                    color: "text.primary",
                    fontFamily: "monospace",
                    fontSize: 14,
                    lineHeight: `${EDITOR_LINE_HEIGHT}px`,
                    tabSize: 2,
                    whiteSpace: "pre",
                    overflow: "auto",
                  }}
                />
              </Box>

              <Box
                sx={{
                  gridArea: "editorNotes",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  pt: 2,
                  pb: { xs: 3, lg: 0 },
                }}
              >
                {missingMessage && (
                  <Alert severity="warning">
                    Die Vorlage enthält den Platzhalter {"{{message}}"} nicht. Der Feedback-Text
                    würde in der Mail dann fehlen.
                  </Alert>
                )}

                {htmlIssues.length > 0 && (
                  <Alert severity="warning">
                    <AlertTitle>Mögliche Fehler im HTML ({htmlIssues.length})</AlertTitle>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Browser gleichen solche Fehler oft unbemerkt aus, Mailprogramme nicht
                      unbedingt. Speichern ist trotzdem möglich.
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                      {htmlIssues.slice(0, MAX_LISTED_HTML_ISSUES).map((issue, index) => (
                        <Typography component="li" variant="body2" key={index}>
                          <Box
                            component="button"
                            type="button"
                            onClick={() => goToLine(issue.line)}
                            sx={{
                              p: 0,
                              border: 0,
                              bgcolor: "transparent",
                              color: "inherit",
                              font: "inherit",
                              fontWeight: 700,
                              textDecoration: "underline",
                              cursor: "pointer",
                            }}
                          >
                            Zeile {issue.line}
                          </Box>
                          : {issue.message}
                        </Typography>
                      ))}
                    </Box>
                    {htmlIssues.length > MAX_LISTED_HTML_ISSUES && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        … und {htmlIssues.length - MAX_LISTED_HTML_ISSUES} weitere
                      </Typography>
                    )}
                  </Alert>
                )}

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Tooltip title="Strg+S">
                    {/* span: a disabled button fires no events for the tooltip */}
                    <span>
                      <Button variant="contained" onClick={handleSave} disabled={!canSave}>
                        Speichern
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    onClick={() => replaceInEditor(0, html.length, template.data.html)}
                    disabled={!isDirty || save.isPending}
                  >
                    Änderungen verwerfen
                  </Button>
                </Box>
              </Box>

              <Box sx={{ ...panelHeaderSx, gridArea: "previewHead" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h4">Vorschau</Typography>
                  <Chip label="Beispieldaten" color="info" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Platzhalter sind mit erfundenen Werten gefüllt. Im Mailprogramm kann die
                  Darstellung leicht abweichen.
                </Typography>
              </Box>

              <Box sx={{ ...panelBodySx, gridArea: "previewBody" }}>
                {previewError && (
                  <Alert severity="error" sx={{ borderRadius: 0 }}>
                    <AlertTitle>Die Vorlage enthält einen Fehler</AlertTitle>
                    <Typography variant="body2">
                      {explainTemplateError(errorDetail(previewError))}
                    </Typography>
                    {errorDetail(previewError) && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                      >
                        Technische Details: {errorDetail(previewError)}
                      </Typography>
                    )}
                  </Alert>
                )}
                <Box sx={{ opacity: previewError ? 0.4 : 1 }}>
                  {previewHtml ? (
                    <PreviewFrame html={previewHtml} />
                  ) : (
                    <Box
                      sx={{
                        height: 240,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {preview.isFetching ? (
                        <CircularProgress aria-label="Vorschau wird erstellt" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Keine Vorschau verfügbar
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>
          <Typography variant="h4">Standardvorlage wiederherstellen?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Die eigene Vorlage wird gelöscht. Neue Benachrichtigungen werden wieder mit der
            mitgelieferten Standardvorlage versendet.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setResetOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReset}
            disabled={reset.isPending}
          >
            Wiederherstellen
          </Button>
        </DialogActions>
      </Dialog>

      <AppFooter />
    </Box>
  );
}
