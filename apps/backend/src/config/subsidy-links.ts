// Subsidy links end up as clickable links on the result page and as /URI
// actions in every citizen's PDF export. Only absolute https URLs are allowed,
// so a config cannot point citizens to javascript:, data:, file: or smb:
// targets. An empty link is allowed: the entry is then shown without a link.

export function isAllowedSubsidyHref(href: string): boolean {
  if (!/^https:\/\//i.test(href)) return false;
  // Whitespace and control characters are stripped or normalised differently by
  // browsers and PDF viewers; keep the stored value identical to what is opened.
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(href)) return false;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Checks the links of a subsidies payload as the config API stores it: one
 * string holding the whole JSON array, or one JSON string per entry (older
 * admin versions). Returns one message per problem; empty when all is fine.
 */
export function findSubsidyLinkIssues(subsidies: readonly string[]): string[] {
  const issues: string[] = [];
  subsidies.forEach((item, itemIndex) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(item);
    } catch {
      issues.push(`subsidies[${itemIndex}]: not valid JSON`);
      return;
    }
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    entries.forEach((entry: unknown, entryIndex) => {
      const path = Array.isArray(parsed)
        ? `subsidies[${itemIndex}][${entryIndex}]`
        : `subsidies[${itemIndex}]`;
      if (typeof entry !== "object" || entry === null) {
        issues.push(`${path}: must be an object`);
        return;
      }
      const subsidy = (entry as { subsidy?: unknown }).subsidy;
      if (typeof subsidy !== "object" || subsidy === null) return;
      const href = (subsidy as { href?: unknown }).href;
      if (href === undefined || href === "") return;
      if (typeof href !== "string" || !isAllowedSubsidyHref(href)) {
        issues.push(`${path}.subsidy.href: only absolute https:// links are allowed`);
      }
    });
  });
  return issues;
}
