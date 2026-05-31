import { useState, useMemo, useEffect, useCallback } from "react";
import { useListPageSize } from "@/lib/useListPageSize";

/**
 * Page-based list pagination — resets to page 1 when `resetKey` changes.
 * Page size comes from Settings unless `pageSize` is passed explicitly.
 */
export function usePagination<T>(
  items: T[],
  pageSize?: number,
  resetKey = "",
) {
  const settingsPageSize = useListPageSize();
  const size = pageSize ?? settingsPageSize;
  const [page, setPageState] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);

  useEffect(() => {
    setPageState(1);
  }, [size, resetKey]);

  useEffect(() => {
    if (page > totalPages) setPageState(totalPages);
  }, [page, totalPages]);

  const visible = useMemo(() => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  }, [items, page, size]);

  const setPage = useCallback(
    (p: number) => setPageState(Math.min(totalPages, Math.max(1, p))),
    [totalPages],
  );

  const goPrev = useCallback(() => setPage(page - 1), [page, setPage]);
  const goNext = useCallback(() => setPage(page + 1), [page, setPage]);

  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);

  return {
    visible,
    page,
    totalPages,
    total,
    pageSize: size,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    goPrev,
    goNext,
    setPage,
    showingLabel: total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`,
    pageLabel: total === 0 ? "" : `Page ${page} of ${totalPages}`,
  };
}
