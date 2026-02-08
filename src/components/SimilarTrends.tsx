"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { ROLE_CONTEXT } from "@/lib/role-config";

interface SimilarTrend {
    query?: string;
    title?: string;
    value: number;
    formattedValue?: string;
    type?: string;
}

interface SimilarTrendsProps {
    trends: SimilarTrend[];
    rising: SimilarTrend[];
    onTrendClick?: (trend: string) => void;
    userRole?: string;
}

export default function SimilarTrends({ trends = [], rising = [], onTrendClick, userRole = "general-user" }: SimilarTrendsProps) {
    const allTrends = [
        ...rising.map((t) => ({ ...t, isRising: true })),
        ...trends.filter((t) => !rising.some((r) => r.query === t.query)).map((t) => ({ ...t, isRising: false })),
    ].slice(0, 10);

    if (allTrends.length === 0) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-white/40 text-center">No related trends available</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Related Trends</span>
                    <span className="text-xs text-white/40 font-mono">{allTrends.length} trends</span>
                </div>
                <p className="text-xs text-white/30 mt-1">{(ROLE_CONTEXT[userRole] || ROLE_CONTEXT["general-user"]).similarTrends}</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-xs text-white/40">
                            <th className="px-4 py-2 text-left font-medium">Trend</th>
                            <th className="px-4 py-2 text-right font-medium">Score</th>
                            <th className="px-4 py-2 text-right font-medium">Status</th>
                            <th className="px-4 py-2 text-right font-medium w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {allTrends.map((trend, i) => {
                            const name = trend.query || trend.title || "Unknown";
                            const score = trend.value || 0;
                            const isBreakout = score > 100; // Breakout score > 100%

                            return (
                                <motion.tr
                                    key={name + i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                    onClick={() => onTrendClick?.(name)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium group-hover:text-neon-blue transition-colors">
                                                {name}
                                            </span>
                                            {trend.isRising && (
                                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 font-mono">
                                                    RISING
                                                </span>
                                            )}
                                            {isBreakout && (
                                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/50/20 text-white/70 font-mono">
                                                    BREAKOUT
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-mono ${score > 50 ? "text-green-400" : "text-white/60"}`}>
                                            {score}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {trend.isRising ? (
                                            <TrendingUp className="w-4 h-4 text-green-400 inline-block" />
                                        ) : score > 50 ? (
                                            <Minus className="w-4 h-4 text-white/40 inline-block" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-400 inline-block" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-colors inline-block" />
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
