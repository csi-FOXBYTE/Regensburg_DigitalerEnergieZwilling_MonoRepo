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
