import { z } from "zod";

export type RangeFirst = { to: number };
export type RangeMiddle = { from: number; to: number };
export type RangeLast = { from: number };

export type Ranges = [RangeFirst, ...RangeMiddle[], RangeLast] | [{}];

export type RangeBands<T> =
  | [
      RangeFirst & { value: T },
      ...(RangeMiddle & { value: T })[],
      RangeLast & { value: T },
    ]
  | [{ value: T }];

export type YearBands<T> = RangeBands<T>;

export const RangeKeySchema = z.object({
  from: z.number().optional(),
  to: z.number().optional(),
});
export type RangeKey = z.infer<typeof RangeKeySchema>;

export const YearInputSchema = z.union([z.number().int(), RangeKeySchema]);

// ── Schema factories ──────────────────────────────────────────────────────────

function checkPositions(bands: object[], ctx: z.RefinementCtx): void {
  if (bands.length < 2) return;

  const first = bands[0]!;
  if (!("to" in first) || "from" in first)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [0], message: "First band must have only `to`" });

  const last = bands[bands.length - 1]!;
  if (!("from" in last) || "to" in last)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [bands.length - 1], message: "Last band must have only `from`" });

  for (let i = 1; i < bands.length - 1; i++) {
    const mid = bands[i]!;
    if (!("from" in mid) || !("to" in mid))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i], message: "Middle band must have both `from` and `to`" });
  }
}

const rangeBandItem = <T extends z.ZodTypeAny>(value: T) =>
  z.union([
    z.object({ from: z.number(), to: z.number(), value }),
    z.object({ from: z.number(), value }),
    z.object({ to: z.number(), value }),
    z.object({ value }),
  ]);

export const rangeBands = <T extends z.ZodTypeAny>(value: T) =>
  z.array(rangeBandItem(value))
    .superRefine((bands, ctx) => checkPositions(bands as object[], ctx))
    .transform((data) => data as RangeBands<z.infer<T>>);

export const yearBands = rangeBands;

const rangesItem = z.union([
  z.object({ from: z.number(), to: z.number() }),
  z.object({ from: z.number() }),
  z.object({ to: z.number() }),
  z.object({}),
]);

export const RangesSchema = z.array(rangesItem)
  .superRefine((bands, ctx) => checkPositions(bands as object[], ctx))
  .transform((data) => data as Ranges);

// ── Runtime helpers ───────────────────────────────────────────────────────────

export function resolveRangeBand<T>(
  bands: RangeBands<T>,
  key: number | RangeKey,
): T | undefined {
  if (typeof key === "number") {
    const [fallback, ...rest] = bands;
    let result = fallback.value;
    for (const entry of rest) {
      if (entry.from > key) break;
      result = entry.value;
    }
    return result;
  }

  const rangeFrom = key.from ?? -Infinity;
  const rangeTo = key.to ?? Infinity;
  for (const band of bands) {
    const bandFrom =
      "from" in band ? (band as { from: number }).from : -Infinity;
    const bandTo = "to" in band ? (band as { to: number }).to : Infinity;
    if (bandFrom <= rangeFrom && bandTo >= rangeTo) return band.value;
  }
  return undefined;
}

export const resolveYearBand = resolveRangeBand;
