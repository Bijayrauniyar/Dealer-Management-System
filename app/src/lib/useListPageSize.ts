import { useMemo } from "react";
import { parseListPageSize, type ListPageSizeOption } from "@/lib/listPageSize";
import { useBusinessSettings } from "@/store/domain";

/** Tenant setting: rows per page on all browse lists. */
export function useListPageSize(): ListPageSizeOption {
  const business = useBusinessSettings();
  return useMemo(() => parseListPageSize(business.listPageSize), [business.listPageSize]);
}
