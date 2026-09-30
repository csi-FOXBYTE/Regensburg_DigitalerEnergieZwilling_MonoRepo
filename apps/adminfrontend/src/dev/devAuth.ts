if (import.meta.env.PROD) {
  throw new Error("dev-auth must not be loaded in production");
}

export function getDevToken(): string | null {
  return import.meta.env.VITE_DEV_ACCESS_TOKEN ?? null;
}
