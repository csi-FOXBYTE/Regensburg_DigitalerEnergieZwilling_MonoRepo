const toOrigin = (name: string, value: string | undefined): string => {
  let url: URL;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error(`${name} is missing or invalid`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error(`${name} must use HTTP or HTTPS`);
  return url.origin;
};

// Only the two client apps, plus origins an operator lists explicitly in
// AUTH_CORS_ADDITIONAL_ORIGINS, may call the API cross-origin. @fastify/cors
// reflects every Origin when fastify-toab's default `origin: true` is kept.
export function allowedCorsOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const additional = (env.AUTH_CORS_ADDITIONAL_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => toOrigin("AUTH_CORS_ADDITIONAL_ORIGINS", value));
  return [
    toOrigin("PUBLIC_CLIENT_BASE_URL", env.PUBLIC_CLIENT_BASE_URL),
    toOrigin("ADMIN_CLIENT_BASE_URL", env.ADMIN_CLIENT_BASE_URL),
    ...additional,
  ];
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
