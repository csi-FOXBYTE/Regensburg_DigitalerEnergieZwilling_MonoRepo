import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nodemailer from "nodemailer";
import {
  compileFeedbackTemplate,
  getDefaultFeedbackTemplateSource,
  InvalidMailTemplateError,
  MAX_FEEDBACK_TEMPLATE_LENGTH,
  renderFeedbackSubmitted,
} from "./mail.templates.js";

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

describe("custom feedback mail templates", () => {
  const rejects = (source: string, pattern: RegExp) =>
    assert.throws(
      () => compileFeedbackTemplate(source),
      (error: unknown) => error instanceof InvalidMailTemplateError && pattern.test(error.message),
    );

  it("accepts the bundled default", async () => {
    assert.doesNotThrow(() => compileFeedbackTemplate("<p>{{message}}</p>"));
    const source = await getDefaultFeedbackTemplateSource();
    assert.doesNotThrow(() => compileFeedbackTemplate(source));
  });

  it("renders a custom template and still escapes submitted content", async () => {
    const message = '<script>alert(1)</script>';
    const { html, text } = await renderFeedbackSubmitted(
      { ...feedback, message },
      "<h1>{{category}}</h1>{{#if emailAddress}}<a>{{emailAddress}}</a>{{/if}}<div>{{message}}</div>",
    );
    assert.equal(html, "<h1>Fehlermeldung</h1><div>&lt;script&gt;alert(1)&lt;/script&gt;</div>");
    // The plain-text part does not depend on the template.
    assert.ok(text.includes(message));
  });

  it("rejects unescaped output so submitted content cannot inject markup", () => {
    rejects("<div>{{{message}}}</div>", /Unescaped output .*line 1/);
    rejects("<div>\n{{& message}}</div>", /Unescaped output/);
    rejects("{{#if message}}\n\n{{{message}}}{{/if}}", /line 3/);
  });

  it("rejects partials, decorators and unknown helpers", () => {
    rejects("{{> header}}", /Partials/);
    rejects("{{#> layout}}x{{/layout}}", /Partials/);
    rejects("{{* decorator}}", /Decorators/);
    rejects("{{formatDate createdAt}}", /unknown helper formatDate/);
  });

  it("reports syntax errors with their line", () => {
    rejects("<p>\n{{#if message}}</p>", /line 2|Parse error/);
    rejects("<p>{{message</p>", /Parse error|Expecting/);
  });

  it("rejects empty and over-long templates", () => {
    rejects("   ", /must not be empty/);
    rejects("x".repeat(MAX_FEEDBACK_TEMPLATE_LENGTH + 1), /must not exceed/);
  });
});
