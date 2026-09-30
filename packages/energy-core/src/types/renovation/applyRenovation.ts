import type { DETInput } from "../input";
import type { InputPatch, Renovation } from "./renovation";

function applyPatch(input: DETInput, patch: InputPatch): DETInput {
  const result = { ...input };
  for (const key of Object.keys(patch) as (keyof DETInput)[]) {
    // @ts-expect-error ts can't prove objects match
    result[key] = { ...input[key], ...patch[key] } as DETInput[typeof key];
  }
  return result;
}

export function applyRenovation(
  input: DETInput,
  renovation: Renovation | Renovation[],
): DETInput {
  const renovations = Array.isArray(renovation) ? renovation : [renovation];
  return renovations.reduce(
    (current, { patch }) => applyPatch(current, patch),
    input,
  );
}
