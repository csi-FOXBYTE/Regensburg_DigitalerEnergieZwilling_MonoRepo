import { readFile } from "node:fs/promises";
import Handlebars from "handlebars";
import type { FeedbackCategory } from "../zenstack/models.js";

export type FeedbackSubmittedData = {
  id: string;
  category: FeedbackCategory;
  message: string;
  emailAddress?: string | null;
  // Shown under "Technische Details" when present. The public app does not
  // send it with feedback yet, so today only the admin preview has one.
  matomoSessionId?: string | null;
  createdAt: Date;
};

// Upper bound for a template maintained in the admin area. The bundled
// default is about 4 KB; generous room for inlined styles, no room for abuse.
export const MAX_FEEDBACK_TEMPLATE_LENGTH = 100_000;

export class InvalidMailTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMailTemplateError";
  }
}

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: "Fehlermeldung",
  feedback: "Feedback",
  suggestion: "Verbesserungsvorschlag",
};
const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

// Example shown in the admin preview. Says plainly that it is an example, and
// contains a line break and a character that must be escaped, so the preview
// shows how real messages will look.
export const feedbackPreviewData: FeedbackSubmittedData = {
  id: "beispiel-feedback-id",
  category: "suggestion",
  message:
    "[Beispiel] Hier steht später der Text, den die Person im Feedback-Formular eingegeben hat.\nZeilenumbrüche & Sonderzeichen werden übernommen.",
  emailAddress: "beispiel@example.de",
  matomoSessionId: "beispiel-matomo-session-id",
  createdAt: new Date("2026-10-19T12:32:00Z"),
};

// Isolated instance: no helpers or partials beyond the Handlebars built-ins,
// independent of anything registered on the global instance.
const handlebars = Handlebars.create();
const compileOptions = { knownHelpersOnly: true } as const;

let defaultTemplateSource: Promise<string> | undefined;

export function getDefaultFeedbackTemplateSource() {
  // Share loading across requests, but allow retry after a read error.
  defaultTemplateSource ??= readFile(
    new URL("../templates/feedback_submitted.hbs", import.meta.url),
    "utf8",
  ).catch((error: unknown) => {
    defaultTemplateSource = undefined;
    throw error;
  });
  return defaultTemplateSource;
}

type Statement = { type: string; escaped?: boolean; loc?: { start: { line: number } } };

// Rejects constructs that would let submitted content bypass HTML escaping or
// pull in code that is not part of the template itself.
function assertSafeTemplate(source: string) {
  let program: hbs.AST.Program;
  try {
    program = handlebars.parse(source);
  } catch (error) {
    throw new InvalidMailTemplateError(
      error instanceof Error ? error.message : String(error),
    );
  }

  const problems: string[] = [];
  const visitor = new Handlebars.Visitor();
  const report = (node: Statement, problem: string) =>
    problems.push(`${problem} (line ${node.loc?.start.line ?? "?"})`);
  visitor.MustacheStatement = function (node) {
    if (!(node as Statement).escaped)
      report(node, "Unescaped output ({{{ }}} or {{& }}) is not allowed");
    return Handlebars.Visitor.prototype.MustacheStatement.call(this, node);
  };
  visitor.PartialStatement = function (node) {
    report(node, "Partials ({{> }}) are not supported");
  };
  visitor.PartialBlockStatement = function (node) {
    report(node, "Partials ({{#> }}) are not supported");
  };
  visitor.DecoratorBlock = function (node) {
    report(node, "Decorators are not supported");
  };
  visitor.Decorator = function (node) {
    report(node, "Decorators are not supported");
  };
  visitor.accept(program);

  if (problems.length > 0) throw new InvalidMailTemplateError(problems.join("; "));
}

const toTemplateValues = (data: FeedbackSubmittedData) => ({
  // Pass only the fields the template may use.
  id: data.id,
  category: categoryLabels[data.category],
  message: data.message,
  emailAddress: data.emailAddress,
  matomoSessionId: data.matomoSessionId,
  createdAt: `${dateFormatter.format(data.createdAt)} Uhr (Europe/Berlin)`,
});

// Keyed by source: the stored template rarely changes, so a tiny cache avoids
// recompiling on every feedback without holding on to old versions.
const compiled = new Map<string, Handlebars.TemplateDelegate>();
const MAX_CACHED_TEMPLATES = 4;

/**
 * Validates and compiles an HTML mail template. Throws
 * InvalidMailTemplateError with a technical description for syntax errors,
 * unsafe constructs or templates that fail to render.
 */
export function compileFeedbackTemplate(source: string) {
  const cached = compiled.get(source);
  if (cached) return cached;

  if (source.trim().length === 0)
    throw new InvalidMailTemplateError("Template must not be empty");
  if (source.length > MAX_FEEDBACK_TEMPLATE_LENGTH)
    throw new InvalidMailTemplateError(
      `Template must not exceed ${MAX_FEEDBACK_TEMPLATE_LENGTH} characters`,
    );
  assertSafeTemplate(source);

  let render: Handlebars.TemplateDelegate;
  try {
    // Handlebars compiles lazily; precompile surfaces errors such as unknown
    // helpers now instead of on the first feedback.
    handlebars.precompile(source, compileOptions);
    render = handlebars.compile(source, compileOptions);
    render(toTemplateValues(feedbackPreviewData));
  } catch (error) {
    throw new InvalidMailTemplateError(
      error instanceof Error ? error.message : String(error),
    );
  }

  if (compiled.size >= MAX_CACHED_TEMPLATES) compiled.clear();
  compiled.set(source, render);
  return render;
}

/**
 * Renders the feedback notification. Uses the given template source, or the
 * bundled default when none is given. The plain-text part is not
 * configurable.
 */
export async function renderFeedbackSubmitted(
  data: FeedbackSubmittedData,
  templateSource?: string,
) {
  const render = compileFeedbackTemplate(
    templateSource ?? (await getDefaultFeedbackTemplateSource()),
  );
  const values = toTemplateValues(data);

  return {
    html: render(values),
    text: [
      "Neues Feedback eingegangen",
      "",
      `Kategorie: ${values.category}`,
      `Erstellt am: ${values.createdAt}`,
      "",
      "Nachricht:",
      values.message,
      ...(values.emailAddress ? ["", `Kontakt: ${values.emailAddress}`] : []),
      "",
      `Feedback-ID: ${values.id}`,
      "",
      "Automatische Benachrichtigung · Digitaler Energiezwilling Regensburg",
    ].join("\n"),
  };
}
