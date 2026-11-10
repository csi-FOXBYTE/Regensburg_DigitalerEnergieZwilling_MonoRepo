import { Static, Type } from "@sinclair/typebox";
import { MAX_FEEDBACK_TEMPLATE_LENGTH } from "../mail/mail.templates.js";

export const FeedbackMailTemplateInputDto = Type.Object({
  html: Type.String({ minLength: 1, maxLength: MAX_FEEDBACK_TEMPLATE_LENGTH }),
}, { additionalProperties: false });
export type FeedbackMailTemplateInput = Static<typeof FeedbackMailTemplateInputDto>;

export const FeedbackMailTemplateOutputDto = Type.Object({
  // The template in effect: the stored one, or the default when none is stored.
  html: Type.String(),
  isDefault: Type.Boolean(),
  updatedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  // The bundled default, so the admin area can offer it as a starting point.
  defaultHtml: Type.String(),
});

export const FeedbackMailTemplatePreviewOutputDto = Type.Object({
  html: Type.String(),
});
