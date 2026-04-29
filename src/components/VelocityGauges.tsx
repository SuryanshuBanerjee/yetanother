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

function MetricCard({ value, label, detail, badge }: {
  value: number | string;
  label: string;
  detail: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
      <div className="text-center mb-2">
        <span className="text-3xl font-bold font-mono text-white">
          {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
        </span>
      </div>
      <div className="text-xs text-white/50 text-center font-medium mb-1">{label}</div>
      {badge && (
        <div className="flex justify-center mb-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>{badge.text}</span>
        </div>
      )}
      <p className="text-xs text-white/40 text-center leading-relaxed">{detail}</p>
    </div>
  );
}

function getVelocityBadge(v: number): { text: string; color: string } {
  if (v < -30) return { text: "FREEFALL", color: "bg-red-500/20 text-red-400" };
  if (v < -10) return { text: "DECLINING", color: "bg-orange-500/20 text-orange-400" };
  if (v <= 10) return { text: "STABLE", color: "bg-yellow-500/20 text-yellow-400" };
  if (v <= 30) return { text: "GROWING", color: "bg-green-500/20 text-green-400" };
  return { text: "SURGING", color: "bg-white/20 text-white" };
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
          <MetricCard
            value={deltaVelocity}
            label="Delta Velocity"
            detail="Rate of interest change per week. Negative = declining, positive = accelerating."
            badge={getVelocityBadge(deltaVelocity)}
          />
        )}

        {peakWidth != null && (
          <MetricCard
            value={peakWidth}
            label="Peak Width (days)"
            detail="How many days the trend sustained peak-level interest."
            badge={getPeakWidthBadge(peakWidth)}
          />
        )}

        {decayHalfLife != null && (
          <MetricCard
            value={decayHalfLife}
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
