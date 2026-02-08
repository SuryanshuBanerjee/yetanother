"use client";

import { motion } from "framer-motion";
import { ROLE_LABELS } from "@/lib/role-config";

interface TriadeDimension {
  score: number;
  indicators: string[];
  detail: string;
}

interface TrendTriadeProps {
  trendTriade: {
    communityFragmentation: TriadeDimension;
    semanticSaturation: TriadeDimension;
    commercialExhaustion: TriadeDimension;
  };
  userRole?: string;
}

const scoreColor = (score: number) => {
  if (score < 40) return { text: "text-green-400", bg: "bg-green-400", bar: "bg-green-400" };
  if (score <= 65) return { text: "text-yellow-400", bg: "bg-yellow-400", bar: "bg-yellow-400" };
  return { text: "text-red-400", bg: "bg-red-400", bar: "bg-red-400" };
};

function scoreInterpretation(score: number): { label: string; color: string } {
  if (score < 30) return { label: "Healthy — low risk", color: "text-green-400" };
  if (score <= 60) return { label: "Watch — moderate pressure", color: "text-yellow-400" };
  return { label: "Warning — high decay signal", color: "text-red-400" };
}

export default function TrendTriade({ trendTriade, userRole = "general-user" }: TrendTriadeProps) {
  const labels = ROLE_LABELS[userRole] || ROLE_LABELS["general-user"];
  const dims = [
    { key: "fragmentation" as const, data: trendTriade.communityFragmentation, label: labels.fragmentation },
    { key: "saturation" as const, data: trendTriade.semanticSaturation, label: labels.saturation },
    { key: "exhaustion" as const, data: trendTriade.commercialExhaustion, label: labels.exhaustion },
  ];

  // SVG radar triangle — equilateral, 3 axes
  const cx = 150, cy = 140, r = 100;
  // Vertices at top, bottom-left, bottom-right
  const angles = [-Math.PI / 2, Math.PI * 5 / 6, Math.PI / 6];
  const vertices = angles.map((a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));

  // Data polygon
  const dataPoints = dims.map((dim, i) => {
    const ratio = Math.min(dim.data.score, 100) / 100;
    const a = angles[i];
    return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a) };
  });

  const outerPath = vertices.map((v) => `${v.x},${v.y}`).join(" ");
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid lines at 33% and 66%
  const gridPoly = (scale: number) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
    >
      <h3 className="text-lg font-bold text-white mb-1">Collapse Indicator Triade</h3>
      <p className="text-xs text-white/40 mb-4">Three dimensions of trend decay risk</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Radar Chart */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <svg width={300} height={280} viewBox="0 0 300 280" className="overflow-visible">
            {/* Gradient definition */}
            <defs>
              <linearGradient id="triadeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
              </linearGradient>
              <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid */}
            <polygon points={outerPath} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={1} />
            <polygon points={gridPoly(0.66)} fill="none" stroke="white" strokeOpacity={0.07} strokeWidth={1} />
            <polygon points={gridPoly(0.33)} fill="none" stroke="white" strokeOpacity={0.05} strokeWidth={1} />

            {/* Axes */}
            {vertices.map((v, i) => (
              <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="white" strokeOpacity={0.08} strokeWidth={1} />
            ))}

            {/* Data polygon with gradient fill */}
            <motion.polygon
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              points={dataPath}
              fill="url(#triadeGradient)"
              stroke="#00f0ff"
              strokeWidth={2}
            />

            {/* Data points with glow */}
            {dataPoints.map((p, i) => {
              const fillColor = dims[i].data.score < 40 ? "#4ade80" : dims[i].data.score <= 65 ? "#facc15" : "#f87171";
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={fillColor}
                  stroke="white"
                  strokeWidth={1.5}
                  filter="url(#glowFilter)"
                />
              );
            })}

            {/* Labels at vertices */}
            {vertices.map((v, i) => {
              const offsetX = i === 0 ? 0 : i === 1 ? -10 : 10;
              const offsetY = i === 0 ? -14 : 18;
              const anchor = i === 0 ? "middle" : i === 1 ? "end" : "start";
              const color = dims[i].data.score < 40 ? "#4ade80" : dims[i].data.score <= 65 ? "#facc15" : "#f87171";
              return (
                <g key={i}>
                  <text x={v.x + offsetX} y={v.y + offsetY} textAnchor={anchor} fill="white" fontSize={11} fontWeight={600}>
                    {dims[i].label}
                  </text>
                  <text x={v.x + offsetX} y={v.y + offsetY + 14} textAnchor={anchor} fill={color} fontSize={13} fontWeight={700} fontFamily="monospace">
                    {dims[i].data.score}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Cards */}
        <div className="flex-1 space-y-3">
          {dims.map((dim, i) => {
            const colors = scoreColor(dim.data.score);
            const interp = scoreInterpretation(dim.data.score);
            return (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-3 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{dim.label}</span>
                  <span className={`text-sm font-mono font-bold ${colors.text}`}>{dim.data.score}/100</span>
                </div>
                {/* Score bar */}
                <div className="h-1.5 w-full rounded-full bg-white/10 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(dim.data.score, 100)}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${colors.bar}`}
                  />
                </div>
                {/* Indicators */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dim.data.indicators.map((ind, j) => (
                    <span key={j} className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/60">
                      {ind}
                    </span>
                  ))}
                </div>
                {/* Detail */}
                <p className="text-xs text-white/50 leading-relaxed">{dim.data.detail}</p>
                {/* Interpretation */}
                <p className={`text-xs mt-1 font-medium ${interp.color}`}>{interp.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
