import { getRecentLogs, getLatestIndex } from "@/lib/log-buffer";

// Force this route to never be cached / statically generated
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send all buffered logs immediately on connection
      const buffered = getRecentLogs(0);
      for (const entry of buffered) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(entry)}\n\n`)
        );
      }

      let lastSentIndex = getLatestIndex();

      // Poll for new logs every 500ms
      const interval = setInterval(() => {
        try {
          const newLogs = getRecentLogs(lastSentIndex);
          for (const entry of newLogs) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(entry)}\n\n`)
            );
          }
          if (newLogs.length > 0) {
            lastSentIndex =
              newLogs[newLogs.length - 1].index + 1;
          }
        } catch {
          // Connection may have been closed
          clearInterval(interval);
        }
      }, 500);

      // Send a heartbeat comment every 15s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          clearInterval(interval);
        }
      }, 15000);

      // Clean up is handled by the try/catch above:
      // when the client disconnects, enqueue() throws and we clear intervals
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
