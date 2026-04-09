const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers: optHeaders, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(rest.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...optHeaders,
    },
    ...rest,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as Record<string, unknown> & {
    error?: { code?: string; message?: string };
  };

  if (!response.ok) {
    throw new ApiError(
      (body.error?.code as string | undefined) ?? "UNKNOWN_ERROR",
      (body.error?.message as string | undefined) ?? "Algo deu errado",
      response.status,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: <T>(path: string, data: unknown, token?: string) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  patch: <T>(path: string, data: unknown, token?: string) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  put: <T>(path: string, data: unknown, token?: string) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
