// Helpers for the mail template editor: placeholder insertion and an HTML
// structure check that reports what browsers silently repair (mail clients
// may repair it differently or not at all).

/** Inserts a placeholder at the selection, replacing selected text. */
export function insertPlaceholder(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  token: string,
): { text: string; cursor: number } {
  return {
    text: text.slice(0, selectionStart) + token + text.slice(selectionEnd),
    cursor: selectionStart + token.length,
  };
}

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
]);

// Elements whose content is not markup.
const RAW_TEXT_ELEMENTS = new Set(["style", "script", "title", "textarea"]);

const KNOWN_ELEMENTS = new Set([
  ...VOID_ELEMENTS, ...RAW_TEXT_ELEMENTS,
  "a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo",
  "blockquote", "body", "button", "canvas", "caption", "center", "cite", "code",
  "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div",
  "dl", "dt", "em", "fieldset", "figcaption", "figure", "font", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i",
  "iframe", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "menu",
  "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p",
  "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section",
  "select", "slot", "small", "span", "strike", "strong", "sub", "summary", "sup",
  "svg", "table", "tbody", "td", "template", "tfoot", "th", "thead", "time", "tr",
  "tt", "u", "ul", "var", "video",
]);

export type HtmlIssue = { line: number; message: string };

// Replaces a match with spaces but keeps line breaks, so offsets and line
// numbers of everything else stay the same.
const blank = (match: string) => match.replace(/[^\n]/g, " ");
// Output placeholders such as {{message}} become text in the mail, so they
// are kept as text: a placeholder between table rows is as wrong as words.
const asText = (match: string) => match.replace(/[^\n]/g, "x");

// Elements in which only other table parts may appear, not text. Browsers
// move such text in front of the table.
const TABLE_STRUCTURE = new Set(["table", "thead", "tbody", "tfoot", "tr"]);

// Same length and line breaks as the source, so offsets carry over.
function maskTemplate(source: string) {
  return source
    // Comments and block syntax ({{#if}}, {{/if}}, {{else}}) render nothing.
    .replace(/\{\{!--[\s\S]*?--\}\}|\{\{!?[\s\S]*?\}\}/g, (match) =>
      /^\{\{(!|~?\s*[#/^]|~?\s*else\b)/.test(match) ? blank(match) : asText(match),
    )
    .replace(/<!--[\s\S]*?-->/g, blank);
}

/**
 * Reports unclosed, mismatched, stray and unknown tags, and text placed
 * between table rows, with their line. Handlebars comments and block syntax
 * are ignored; output placeholders count as text. Because {{#if}}
 * branches are not evaluated, markup opened in one branch and closed in
 * another can be reported although it renders fine; callers treat the
 * result as warnings.
 */
export function findHtmlIssues(source: string): HtmlIssue[] {
  const masked = maskTemplate(source);

  const lineStarts = [0];
  for (let i = 0; i < masked.length; i++) if (masked[i] === "\n") lineStarts.push(i + 1);
  const lineOf = (offset: number) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((lineStarts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  };

  const issues: HtmlIssue[] = [];
  const open: { name: string; line: number }[] = [];
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'"<>])*?)(\/?)>|<([a-zA-Z/][^<>]*)(?=<|$)/g;

  let textStart = 0;
  const checkText = (end: number) => {
    const parent = open.at(-1)?.name;
    const offset = masked.slice(textStart, end).search(/\S/);
    if (parent && TABLE_STRUCTURE.has(parent) && offset !== -1)
      issues.push({
        line: lineOf(textStart + offset),
        message: `Text oder Platzhalter direkt in <${parent}> steht außerhalb einer Zelle (<td>). Browser zeigen ihn vor der Tabelle an.`,
      });
  };

  let match: RegExpExecArray | null;
  while ((match = tag.exec(masked))) {
    checkText(match.index);
    textStart = tag.lastIndex;
    const line = lineOf(match.index);
    if (match[5] !== undefined) {
      issues.push({ line, message: `Tag ohne schließendes „>“: <${match[5].trim().slice(0, 30)}` });
      continue;
    }

    const [, closing, rawName, , selfClosing] = match;
    const name = (rawName ?? "").toLowerCase();
    if (!KNOWN_ELEMENTS.has(name) && !name.includes("-"))
      issues.push({ line, message: `Unbekanntes Element <${name}>, vielleicht ein Tippfehler?` });

    if (closing) {
      if (VOID_ELEMENTS.has(name)) {
        issues.push({ line, message: `</${name}> ist überflüssig, <${name}> hat kein schließendes Tag.` });
        continue;
      }
      const index = open.map((entry) => entry.name).lastIndexOf(name);
      if (index === -1) {
        issues.push({ line, message: `</${name}> schließt nichts, es fehlt ein passendes <${name}>.` });
        continue;
      }
      for (const unclosed of open.splice(index).slice(1).reverse())
        issues.push({
          line: unclosed.line,
          message: `<${unclosed.name}> wird nicht geschlossen, bevor </${name}> in Zeile ${line} folgt.`,
        });
      continue;
    }

    if (VOID_ELEMENTS.has(name)) continue;
    if (selfClosing) {
      issues.push({ line, message: `<${name} /> schließt in HTML nicht, bitte <${name}></${name}> schreiben.` });
      continue;
    }
    if (RAW_TEXT_ELEMENTS.has(name)) {
      const end = masked.toLowerCase().indexOf(`</${name}`, tag.lastIndex);
      if (end === -1) {
        issues.push({ line, message: `<${name}> wird nie geschlossen.` });
        break;
      }
      tag.lastIndex = end;
      textStart = end;
    }
    open.push({ name, line });
  }

  for (const unclosed of open)
    issues.push({ line: unclosed.line, message: `<${unclosed.name}> wird nie geschlossen.` });

  return issues.sort((a, b) => a.line - b.line);
}
