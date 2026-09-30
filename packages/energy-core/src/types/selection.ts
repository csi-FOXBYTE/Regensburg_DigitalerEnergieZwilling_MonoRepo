import { z } from "zod";

export const SelectionSchema = z.object({
  value: z.string(),
  localization: z.record(z.string()),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const selectionFilter = <K extends z.ZodTypeAny, V extends z.ZodTypeAny>(k: K, v: V) =>
  z.array(z.object({ key: k, allowedValues: z.array(v) }));

export type SelectionFilter<K = string, V = string> = Array<{
  key: K;
  allowedValues: V[];
}>;
