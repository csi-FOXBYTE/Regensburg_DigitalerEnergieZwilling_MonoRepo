import type { ZodError } from "zod";

export type ValidationIssue = { path: string; message: string };

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

function valueAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let value = input;
  for (const key of path) {
    if (typeof value !== "object" || value === null) return undefined;
    value = Reflect.get(value, key);
  }
  return value;
}

/**
 * Maps zod issues to validation issues. A missing value is reported as
 * "Required" under zod 3 and 4 alike (zod 4 words it as a type mismatch), and
 * the config migrators match on that message.
 */
export function mapZodError(error: ZodError, input: unknown): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message:
      issue.code === "invalid_type" && valueAt(input, issue.path) === undefined
        ? "Required"
        : issue.message,
  }));
}
