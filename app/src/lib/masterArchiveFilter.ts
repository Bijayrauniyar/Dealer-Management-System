export type ArchiveFilter = "active" | "archived" | "all";

export function matchesArchiveFilter(isActive: boolean, filter: ArchiveFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return isActive;
  return !isActive;
}

export function archiveFilterOptions(counts: {
  active: number;
  archived: number;
  all: number;
}): { value: ArchiveFilter; label: string }[] {
  return [
    { value: "active", label: `Active (${counts.active})` },
    { value: "archived", label: `Archived (${counts.archived})` },
    { value: "all", label: `All (${counts.all})` },
  ];
}
