import { z } from "zod";

export const keyedValues = <K extends z.ZodTypeAny, V extends z.ZodTypeAny>(k: K, v: V) =>
  z.array(z.object({ key: k, value: v }));

export type KeyedValues<K, T> = { key: K; value: T }[];

export function resolveKeyedValue<K, T>(values: KeyedValues<K, T>, key: K): T {
  const entry = values.find((entry) => entry.key === key);
  if (!entry) {
    const available = values.map((e) => String(e.key)).join(", ");
    throw new Error(`No keyed value found for key "${String(key)}". Available keys: ${available}`);
  }
  return entry.value;
}
