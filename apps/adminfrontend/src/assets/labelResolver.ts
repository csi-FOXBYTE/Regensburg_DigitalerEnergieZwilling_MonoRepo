import type { Selection } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";

export type LocalizableSelection = Pick<Selection, "value" | "localization">;

export function resolveLabel(
  selections: LocalizableSelection[],
  value: string | null | undefined,
  locale = "de",
): string | undefined {
  if (value == null) return undefined;
  return selections.find((s) => s.value === value)?.localization[locale];
}

// BuildingType and RoofInsulationType are bare enums in the package with no Selection[]
export const BUILDING_TYPE_SELECTIONS: LocalizableSelection[] = [
  { value: "singleFamily", localization: { de: "Einfamilienhaus", en: "Single-family house" } },
  { value: "multiFamily", localization: { de: "Mehrfamilienhaus", en: "Multi-family house" } },
];

export const ROOF_INSULATION_SELECTIONS: LocalizableSelection[] = [
  { value: "betweenRafter", localization: { de: "Zwischen den Sparren", en: "Between rafters" } },
  { value: "aboveRafter", localization: { de: "Über den Sparren", en: "Above rafters" } },
];
