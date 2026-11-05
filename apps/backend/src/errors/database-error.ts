import { AppError } from "./app-error.js";

// SQLSTATEs raised when a concurrent request changed or removed the same rows:
// serialization failure and deadlock (serializable transactions), unique and
// foreign key violations (a row was created or deleted in between) and a lock
// that could not be acquired.
const conflictCodes = new Set(["40001", "40P01", "23505", "23503", "55P03"]);
// Values PostgreSQL cannot store in a text column, e.g. U+0000.
const unstorableCharacterCodes = new Set(["22021", "22P05"]);

const sqlState = (error: object): string | undefined => {
  // ZenStack wraps driver errors as ORMError("db-query-error") with the
  // driver's code; errors raised outside a query (e.g. on COMMIT) may reach
  // the handler as the raw pg DatabaseError, which carries a severity.
  const code =
    "reason" in error && error.reason === "db-query-error" && "dbErrorCode" in error
      ? error.dbErrorCode
      : "severity" in error && "code" in error
        ? error.code
        : undefined;
  return typeof code === "string" ? code : undefined;
};

// Maps database errors a client can cause, mostly by racing another request,
// to 4xx. Everything else stays an internal error. The response never carries
// the driver message, which may contain SQL or submitted values.
export function toDatabaseAppError(error: unknown): AppError | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  if ("reason" in error && error.reason === "not-found")
    return new AppError({ status: "NOT_FOUND", code: 404, message: "Not found" });

  const code = sqlState(error);
  if (code === undefined) return undefined;
  if (conflictCodes.has(code))
    return new AppError({
      status: "CONFLICT",
      code: 409,
      message: "The resource was changed by a concurrent request, please retry",
    });
  if (unstorableCharacterCodes.has(code))
    return new AppError({
      status: "BAD_REQUEST",
      code: 400,
      message: "Request contains characters that cannot be stored",
    });
  return undefined;
}
