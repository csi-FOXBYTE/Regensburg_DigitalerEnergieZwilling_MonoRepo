import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nodemailer from "nodemailer";
import { renderFeedbackSubmitted } from "./mail.templates.js";

const feedback = {
  id: "feedback-1",
  category: "bug" as const,
  message: "Die Karte bleibt leer.\nNach erneutem Laden funktioniert sie.",
  createdAt: new Date("2026-10-19T12:32:00Z"),
};

describe("feedback mail template", () => {
  it("renders German labels, Berlin time and multiline messages in both formats", async () => {
    const { html, text } = await renderFeedbackSubmitted(feedback);
    for (const content of [html, text]) {
      assert.match(content, /Fehlermeldung/);
      assert.match(content, /19\.10\.2026/);
      assert.match(content, /14:32/);
      assert.ok(content.includes(feedback.message));
      assert.ok(content.includes(feedback.id));
      assert.doesNotMatch(content, /Kontakt|mailto:|Matomo-Session-ID/);
    }
    assert.match(html, /white-space: pre-wrap/);
  });

  it("renders optional contact details and omits null contact details", async () => {
    const withEmail = await renderFeedbackSubmitted({ ...feedback, emailAddress: "anna@example.de" });
    assert.match(withEmail.html, /href="mailto:anna@example.de"/);
    assert.match(withEmail.text, /Kontakt: anna@example.de/);
    const withoutEmail = await renderFeedbackSubmitted({ ...feedback, emailAddress: null });
    assert.doesNotMatch(withoutEmail.html, /Kontakt|mailto:/);
  });

  it("escapes submitted HTML and does not evaluate template syntax inside data", async () => {
    const message = '<img src=x onerror="alert(1)"> & {{id}}';
    const { html, text } = await renderFeedbackSubmitted({ ...feedback, message });
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;img src&#x3D;x onerror&#x3D;&quot;alert\(1\)&quot;&gt; &amp; \{\{id\}\}/);
    assert.ok(text.includes(message));
  });

  it("produces HTML and plain-text MIME alternatives through Nodemailer", async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const content = await renderFeedbackSubmitted(feedback);
    const result = await transport.sendMail({
      from: "noreply@example.invalid",
      to: "feedback@example.invalid",
      subject: "Neues Feedback eingegangen",
      ...content,
    });
    const message = result.message.toString();
    assert.match(message, /Content-Type: multipart\/alternative/);
    assert.match(message, /Content-Type: text\/plain/);
    assert.match(message, /Content-Type: text\/html/);
  });
});
