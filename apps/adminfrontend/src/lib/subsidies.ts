// The config API stores subsidies as `string[]`. The backend default and the
// public frontend use one element that holds the whole JSON array, so saving
// writes that shape. Older admin versions saved one JSON string per entry;
// reading accepts both so configs saved that way still load.

export function serializeSubsidies<T>(subsidies: T[]): string[] {
  return [JSON.stringify(subsidies)];
}

export function parseSubsidies<T>(value: readonly string[]): T[] {
  return value.flatMap((item) => {
    const parsed = JSON.parse(item) as T | T[];
    return Array.isArray(parsed) ? parsed : [parsed];
  });
}

// Subsidy links become clickable links on the citizen result page and /URI
// actions in the PDF export. Only absolute https URLs are allowed (the backend
// rejects configs with other links); an empty link means "no link".
export function isAllowedSubsidyHref(href: string): boolean {
  if (!/^https:\/\//i.test(href)) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(href)) return false;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}
