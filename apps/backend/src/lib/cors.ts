// Only the two client apps may call the API cross-origin. @fastify/cors
// reflects every Origin when fastify-toab's default `origin: true` is kept.
export function allowedCorsOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return ["PUBLIC_CLIENT_BASE_URL", "ADMIN_CLIENT_BASE_URL"].map((name) => {
    let url: URL;
    try {
      url = new URL(env[name] ?? "");
    } catch {
      throw new Error(`${name} is missing or invalid`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error(`${name} must use HTTP or HTTPS`);
    return url.origin;
  });
}

type OriginCallback = (error: Error | null, allow: boolean) => void;

// fastify-toab evaluates the config at build time, without the runtime
// environment, so the allowlist is resolved on first use.
export function createCorsOrigin(env: Record<string, string | undefined> = process.env) {
  let origins: string[] | undefined;
  return (origin: string | undefined, callback: OriginCallback) => {
    try {
      origins ??= allowedCorsOrigins(env);
      callback(null, origin !== undefined && origins.includes(origin));
    } catch (error) {
      callback(error as Error, false);
    }
  };
}
