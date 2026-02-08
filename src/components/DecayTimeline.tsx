"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingDown, AlertTriangle, Clock } from "lucide-react";

interface DecayTimelineProps {
    phase: string;
    collapseProbability: number;
    velocity: string;
    healthScore: number;
}

const PHASES = ["Growth", "Peak", "Saturation", "Decay", "Collapse"] as const;

const phaseColors: Record<string, string> = {
    Growth: "#39ff14",
    Peak: "#00f0ff",
    Saturation: "#fbbf24",
    Decay: "#f97316",
    Collapse: "#ff2a6d",
};

export default function DecayTimeline({ phase, collapseProbability, velocity, healthScore }: DecayTimelineProps) {
    // Normalize phase name
    const normalizedPhase = PHASES.find(p => phase?.toLowerCase().includes(p.toLowerCase())) || "Saturation";
    const currentPhaseIndex = PHASES.indexOf(normalizedPhase as typeof PHASES[number]);

    // Calculate estimated days until collapse based on metrics
    const getEstimatedDays = () => {
        if (collapseProbability > 80) return { min: 1, max: 7 };
        if (collapseProbability > 60) return { min: 7, max: 14 };
        if (collapseProbability > 40) return { min: 14, max: 30 };
        if (collapseProbability > 20) return { min: 30, max: 60 };
        return { min: 60, max: 90 };
    };

    const estimatedDays = getEstimatedDays();

    // Calculate projected curve points
    const getCurvePoints = () => {
        const points = [];
        const now = currentPhaseIndex;

        for (let i = 0; i <= 4; i++) {
            let y;
            if (i <= now) {
                // Historical/current - based on actual health
                y = i === 0 ? 20 : i === 1 ? 90 : i === 2 ? 70 : i === 3 ? 40 : 10;
            } else {
                // Future projection
                const decay = Math.pow(0.6, i - now);
                y = Math.max(5, healthScore * decay);
            }
            points.push({ x: i * 25, y: 100 - y });
        }
        return points;
    };

    const curvePoints = getCurvePoints();
    const pathD = `M ${curvePoints.map(p => `${p.x},${p.y}`).join(" L ")}`;

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Decay Forecast</h3>
                        <p className="text-xs text-white/40">Projected lifecycle timeline</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-white/50">Est. Collapse</div>
                    <div className="text-lg font-bold text-decay-red">
                        {estimatedDays.min}-{estimatedDays.max} days
                    </div>
                </div>
            </div>

            {/* Timeline Visualization */}
            <div className="relative mb-6">
                {/* SVG Curve */}
                <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#39ff14" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#ff2a6d" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    {[25, 50, 75].map((y) => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    ))}

                    {/* Projected area (future) */}
                    <path
                        d={`${pathD} L 100,100 L ${currentPhaseIndex * 25},100 Z`}
                        fill="url(#curveGradient)"
                        opacity="0.1"
                    />

                    {/* Main curve */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="url(#curveGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Current position marker */}
                    <motion.circle
                        cx={currentPhaseIndex * 25}
                        cy={curvePoints[currentPhaseIndex]?.y || 50}
                        r="4"
                        fill={phaseColors[normalizedPhase]}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                    />
                    <motion.circle
                        cx={currentPhaseIndex * 25}
                        cy={curvePoints[currentPhaseIndex]?.y || 50}
                        r="8"
                        fill={phaseColors[normalizedPhase]}
                        opacity="0.3"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ delay: 1, duration: 2, repeat: Infinity }}
                    />
                </svg>

                {/* Phase Labels */}
                <div className="flex justify-between mt-2">
                    {PHASES.map((p, i) => (
                        <div
                            key={p}
                            className={`text-[10px] font-mono text-center ${i === currentPhaseIndex
                                    ? "text-white font-bold"
                                    : i < currentPhaseIndex
                                        ? "text-white/40"
                                        : "text-white/20"
                                }`}
                        >
                            {p}
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <div className="text-xs text-white/40">Current Phase</div>
                    <div className="text-sm font-bold" style={{ color: phaseColors[normalizedPhase] }}>
                        {normalizedPhase}
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <TrendingDown className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <div className="text-xs text-white/40">Velocity</div>
                    <div className="text-sm font-bold text-white">{velocity || "Declining"}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                    <div className="text-xs text-white/40">Collapse Risk</div>
                    <div className="text-sm font-bold text-decay-red">{collapseProbability}%</div>
                </div>
            </div>

            {/* Forecast Note */}
            <div className="mt-4 text-xs text-white/30 text-center font-mono">
                📊 Projection based on current engagement velocity and historical patterns
            </div>
        </div>
    );
}
