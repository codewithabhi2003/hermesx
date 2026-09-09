'use client';

import { useState, useCallback } from 'react';
import type { Pagination } from '@/types';

export interface UsePaginationResult {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: (pagination?: Pagination) => boolean;
  canGoPrev: boolean;
  reset: () => void;
}

export function usePagination(initialLimit = 20): UsePaginationResult {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => setPage(1), []);

  const canGoNext = useCallback(
    (pagination?: Pagination) => (pagination ? page < pagination.totalPages : false),
    [page]
  );

  return {
    page,
    limit,
    setPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev: page > 1,
    reset,
  };
}
