/**
 * Standardized application error taxonomy.
 *
 * Every server module that needs to fail a request should throw an
 * `AppError` (or a subclass) rather than a raw `Error`. The route-handler
 * layer (`lib/responses.ts` -> `handleRouteError`) knows how to translate
 * these into the frozen API response envelope without ever leaking
 * Prisma internals, provider errors, or stack traces to the client.
 */

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_ERROR: 'AI_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCodeType, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  AI_ERROR: 502,
  DATABASE_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly status: number;
  /** Optional extra detail safe to send to the client (e.g. field errors). */
  public readonly details?: unknown;

  constructor(code: ErrorCodeType, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The request payload is invalid.', details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(ErrorCode.UNAUTHORIZED, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(ErrorCode.FORBIDDEN, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(ErrorCode.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with existing data.') {
    super(ErrorCode.CONFLICT, message);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again shortly.') {
    super(ErrorCode.RATE_LIMITED, message);
    this.name = 'RateLimitedError';
  }
}

export class AIError extends AppError {
  constructor(message = 'The AI provider could not complete this request.') {
    super(ErrorCode.AI_ERROR, message);
    this.name = 'AIError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred.') {
    super(ErrorCode.DATABASE_ERROR, message);
    this.name = 'DatabaseError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred.') {
    super(ErrorCode.INTERNAL_ERROR, message);
    this.name = 'InternalError';
  }
}
