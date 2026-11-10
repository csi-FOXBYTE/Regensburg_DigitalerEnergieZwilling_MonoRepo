import { MailTemplatePage } from "@/features/MailTemplate/MailTemplatePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header/mail-template/")({
  component: MailTemplatePage,
});
