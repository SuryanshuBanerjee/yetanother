"use client";

import { DecayAnalysis } from "@/lib/decayEngine";
import MetricExplainer from "./MetricExplainer";
import { AlertTriangle, Hourglass, TrendingDown, Activity } from "lucide-react";

export default function PredictionCards({ data }: { data: DecayAnalysis }) {
    // Determine color based on health score
    const getHealthColor = (score: number) => {
        if (score > 80) return "text-neon-green";
        if (score > 50) return "text-yellow-400";
        return "text-decay-red";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Trend Health */}
            <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute right-[-20px] top-[-20px] text-white/5 group-hover:text-white/10 transition-colors">
                    <Activity className="w-32 h-32" />
                </div>
                <MetricExplainer metricKey="healthScore">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Trend Health</h3>
                </MetricExplainer>
                <div className={`text-4xl font-bold ${getHealthColor(data.healthScore)}`}>
                    {data.healthScore}/100
                </div>
                <div className="mt-2 text-xs text-white/60">
                    Vitality Index
                </div>
            </div>

            {/* Collapse Probability */}
            <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-decay-red/50 transition-colors">
                <div className="absolute right-[-20px] top-[-20px] text-white/5 group-hover:text-decay-red/10 transition-colors">
                    <TrendingDown className="w-32 h-32" />
                </div>
                <MetricExplainer metricKey="collapseProbability">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Collapse Prob.</h3>
                </MetricExplainer>
                <div className="text-4xl font-bold text-decay-red">
                    {data.collapseProbability}%
                </div>
                <div className="mt-2 text-xs text-white/60">
                    Likelihood of <span className="text-decay-red">Total Death</span>
                </div>
            </div>

            {/* Time to Collapse */}
            <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute right-[-20px] top-[-20px] text-white/5 group-hover:text-white/10 transition-colors">
                    <Hourglass className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Est. Lifespan</h3>
                <div className="text-3xl font-bold text-white">
                    {data.timeToCollapse}
                </div>
                <div className="mt-2 text-xs text-white/60">
                    Before <span className="text-white">Irrelevance</span>
                </div>
            </div>

            {/* Current Phase */}
            <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Status</h3>
                <div className="text-3xl font-bold text-white mb-2">
                    {data.phase}
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-neon-blue">
                    VELOCITY: {data.velocity.toUpperCase()}
                </div>
            </div>
        </div>
    );
}
