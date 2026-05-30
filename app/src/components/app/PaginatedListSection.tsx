import type { ReactNode } from "react";
import { ListPagination } from "@/components/app/ListPagination";
import { usePagination } from "@/lib/usePagination";

type Props<T> = {
  items: T[];
  resetKey?: string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  /** Render pagination below items (default true when more than one page). */
  showPager?: boolean;
};

/** Slice `items` by Settings “rows per page” and render prev/next controls. */
export function PaginatedListSection<T>({
  items,
  resetKey = "",
  renderItem,
  empty,
  showPager = true,
}: Props<T>) {
  const page = usePagination(items, undefined, resetKey);

  if (items.length === 0) {
    return empty ?? null;
  }

  return (
    <>
      {page.visible.map(renderItem)}
      {showPager ? (
        <ListPagination
          page={page.page}
          totalPages={page.totalPages}
          total={page.total}
          hasPrev={page.hasPrev}
          hasNext={page.hasNext}
          onPrev={page.goPrev}
          onNext={page.goNext}
          showingLabel={page.showingLabel}
        />
      ) : null}
    </>
  );
}
