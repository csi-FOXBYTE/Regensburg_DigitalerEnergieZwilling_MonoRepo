import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { findHtmlIssues, insertPlaceholder } from "../src/lib/mailTemplateEditing.ts";

describe("placeholder insertion", () => {
  it("inserts single-line placeholders at the selection", () => {
    assert.deepEqual(insertPlaceholder("<p></p>", 3, 3, "{{message}}"), {
      text: "<p>{{message}}</p>",
      cursor: 14,
    });
    // Replaces selected text.
    assert.deepEqual(insertPlaceholder("<p>alt</p>", 3, 6, "{{id}}"), {
      text: "<p>{{id}}</p>",
      cursor: 9,
    });
  });
});

describe("HTML structure check", () => {
  const messages = (source: string) => findHtmlIssues(source).map((issue) => `${issue.line}: ${issue.message}`);

  it("accepts the bundled default template", () => {
    const source = readFileSync(
      new URL("../../backend/src/templates/feedback_submitted.hbs", import.meta.url),
      "utf8",
    );
    assert.deepEqual(findHtmlIssues(source), []);
  });

  it("accepts void elements, comments and Handlebars inside tags", () => {
    assert.deepEqual(
      findHtmlIssues('<!-- <div> --><p class="{{category}}">a<br>b<img src="x.png" /></p>{{!-- </p> --}}'),
      [],
    );
  });

  it("reports unclosed elements", () => {
    assert.deepEqual(messages("<table>\n<tr>\n<td>x</td>\n</table>"), [
      "2: <tr> wird nicht geschlossen, bevor </table> in Zeile 4 folgt.",
    ]);
    assert.deepEqual(messages("<div>\n<p>x</p>"), ["1: <div> wird nie geschlossen."]);
  });

  it("reports stray closing tags and superfluous void closing tags", () => {
    assert.deepEqual(messages("<p>x</p>\n</div>"), [
      "2: </div> schließt nichts, es fehlt ein passendes <div>.",
    ]);
    assert.deepEqual(messages("<br></br>"), [
      "1: </br> ist überflüssig, <br> hat kein schließendes Tag.",
    ]);
  });

  it("reports typos, self-closed non-void elements and missing >", () => {
    assert.match(messages("<tabel></tabel>")[0], /Unbekanntes Element <tabel>/);
    assert.match(messages("<div />")[0], /<div \/> schließt in HTML nicht/);
    assert.match(messages("<p>x</p\n<p>y</p>").join(), /ohne schließendes „>“/);
  });

  it("reports placeholders and text between table rows, which browsers move out", () => {
    assert.deepEqual(
      messages("<table>\n<tr>\n{{createdAt}}{{message}}\n<td>{{message}}</td>\n</tr>\n</table>"),
      ["3: Text oder Platzhalter direkt in <tr> steht außerhalb einer Zelle (<td>). Browser zeigen ihn vor der Tabelle an."],
    );
    assert.match(messages("<table>Hallo<tr><td>x</td></tr></table>")[0] ?? "", /direkt in <table>/);
    // Block syntax renders nothing and may sit between rows.
    assert.deepEqual(findHtmlIssues("<table>{{#if id}}<tr><td>{{id}}</td></tr>{{/if}}{{!-- x --}}</table>"), []);
  });

  it("does not parse the content of style elements as markup", () => {
    assert.deepEqual(findHtmlIssues("<style>a > b { color: red; } p<div {}</style><p>x</p>"), []);
    assert.deepEqual(messages("<style>p { }"), ["1: <style> wird nie geschlossen."]);
  });
});

