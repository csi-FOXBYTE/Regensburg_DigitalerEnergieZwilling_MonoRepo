import { readFile } from "node:fs/promises";
import Handlebars from "handlebars";
import type { FeedbackCategory } from "../zenstack/models.js";

export type FeedbackSubmittedData = {
  id: string;
  category: FeedbackCategory;
  message: string;
  emailAddress?: string | null;
  createdAt: Date;
};

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

let feedbackSubmittedTemplate: Promise<Handlebars.TemplateDelegate> | undefined;

function getFeedbackSubmittedTemplate() {
  // Share loading/compilation across requests, but allow retry after a read error.
  feedbackSubmittedTemplate ??= readFile(
    new URL("../templates/feedback_submitted.hbs", import.meta.url),
    "utf8",
  ).then((source) => Handlebars.compile(source)).catch((error: unknown) => {
    feedbackSubmittedTemplate = undefined;
    throw error;
  });
  return feedbackSubmittedTemplate;
}

export async function renderFeedbackSubmitted(data: FeedbackSubmittedData) {
  const render = await getFeedbackSubmittedTemplate();
  // Pass only the fields this template needs. Matomo is intentionally not wired.
  const values = {
    id: data.id,
    category: categoryLabels[data.category],
    message: data.message,
    emailAddress: data.emailAddress,
    createdAt: `${dateFormatter.format(data.createdAt)} Uhr (Europe/Berlin)`,
  };

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
