import { z } from "zod";

export type InterpolationPoint = {
  at: number;
  value: number;
};

export type LinearInterpolation = {
  points: [InterpolationPoint, InterpolationPoint, ...InterpolationPoint[]];
};

export type LinearRegression = {
  a: number;
  b: number;
};

export type InterpolatedNumber = number | LinearInterpolation;

const InterpolationPointSchema = z.object({
  at: z.number(),
  value: z.number(),
});

export const LinearInterpolationSchema = z.object({
  points: z
    .array(InterpolationPointSchema)
    .min(2)
    .superRefine((points, ctx) => {
      for (let index = 1; index < points.length; index++) {
        if (points[index]!.at <= points[index - 1]!.at) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "at"],
            message: "Interpolation points must be strictly ascending",
          });
        }
      }
    })
    .transform((points) => points as [InterpolationPoint, InterpolationPoint, ...InterpolationPoint[]]),
});

export const InterpolatedNumberSchema = z.union([z.number(), LinearInterpolationSchema]);

export function resolveInterpolatedNumber(definition: InterpolatedNumber, input: number): number {
  if (typeof definition === "number") return definition;

  const { points } = definition;
  const first = points[0];
  const last = points[points.length - 1]!;

  if (input <= first.at) return first.value;
  if (input >= last.at) return last.value;

  const upperIndex = points.findIndex((point) => point.at >= input);
  const lower = points[upperIndex - 1]!;
  const upper = points[upperIndex]!;
  const ratio = (input - lower.at) / (upper.at - lower.at);

  return lower.value + ratio * (upper.value - lower.value);
}

export function fitLinearRegression(definition: LinearInterpolation): LinearRegression {
  const count = definition.points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;

  for (const point of definition.points) {
    sumX += point.at;
    sumY += point.value;
    sumXX += point.at * point.at;
    sumXY += point.at * point.value;
  }

  const denominator = count * sumXX - sumX * sumX;
  const b = (count * sumXY - sumX * sumY) / denominator;
  const a = (sumY - b * sumX) / count;

  return { a, b };
}
