import { getAuthToken } from "./auth-storage";

interface ApiErrorBody {
  message?: string;
  code?: string;
  issues?: unknown;
}

interface ApiRequestOptions
  extends RequestInit {
  authenticated?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_URL = (
  import.meta.env.VITE_API_URL ??
  "/api"
).replace(/\/$/, "");

async function parseResponse(
  response: Response,
): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    ...requestOptions
  } = options;

  const headers = new Headers(
    requestOptions.headers,
  );

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (authenticated) {
    const token = getAuthToken();

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`,
      );
    }
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...requestOptions,
      headers,
    },
  );

  const responseBody =
    await parseResponse(response);

  if (!response.ok) {
    const errorBody =
      typeof responseBody === "object" &&
      responseBody !== null
        ? responseBody as ApiErrorBody
        : {};

    throw new ApiError(
      errorBody.message ??
        "Não foi possível concluir a solicitação.",

      response.status,
      errorBody.code,
      errorBody.issues,
    );
  }

  return responseBody as T;
}