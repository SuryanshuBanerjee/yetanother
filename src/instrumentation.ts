// Next.js instrumentation file — runs once when the server starts.
// Importing log-buffer here ensures the console monkey-patching
// is applied before any API routes execute.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/log-buffer");
  }
}
