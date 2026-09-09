import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type { ApiErrorResponse, ApiSuccessResponse, ApiSuccessPaginatedResponse, Pagination } from '@/types';

/**
 * The single axios instance every service module must use.
 *
 * `baseURL: '/api'` relies on frontend and backend being the SAME
 * Next.js origin (see docs/FRONTEND_INTEGRATION.md) — never point this at
 * an absolute URL or `NEXT_PUBLIC_API_URL`. The browser's session cookie
 * is attached automatically because this is a same-origin request.
 */
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Normalized client-side error — every service function throws this, never a raw AxiosError. */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (body && body.success === false) {
      return Promise.reject(new ApiClientError(body.error.code, body.error.message, status));
    }

    // No parsed error body — network failure, server down, etc. Never
    // surface the raw axios/network message to the UI.
    return Promise.reject(
      new ApiClientError(
        'NETWORK_ERROR',
        'Unable to reach the server. Check your connection and try again.',
        status
      )
    );
  }
);

/** Unwraps `{ success: true, data }` down to just `data`. */
export function unwrap<T>(response: AxiosResponse<ApiSuccessResponse<T>>): T {
  return response.data.data;
}

/** Unwraps a paginated envelope down to `{ data, pagination }`. */
export function unwrapPaginated<T>(
  response: AxiosResponse<ApiSuccessPaginatedResponse<T>>
): { data: T[]; pagination: Pagination } {
  return { data: response.data.data, pagination: response.data.pagination };
}
