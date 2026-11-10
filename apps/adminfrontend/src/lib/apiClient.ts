export type ApiError = Error & { status: number; detail?: string };

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && "status" in error;
}

let _baseUrl = "";
let _getToken: (() => string | null) | null = null;

export function setApiBaseUrl(url: string) {
  _baseUrl = url;
}

export function setApiAuthProvider(fn: (() => string | null) | null) {
  _getToken = fn;
}

export const apiClient = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  const token = _getToken?.();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${_baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
    error.status = response.status;
    // The backend's AppError body carries a message, e.g. why a mail template
    // was rejected. Missing or non-JSON bodies leave it undefined.
    const body: unknown = await response.json().catch(() => undefined);
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string")
      error.detail = body.message;
    throw error;
  }

  if ([204, 205, 304].includes(response.status)) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};
