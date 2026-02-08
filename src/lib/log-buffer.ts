// Server-side log capture with ring buffer
// Monkey-patches console.log and console.error to capture backend output

export interface LogEntry {
  timestamp: string;
  level: "info" | "error";
  message: string;
  index: number;
}

const MAX_BUFFER_SIZE = 200;

const buffer: LogEntry[] = [];
let globalIndex = 0;

export function addLog(level: "info" | "error", message: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    index: globalIndex++,
  };

  buffer.push(entry);

  // Ring buffer: remove oldest entries when we exceed the max
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }
}

export function getRecentLogs(sinceIndex: number = 0): LogEntry[] {
  return buffer.filter((entry) => entry.index >= sinceIndex);
}

export function getLatestIndex(): number {
  return globalIndex;
}

// ----- Monkey-patch console.log and console.error -----

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

console.log = (...args: unknown[]) => {
  originalConsoleLog(...args);
  try {
    addLog("info", formatArgs(args));
  } catch {
    // Never let log capture break the application
  }
};

console.error = (...args: unknown[]) => {
  originalConsoleError(...args);
  try {
    addLog("error", formatArgs(args));
  } catch {
    // Never let log capture break the application
  }
};
