import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * The ENTIRE application must respond through these helpers so that every
 * route — regardless of who implements it — returns the exact frozen
 * envelope shape described in the API contract.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { success: true, data },
    { status: init?.status ?? 200 }
  );
}

export function okPaginated<T>(data: T[], pagination: Pagination) {
  return NextResponse.json(
    { success: true, data, pagination },
    { status: 200 }
  );
}

export function fail(code: keyof typeof ErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Catch-all error translator for Route Handlers.
 *
 * Usage:
 *
 * ```ts
 * export async function GET(req: NextRequest) {
 *   try {
 *     ...
 *   } catch (error) {
 *     return handleRouteError(error);
 *   }
 * }
 * ```
 *
 * This is the single choke point that guarantees we never leak a Prisma
 * error, a provider error, a stack trace, or any secret back to the client.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    // Expected, well-typed errors — safe to relay their message.
    if (error.status >= 500) {
      logger.error(error.message, { code: error.code });
    }
    return fail(error.code, error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return fail(
      'VALIDATION_ERROR',
      'The request payload is invalid.',
      400,
      error.flatten()
    );
  }

  // Prisma errors carry a `code` like "P2002" — never forward them raw.
  if (isPrismaLikeError(error)) {
    logger.error('Database error', { prismaCode: (error as { code?: string }).code });
    return fail('DATABASE_ERROR', 'A database error occurred.', 500);
  }

  logger.error('Unhandled error', {
    message: error instanceof Error ? error.message : String(error),
  });

  return fail('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
}

function isPrismaLikeError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    /^P\d{4}$/.test((error as { code: string }).code)
  );
}
