import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationState = useMemo<PaginationState>(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }, [currentPage, totalItems, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalItems, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationState.hasNext]);

  const previousPage = useCallback(() => {
    if (paginationState.hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationState.hasPrevious]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    ...paginationState,
    goToPage,
    nextPage,
    previousPage,
    reset,
  };
}