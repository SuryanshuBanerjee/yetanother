"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "info" | "error";
  message: string;
  index: number;
}

const MAX_UI_LINES = 200;

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "??:??:??";
  }
}

export default function BackendTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  // Keep ref in sync with state so the EventSource callback sees the latest value
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Clear unread count when terminal is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new logs arrive and terminal is open
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const addLogEntry = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const next = [...prev, entry];
      // Keep only last MAX_UI_LINES
      if (next.length > MAX_UI_LINES) {
        return next.slice(next.length - MAX_UI_LINES);
      }
      return next;
    });

    // Increment unread if terminal is closed
    if (!isOpenRef.current) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  // EventSource connection with auto-reconnect
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      eventSource = new EventSource("/api/logs/stream");

      eventSource.onmessage = (event) => {
        try {
          const entry: LogEntry = JSON.parse(event.data);
          addLogEntry(entry);
        } catch {
          // ignore malformed data
        }
      };

      eventSource.onerror = () => {
        // Close the broken connection
        eventSource?.close();
        eventSource = null;

        // Auto-reconnect after 2 seconds
        if (isMounted) {
          reconnectTimer = setTimeout(() => {
            connect();
          }, 2000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [addLogEntry]);

  return (
    <>
      {/* Floating icon button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-[9999] flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md shadow-lg hover:border-white/30 transition-all duration-200 cursor-pointer group"
            title="Open backend logs"
          >
            <Terminal className="w-5 h-5 text-white/70 group-hover:text-white" />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-black bg-white rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Terminal panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-5 right-5 z-[9999] w-[500px] h-[400px] flex flex-col rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white/80" />
                <span className="text-xs font-mono font-semibold tracking-widest text-white/80 uppercase">
                  Backend Logs
                </span>
                <span className="text-[10px] font-mono text-white/30">
                  ({logs.length})
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Close terminal"
              >
                <X className="w-3.5 h-3.5 text-white/50 hover:text-white/80" />
              </button>
            </div>

            {/* Log lines */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-[12px] leading-[1.6] scrollbar-thin"
            >
              {logs.length === 0 && (
                <div className="flex items-center justify-center h-full text-white/20 text-xs italic">
                  Waiting for backend logs...
                </div>
              )}

              {logs.map((entry) => (
                <div
                  key={entry.index}
                  className={`flex items-start gap-2 py-[1px] ${entry.level === "error" ? "text-red-400/90" : ""
                    }`}
                >
                  {/* Timestamp */}
                  <span className="text-white/25 shrink-0 select-none">
                    {formatTime(entry.timestamp)}
                  </span>

                  {/* Level dot */}
                  <span
                    className={`mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full ${entry.level === "error"
                        ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]"
                        : "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                      }`}
                  />

                  {/* Message */}
                  <span
                    className={`break-all ${entry.level === "error"
                        ? "text-red-400/80"
                        : "text-white/70"
                      }`}
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom glow accent */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
