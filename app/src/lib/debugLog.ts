/** Debug session logging (remove after verification). */
export function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {},
  runId = "pre-fix",
) {
  // #region agent log
  fetch("http://127.0.0.1:7675/ingest/db1b2d23-2498-4aa0-bd09-bb4ee40c265d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8d753e" },
    body: JSON.stringify({
      sessionId: "8d753e",
      hypothesisId,
      location,
      message,
      data,
      runId,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}
