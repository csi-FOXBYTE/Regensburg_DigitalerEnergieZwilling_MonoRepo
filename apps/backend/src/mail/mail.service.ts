import { createService } from "@csi-foxbyte/fastify-toab";
import nodemailer from "nodemailer";

export type MailMessage = {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

const mailService = createService("mail", async () => {
  const smtpUrl = process.env.SMTP_URL;

  if (!smtpUrl) {
    return {
      isConfigured: false,
      send: async (_message: MailMessage): Promise<void> => {
        throw new Error("SMTP_URL is not configured");
      },
    };
  }

  let url: URL;
  try {
    url = new URL(smtpUrl);
  } catch {
    throw new Error("SMTP_URL must be a valid SMTP URL");
  }
  if (!(["smtp:", "smtps:"].includes(url.protocol) && url.hostname))
    throw new Error("SMTP_URL must use smtp:// or smtps:// and include a host");

  const transport = nodemailer.createTransport({
    url: smtpUrl,
    requireTLS:
      url.protocol === "smtp:" &&
      !(process.env.NODE_ENV === "development" && url.hostname === "mailpit"),
  });

  return {
    isConfigured: true,
    send: async (message: MailMessage): Promise<void> => {
      await transport.sendMail(message);
    },
  };
});

export default mailService;
