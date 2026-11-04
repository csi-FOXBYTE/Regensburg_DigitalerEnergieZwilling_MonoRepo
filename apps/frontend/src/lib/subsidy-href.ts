/**
 * Subsidy links come from the admin-maintained config and are rendered as
 * clickable links on the result page and as /URI actions in the PDF export.
 * Only absolute https URLs are linked, so a config cannot place javascript:,
 * data:, file: or smb: targets in front of citizens. Same rule as the backend
 * check on config creation; this guards configs stored before that check.
 * Returns the link to use, or undefined to render the entry without a link.
 */
export function safeSubsidyHref(href: unknown): string | undefined {
  if (typeof href !== 'string') return undefined;
  if (!/^https:\/\//i.test(href)) return undefined;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(href)) return undefined;
  try {
    return new URL(href).protocol === 'https:' ? href : undefined;
  } catch {
    return undefined;
  }
}
