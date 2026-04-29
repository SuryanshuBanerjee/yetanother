"use client";

import { HORIZON_ALERTS, HorizonAlert } from "@/lib/decayEngine";
import { Radar, TrendingUp, Calendar, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HorizonAlerts() {
    return (
        <div className="p-6 rounded-2xl bg-surface-1/50 border border-neon-purple/30 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Radar className="w-5 h-5 text-neon-purple animate-pulse" />
                    <h3 className="font-bold text-white">Horizon Alerts</h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                    AGENT SCOUT ACTIVE
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-white/50 mb-4">
                Autonomous agent monitoring emerging trends across 500+ subreddits.
            </p>

            {/* Alerts List */}
            <div className="space-y-3">
                {HORIZON_ALERTS.map((alert, i) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="p-4 rounded-lg bg-black/40 border border-white/5 hover:border-neon-purple/30 transition-colors group"
                    >
                        {/* Trend Name & Spike */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white group-hover:text-neon-purple transition-colors">
                                {alert.trend}
                            </span>
                            <span className="text-xs font-mono text-neon-green flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {alert.spike}
                            </span>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-4 text-[11px]">
                            <div className="flex items-center gap-1 text-white/50">
                                <Zap className="w-3 h-3 text-neon-blue" />
                                <span>Mainstream: <span className="text-neon-blue">{alert.mainstreamProbability}%</span></span>
                            </div>
                            <div className="flex items-center gap-1 text-white/50">
                                <Calendar className="w-3 h-3" />
                                <span>Peak: {alert.estimatedPeak}</span>
                            </div>
                        </div>

                        {/* Detected */}
                        <div className="mt-2 text-[10px] text-white/30">
                            Detected {alert.detectedAt}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/30 font-mono">
                    Next scan in 47:32 • Last updated 2h ago
                </p>
            </div>
        </div>
    );
}
