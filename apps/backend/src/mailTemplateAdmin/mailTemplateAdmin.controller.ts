import { createController } from "../toab/index.js";
import { getMailTemplateService } from "../@internals/index.js";
import { requirePermission } from "../config/config.middleware.js";
import { AppError } from "../errors/app-error.js";
import { InvalidMailTemplateError } from "../mail/mail.templates.js";
import {
  FeedbackMailTemplateInputDto,
  FeedbackMailTemplateOutputDto,
  FeedbackMailTemplatePreviewOutputDto,
} from "../mailTemplate/mailTemplate.dto.js";

const mailTemplateAdminController = createController().rootPath(
  "/api/admin/mail-templates/feedback",
);

const serializeTemplate = (template: {
  html: string;
  isDefault: boolean;
  updatedAt: Date | null;
  defaultHtml: string;
}) => ({
  ...template,
  updatedAt: template.updatedAt?.toISOString() ?? null,
});

// The message is technical (Handlebars parser output plus line number); the
// admin area shows it below a plain-language explanation.
const translateTemplateError = (error: unknown) => {
  if (error instanceof InvalidMailTemplateError)
    throw new AppError({
      status: "BAD_REQUEST",
      code: 400,
      message: error.message,
    });
};

mailTemplateAdminController
  .addRoute("GET", "/")
  .use(requirePermission("mailTemplate:read"))
  .output(FeedbackMailTemplateOutputDto)
  .handler(async ({ services }) => {
    const mailTemplateService = await getMailTemplateService(services);
    return serializeTemplate(await mailTemplateService.get());
  });

mailTemplateAdminController
  .addRoute("PUT", "/")
  .use(requirePermission("mailTemplate:update"))
  .body(FeedbackMailTemplateInputDto)
  .output(FeedbackMailTemplateOutputDto)
  .handler(async ({ services, body }) => {
    const mailTemplateService = await getMailTemplateService(services);
    try {
      return serializeTemplate(await mailTemplateService.save(body.html));
    } catch (error) {
      translateTemplateError(error);
      throw error;
    }
  });

// Removes the stored template; notifications use the bundled default again.
mailTemplateAdminController
  .addRoute("DELETE", "/")
  .use(requirePermission("mailTemplate:update"))
  .output(FeedbackMailTemplateOutputDto)
  .handler(async ({ services }) => {
    const mailTemplateService = await getMailTemplateService(services);
    return serializeTemplate(await mailTemplateService.reset());
  });

// Renders an unsaved template with example feedback. Requires update
// permission because it exists only to support editing.
mailTemplateAdminController
  .addRoute("POST", "/preview")
  .use(requirePermission("mailTemplate:update"))
  .body(FeedbackMailTemplateInputDto)
  .output(FeedbackMailTemplatePreviewOutputDto)
  .handler(async ({ services, body }) => {
    const mailTemplateService = await getMailTemplateService(services);
    try {
      return { html: await mailTemplateService.preview(body.html) };
    } catch (error) {
      translateTemplateError(error);
      throw error;
    }
  });

export default mailTemplateAdminController;
