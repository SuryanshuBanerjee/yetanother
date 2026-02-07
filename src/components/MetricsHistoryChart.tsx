"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface MetricsHistoryEntry {
  date: string;
  entropy?: number;
  modularity?: number;
  clustering?: number;
  volume?: number;
}

interface MetricsHistoryChartProps {
  metricsHistory: MetricsHistoryEntry[];
  userRole?: string;
}

const LINES = [
  { key: "entropy" as const, label: "Entropy", color: "#a855f7" },
  { key: "modularity" as const, label: "Modularity", color: "#f87171" },
  { key: "clustering" as const, label: "Clustering", color: "#4ade80" },
  { key: "volume" as const, label: "Volume", color: "#00f0ff" },
];

// Which lines to emphasize per role
const ROLE_EMPHASIS: Record<string, string[]> = {
  "content-creator": ["volume", "entropy"],
  "marketing-team": ["volume", "modularity"],
  "general-user": ["volume", "entropy"],
  "platform-moderator": ["entropy", "clustering"],
};

export default function MetricsHistoryChart({ metricsHistory, userRole = "general-user" }: MetricsHistoryChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const emphasized = ROLE_EMPHASIS[userRole] || ROLE_EMPHASIS["general-user"];

  // Normalize each metric independently to 0-100%
  const { normalizedData, ranges } = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    for (const line of LINES) {
      const values = metricsHistory
        .map((e) => e[line.key])
        .filter((v): v is number => v != null);
      if (values.length === 0) {
        ranges[line.key] = { min: 0, max: 1 };
      } else {
        const min = Math.min(...values);
        const max = Math.max(...values);
        ranges[line.key] = { min, max: max === min ? min + 1 : max };
      }
    }
    const normalizedData = metricsHistory.map((entry) => {
      const normalized: Record<string, number | undefined> = { date: undefined };
      for (const line of LINES) {
        const val = entry[line.key];
        if (val != null) {
          const r = ranges[line.key];
          normalized[line.key] = ((val - r.min) / (r.max - r.min)) * 100;
        }
      }
      return { ...entry, _normalized: normalized };
    });
    return { normalizedData, ranges };
  }, [metricsHistory]);

  if (!metricsHistory || metricsHistory.length === 0) return null;

  const width = 600, height = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const toggleLine = (key: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Trend DNA Over Time</h3>
          <p className="text-xs text-white/40">Network metrics evolution across the trend lifecycle</p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {LINES.map((line) => {
            const isHidden = hiddenLines.has(line.key);
            const isEmphasized = emphasized.includes(line.key);
            return (
              <button
                key={line.key}
                onClick={() => toggleLine(line.key)}
                className={`flex items-center gap-1.5 text-xs transition-opacity ${isHidden ? "opacity-30" : "opacity-100"}`}
              >
                <div
                  className="w-3 h-0.5 rounded"
                  style={{
                    backgroundColor: line.color,
                    height: isEmphasized ? 3 : 2,
                  }}
                />
                <span className={`${isEmphasized ? "text-white font-medium" : "text-white/50"}`}>
                  {line.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative" onMouseLeave={() => setHoveredIdx(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = padding.top + chartH - (pct / 100) * chartH;
            return (
              <line key={pct} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="white" strokeOpacity={0.05} strokeWidth={1} />
            );
          })}

          {/* Lines */}
          {LINES.map((line) => {
            if (hiddenLines.has(line.key)) return null;
            const isEmphasized = emphasized.includes(line.key);
            const points = normalizedData
              .map((entry, i) => {
                const val = entry._normalized[line.key];
                if (val == null) return null;
                const x = padding.left + (i / (normalizedData.length - 1)) * chartW;
                const y = padding.top + chartH - (val / 100) * chartH;
                return `${x},${y}`;
              })
              .filter(Boolean)
              .join(" ");

            if (!points) return null;

            return (
              <motion.polyline
                key={line.key}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isEmphasized ? 1 : 0.5 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                fill="none"
                stroke={line.color}
                strokeWidth={isEmphasized ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            );
          })}

          {/* Hover regions */}
          {normalizedData.map((_, i) => {
            const x = padding.left + (i / (normalizedData.length - 1)) * chartW;
            return (
              <rect
                key={i}
                x={x - chartW / normalizedData.length / 2}
                y={padding.top}
                width={chartW / normalizedData.length}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}

          {/* Hover line */}
          {hoveredIdx != null && (
            <line
              x1={padding.left + (hoveredIdx / (normalizedData.length - 1)) * chartW}
              y1={padding.top}
              x2={padding.left + (hoveredIdx / (normalizedData.length - 1)) * chartW}
              y2={padding.top + chartH}
              stroke="white"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}

          {/* X-axis date labels */}
          {normalizedData.filter((_, i) => i % Math.max(1, Math.floor(normalizedData.length / 6)) === 0).map((entry, _, arr) => {
            const idx = normalizedData.indexOf(entry);
            const x = padding.left + (idx / (normalizedData.length - 1)) * chartW;
            return (
              <text key={idx} x={x} y={height - 5} textAnchor="middle" fill="white" fillOpacity={0.3} fontSize={9} fontFamily="monospace">
                {entry.date}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIdx != null && normalizedData[hoveredIdx] && (
          <div
            className="absolute z-10 bg-black/90 border border-white/20 rounded-lg px-3 py-2 text-xs pointer-events-none"
            style={{
              left: `${(hoveredIdx / (normalizedData.length - 1)) * 100}%`,
              top: 0,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-white/50 mb-1 font-mono">{normalizedData[hoveredIdx].date}</div>
            {LINES.map((line) => {
              if (hiddenLines.has(line.key)) return null;
              const val = metricsHistory[hoveredIdx]?.[line.key];
              if (val == null) return null;
              return (
                <div key={line.key} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                  <span className="text-white/70">{line.label}:</span>
                  <span className="font-mono text-white">{typeof val === "number" ? val.toFixed(2) : val}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
