import { createService } from "../toab/index.js";
import { getDatabaseService } from "../@internals/index.js";
import { logEvent } from "../lib/pino.js";
import {
  compileFeedbackTemplate,
  feedbackPreviewData,
  getDefaultFeedbackTemplateSource,
  renderFeedbackSubmitted,
  type FeedbackSubmittedData,
} from "../mail/mail.templates.js";

type DB = Awaited<ReturnType<typeof getDatabaseService>>;

// The table holds at most this one row (CHECK constraint in the migration).
const TEMPLATE_ID = 1;

export const getFeedbackMailTemplate = async (db: DB) => {
  const [stored, defaultHtml] = await Promise.all([
    db.feedbackMailTemplate.findUnique({ where: { id: TEMPLATE_ID } }),
    getDefaultFeedbackTemplateSource(),
  ]);
  return {
    html: stored?.html ?? defaultHtml,
    isDefault: !stored,
    updatedAt: stored?.updatedAt ?? null,
    defaultHtml,
  };
};

export const saveFeedbackMailTemplate = async (db: DB, html: string) => {
  // Throws InvalidMailTemplateError, so a broken template is never stored.
  compileFeedbackTemplate(html);
  await db.feedbackMailTemplate.upsert({
    where: { id: TEMPLATE_ID },
    create: { id: TEMPLATE_ID, html },
    update: { html },
  });
  return getFeedbackMailTemplate(db);
};

export const resetFeedbackMailTemplate = async (db: DB) => {
  await db.feedbackMailTemplate.deleteMany({ where: { id: TEMPLATE_ID } });
  return getFeedbackMailTemplate(db);
};

export const previewFeedbackMailTemplate = async (html: string) =>
  (await renderFeedbackSubmitted(feedbackPreviewData, html)).html;

/**
 * Renders the notification with the stored template. Falls back to the
 * bundled default when no template is stored or the stored one fails, so a
 * template problem never suppresses the notification.
 */
export const renderFeedbackNotification = async (
  db: DB,
  data: FeedbackSubmittedData,
) => {
  const stored = await db.feedbackMailTemplate
    .findUnique({ where: { id: TEMPLATE_ID } })
    .catch(() => {
      logEvent({ event: "feedback_mail_template_load_failed" });
      return null;
    });
  if (stored) {
    try {
      return await renderFeedbackSubmitted(data, stored.html);
    } catch {
      // Not the error itself: it may quote the rendered content.
      logEvent({ event: "feedback_mail_template_fallback" });
    }
  }
  return renderFeedbackSubmitted(data);
};

const mailTemplateService = createService("mailTemplate", async ({ services }) => {
  const db = await getDatabaseService(services);

  return {
    get: () => getFeedbackMailTemplate(db),
    save: (html: string) => saveFeedbackMailTemplate(db, html),
    reset: () => resetFeedbackMailTemplate(db),
    preview: (html: string) => previewFeedbackMailTemplate(html),
    renderFeedbackNotification: (data: FeedbackSubmittedData) =>
      renderFeedbackNotification(db, data),
  };
});

export default mailTemplateService;
