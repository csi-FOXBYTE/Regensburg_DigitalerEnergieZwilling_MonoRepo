export type YearBand = { from?: number; to?: number };

export type BandEntry = { from?: number; to?: number; value: number };

export const getValueForBand = (
  values: BandEntry[],
  band: YearBand,
): number | undefined => {
  const bf = band.from ?? -Infinity;
  const bt = band.to ?? Infinity;
  return values.find(
    (e) => (e.from ?? -Infinity) <= bf && (e.to ?? Infinity) >= bt,
  )?.value;
};

export const sortBands = <T extends YearBand>(bands: T[]): T[] =>
  [...bands].sort((a, b) => (a.from ?? -Infinity) - (b.from ?? -Infinity));

export const formatBand = (band: YearBand): string => {
  if (band.from != null && band.to != null) return `${band.from}–${band.to}`;
  if (band.to != null) return `≤ ${band.to}`;
  if (band.from != null) return `ab ${band.from}`;
  return "alle";
};
