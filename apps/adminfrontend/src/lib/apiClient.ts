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
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  if ([204, 205, 304].includes(response.status)) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};
