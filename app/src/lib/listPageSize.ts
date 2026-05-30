/** Allowed rows-per-page values (Settings + tenant_settings.list_page_size). */
export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type ListPageSizeOption = (typeof LIST_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_LIST_PAGE_SIZE: ListPageSizeOption = 10;

/** @deprecated Use DEFAULT_LIST_PAGE_SIZE or useListPageSize() */
export const LIST_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

export function parseListPageSize(raw: unknown): ListPageSizeOption {
  const n = Number(raw);
  if (LIST_PAGE_SIZE_OPTIONS.includes(n as ListPageSizeOption)) {
    return n as ListPageSizeOption;
  }
  return DEFAULT_LIST_PAGE_SIZE;
}
