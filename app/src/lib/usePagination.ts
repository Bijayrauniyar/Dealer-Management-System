import { useState, useMemo } from "react";

/**
 * Simple "show more" pagination hook.
 * Returns the slice of items to show plus a `loadMore` action and
 * whether there are more items to load.
 *
 * When the underlying `items` array changes (e.g. a filter is applied)
 * the page is automatically reset to `pageSize`.
 */
export function usePagination<T>(items: T[], pageSize = 15) {
  const [limit, setLimit] = useState(pageSize);

  // Reset to first page when items list changes length (filter applied)
  const capped = useMemo(() => {
    setLimit(pageSize);           // reset on items change
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, pageSize]);

  const visible  = useMemo(() => capped.slice(0, limit), [capped, limit]);
  const hasMore  = limit < items.length;
  const loadMore = () => setLimit((l) => l + pageSize);

  return { visible, hasMore, loadMore, total: items.length };
}
