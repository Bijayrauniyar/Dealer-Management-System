import Papa from "papaparse";
import type { CsvRow } from "./types";

const UTF8_BOM = "\uFEFF";

export function rowsToCsv(rows: CsvRow[], columns: string[]): string {
  const data = rows.map((row) =>
    columns.map((col) => {
      const v = row[col];
      if (v === null || v === undefined) return "";
      return v;
    }),
  );
  return Papa.unparse({ fields: columns, data }, { newline: "\r\n" });
}

export function downloadCsv(filename: string, rows: CsvRow[], columns: string[]): void {
  const body = UTF8_BOM + rowsToCsv(rows, columns);
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
