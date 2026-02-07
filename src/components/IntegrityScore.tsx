"use client";

import { IntegrityData } from "@/lib/decayEngine";
import { ShieldAlert, ShieldCheck, AlertOctagon, Radio } from "lucide-react";
import { motion } from "framer-motion";

export default function IntegrityScore({ data }: { data: IntegrityData }) {
    const isCompromised = data.score < 50;
    const isCritical = data.burstPatterns;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl backdrop-blur-md border ${isCritical
                    ? "bg-decay-red/10 border-decay-red/30"
                    : isCompromised
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-surface-1/50 border-white/10"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {isCritical ? (
                        <AlertOctagon className="w-5 h-5 text-decay-red" />
                    ) : isCompromised ? (
                        <ShieldAlert className="w-5 h-5 text-yellow-400" />
                    ) : (
                        <ShieldCheck className="w-5 h-5 text-neon-green" />
                    )}
                    <h3 className="font-bold text-white">Integrity Score</h3>
                </div>
                {isCritical && (
                    <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-decay-red/20 text-decay-red border border-decay-red/30 animate-pulse">
                        MANIPULATION DETECTED
                    </span>
                )}
            </div>

            {/* Score Gauge */}
            <div className="text-center py-4 mb-4">
                <div className={`text-6xl font-bold ${isCritical ? "text-decay-red" : isCompromised ? "text-yellow-400" : "text-neon-green"
                    }`}>
                    {data.score}
                    <span className="text-2xl text-white/40">/100</span>
                </div>
                <p className="text-xs text-white/40 mt-1">
                    {isCritical ? "Compromised" : isCompromised ? "Suspicious" : "Authentic"}
                </p>
            </div>

            {/* Burst Pattern Warning */}
            {data.burstPatterns && (
                <div className="p-4 rounded-lg bg-black/40 border border-decay-red/20 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Radio className="w-4 h-4 text-decay-red animate-pulse" />
                        <span className="text-xs font-mono uppercase text-decay-red">Burst Pattern Detected</span>
                    </div>
                    <p className="text-xs text-white/60">
                        500+ posts with identical timestamps detected. This indicates coordinated bot-farm activity.
                    </p>
                    {data.suspectedOrigin && (
                        <p className="text-xs text-white/40 mt-2">
                            Suspected Origin: <span className="text-decay-red">{data.suspectedOrigin}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Warning Message */}
            {data.warning && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-200 leading-relaxed">
                        ⚠️ {data.warning}
                    </p>
                </div>
            )}

            {/* Clean Bill */}
            {!isCompromised && !isCritical && (
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                    <p className="text-xs text-neon-green">
                        ✓ This trend shows organic growth patterns. No manipulation detected.
                    </p>
                </div>
            )}
        </motion.div>
    );
}
