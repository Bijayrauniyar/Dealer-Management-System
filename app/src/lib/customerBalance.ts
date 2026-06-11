/** Amount customer owes the dealer (receivable). */
export function customerReceivable(outstanding: number): number {
  return outstanding > 0.01 ? outstanding : 0;
}

/** Unapplied advance / credit (customer paid more than billed). */
export function customerAdvanceBalance(outstanding: number): number {
  return outstanding < -0.01 ? Math.round(Math.abs(outstanding) * 100) / 100 : 0;
}
