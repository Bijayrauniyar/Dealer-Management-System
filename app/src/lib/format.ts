export const npr = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export const toDateInput = (d = new Date()) => d.toISOString().slice(0, 10);
