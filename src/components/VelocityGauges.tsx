"use client";

import { motion } from "framer-motion";

interface VelocityGaugesProps {
  deltaVelocity?: number;
  peakWidth?: number;
  decayHalfLife?: number;
  regionalSkew?: {
    concentration?: number;
    dominantRegion?: string;
    isGlobal?: boolean;
  };
}

// Semicircular arc gauge
function ArcGauge({ value, min, max, color, label, detail, badge }: {
  value: number;
  min: number;
  max: number;
  color: string;
  label: string;
  detail: string;
  badge?: { text: string; color: string };
}) {
  const cx = 80, cy = 75, r = 60;
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Arc from PI to 0 (left to right semicircle)
  const startAngle = Math.PI;
  const sweepAngle = Math.PI * normalized;
  const endAngle = startAngle - sweepAngle;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = sweepAngle > Math.PI ? 1 : 0;

  // Background arc (full semicircle)
  const bgX = cx + r * Math.cos(0);
  const bgY = cy + r * Math.sin(0);

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
      <div className="flex justify-center">
        <svg width={160} height={90} viewBox="0 0 160 90">
          {/* Background arc */}
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX} ${bgY}`}
            fill="none"
            stroke="white"
            strokeOpacity={0.1}
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Value arc */}
          {normalized > 0.01 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
            />
          )}
          {/* Value text */}
          <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={20} fontWeight={700} fontFamily="monospace">
            {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="white" fillOpacity={0.4} fontSize={10}>
            {label}
          </text>
        </svg>
      </div>
      {badge && (
        <div className="flex justify-center mt-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>{badge.text}</span>
        </div>
      )}
      <p className="text-xs text-white/50 text-center mt-2 leading-relaxed">{detail}</p>
    </div>
  );
}

function getVelocityBadge(v: number): { text: string; color: string } {
  if (v < -30) return { text: "FREEFALL", color: "bg-red-500/20 text-red-400" };
  if (v < -10) return { text: "DECLINING", color: "bg-orange-500/20 text-orange-400" };
  if (v <= 10) return { text: "STABLE", color: "bg-yellow-500/20 text-yellow-400" };
  if (v <= 30) return { text: "GROWING", color: "bg-green-500/20 text-green-400" };
  return { text: "SURGING", color: "bg-cyan-500/20 text-cyan-400" };
}

function getVelocityColor(v: number): string {
  if (v < -30) return "#f87171";
  if (v < -10) return "#fb923c";
  if (v <= 10) return "#facc15";
  if (v <= 30) return "#4ade80";
  return "#00f0ff";
}

function getPeakWidthBadge(days: number): { text: string; color: string } {
  if (days < 3) return { text: "FLASH", color: "bg-red-500/20 text-red-400" };
  if (days < 7) return { text: "SHORT", color: "bg-orange-500/20 text-orange-400" };
  if (days < 14) return { text: "MODERATE", color: "bg-yellow-500/20 text-yellow-400" };
  return { text: "RESILIENT", color: "bg-green-500/20 text-green-400" };
}

function getDecayBadge(days: number): { text: string; color: string } {
  if (days < 3) return { text: "RAPID DECAY", color: "bg-red-500/20 text-red-400" };
  if (days < 7) return { text: "FAST DECAY", color: "bg-orange-500/20 text-orange-400" };
  if (days < 14) return { text: "MODERATE", color: "bg-yellow-500/20 text-yellow-400" };
  return { text: "RESILIENT", color: "bg-green-500/20 text-green-400" };
}

export default function VelocityGauges({ deltaVelocity, peakWidth, decayHalfLife, regionalSkew }: VelocityGaugesProps) {
  const hasAny = deltaVelocity != null || peakWidth != null || decayHalfLife != null || regionalSkew;
  if (!hasAny) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-lg font-bold text-white">Lifecycle Metrics</h3>
      <p className="text-xs text-white/40">Velocity, resilience, and geographic distribution</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {deltaVelocity != null && (
          <ArcGauge
            value={deltaVelocity}
            min={-50}
            max={50}
            color={getVelocityColor(deltaVelocity)}
            label="Delta Velocity"
            detail="Rate of interest change per day. Negative = declining, positive = accelerating."
            badge={getVelocityBadge(deltaVelocity)}
          />
        )}

        {peakWidth != null && (
          <ArcGauge
            value={peakWidth}
            min={0}
            max={30}
            color={peakWidth >= 14 ? "#4ade80" : peakWidth >= 7 ? "#facc15" : "#f87171"}
            label="Peak Width (days)"
            detail="How many days the trend sustained peak-level interest."
            badge={getPeakWidthBadge(peakWidth)}
          />
        )}

        {decayHalfLife != null && (
          <ArcGauge
            value={decayHalfLife}
            min={0}
            max={30}
            color={decayHalfLife >= 14 ? "#4ade80" : decayHalfLife >= 7 ? "#facc15" : "#f87171"}
            label="Decay Half-Life (days)"
            detail="Days for interest to drop 50% from peak. Longer = more staying power."
            badge={getDecayBadge(decayHalfLife)}
          />
        )}

        {regionalSkew && (
          <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <div className="text-sm font-semibold text-white mb-2">Regional Skew</div>
            {regionalSkew.concentration != null && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Concentration</span>
                  <span className="text-white font-mono">{regionalSkew.concentration}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(regionalSkew.concentration, 100)}%` }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: regionalSkew.concentration > 70 ? "#f87171" : regionalSkew.concentration > 40 ? "#facc15" : "#4ade80" }}
                  />
                </div>
              </div>
            )}
            {regionalSkew.dominantRegion && (
              <div className="text-xs text-white/50 mb-1">
                Dominant: <span className="text-white font-medium">{regionalSkew.dominantRegion}</span>
              </div>
            )}
            {regionalSkew.isGlobal != null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${regionalSkew.isGlobal ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                {regionalSkew.isGlobal ? "GLOBAL" : "REGIONAL"}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
