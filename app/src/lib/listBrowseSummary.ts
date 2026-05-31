/** Footer text under filters: total matches + current page slice. */
export function browseListSummary(total: number, showingLabel: string): string {
  if (total === 0) return "";
  return `${total} matching · ${showingLabel}`;
}
