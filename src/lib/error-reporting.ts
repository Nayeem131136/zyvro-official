type ReportErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Lightweight client-side error reporter.
 * Logs to the console by default. Wire this up to any error-monitoring
 * service you like (Sentry, LogRocket, etc.) by replacing the console.error
 * call below with that service's SDK call.
 */
export function reportAppError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ReportErrorOptions = {},
) {
  if (typeof window === "undefined") return;
  console.error("[App Error]", error, {
    route: window.location.pathname,
    ...context,
    ...options,
  });
}
