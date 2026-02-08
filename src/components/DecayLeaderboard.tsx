"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingDown, Skull, Trophy, AlertCircle } from "lucide-react";

interface DecayLeaderboardProps {
    onTrendClick?: (trend: string) => void;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    decayVelocity: number;
    phase: string;
    daysToCollapse: number;
}

export default function DecayLeaderboard({ onTrendClick }: DecayLeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);

    useEffect(() => {
        const loadLeaderboard = async () => {
            setLoading(true);
            setNoData(false);

            try {
                // Fetch real trends from database
                const res = await fetch("/api/trends/database");
                const data = await res.json();

                if (data.stocks && data.stocks.length > 0) {
                    // Calculate decay velocity from real metrics
                    const realEntries: LeaderboardEntry[] = data.stocks
                        .map((stock: {
                            name: string;
                            score?: number;
                            risk?: string;
                            phase?: string;
                            change?: number;
                        }) => {
                            // Calculate decay velocity based on available metrics
                            let decayVelocity = 50; // baseline

                            // Higher score = healthier = lower decay velocity
                            if (stock.score !== undefined) {
                                decayVelocity = Math.max(10, 100 - stock.score);
                            }

                            // Adjust for risk level
                            if (stock.risk === "Critical") decayVelocity = Math.min(100, decayVelocity + 20);
                            else if (stock.risk === "High") decayVelocity = Math.min(100, decayVelocity + 10);
                            else if (stock.risk === "Low") decayVelocity = Math.max(10, decayVelocity - 15);

                            // Adjust for negative change
                            if (stock.change !== undefined && stock.change < 0) {
                                decayVelocity = Math.min(100, decayVelocity + Math.abs(stock.change) / 2);
                            }

                            // Estimate days to collapse based on velocity
                            const daysToCollapse = Math.max(1, Math.round((100 - decayVelocity) / 5));

                            // Determine phase
                            let phase = stock.phase || "Unknown";
                            if (decayVelocity >= 80) phase = "Collapse";
                            else if (decayVelocity >= 60) phase = "Decay";
                            else if (decayVelocity >= 40) phase = "Saturation";

                            return {
                                rank: 0, // will be set after sorting
                                name: stock.name,
                                decayVelocity: Math.round(decayVelocity),
                                phase,
                                daysToCollapse,
                            };
                        })
                        // Sort by decay velocity (highest first)
                        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.decayVelocity - a.decayVelocity)
                        // Take top 5
                        .slice(0, 5)
                        // Assign ranks
                        .map((entry: LeaderboardEntry, i: number) => ({ ...entry, rank: i + 1 }));

                    if (realEntries.length > 0) {
                        setEntries(realEntries);
                    } else {
                        setNoData(true);
                    }
                } else {
                    setNoData(true);
                }
            } catch {
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();

        // Refresh every 30 seconds
        const interval = setInterval(loadLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="w-4 h-4 text-yellow-400" />;
            case 2: return <Trophy className="w-4 h-4 text-gray-400" />;
            case 3: return <Trophy className="w-4 h-4 text-amber-600" />;
            default: return <span className="text-xs text-white/30 w-4 text-center">{rank}</span>;
        }
    };

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case "Collapse": return "text-red-400 bg-red-500/20";
            case "Decay": return "text-orange-400 bg-orange-500/20";
            case "Saturation": return "text-yellow-400 bg-yellow-500/20";
            default: return "text-white/50 bg-white/10";
        }
    };

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-red-500/20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <Skull className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Decay Leaderboard</h3>
                        <p className="text-xs text-white/40">From your analyzed trends</p>
                    </div>
                </div>
                {!noData && !loading && (
                    <div className="flex items-center gap-1 text-xs text-red-400 animate-pulse">
                        <Flame className="w-3 h-3" />
                        LIVE
                    </div>
                )}
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
                {loading ? (
                    // Loading skeleton
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                    ))
                ) : noData ? (
                    // No data message
                    <div className="text-center py-8">
                        <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
                        <div className="text-sm text-white/40 mb-2">No analyzed trends yet</div>
                        <div className="text-xs text-white/30">
                            Search for trends to populate this leaderboard
                        </div>
                    </div>
                ) : (
                    entries.map((entry, i) => (
                        <motion.div
                            key={entry.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onTrendClick?.(entry.name)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            {/* Rank */}
                            <div className="w-6 flex justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                                    {entry.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded ${getPhaseColor(entry.phase)}`}>
                                        {entry.phase}
                                    </span>
                                    <span className="text-white/30">
                                        ~{entry.daysToCollapse}d left
                                    </span>
                                </div>
                            </div>

                            {/* Decay Velocity */}
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-red-400">
                                    <TrendingDown className="w-3 h-3" />
                                    <span className="font-mono font-bold">{entry.decayVelocity}%</span>
                                </div>
                                <div className="text-[10px] text-white/30">decay velocity</div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            {!noData && !loading && (
                <div className="mt-4 text-center text-xs text-white/20 font-mono">
                    Based on your analyzed trends • Click to view details
                </div>
            )}
        </div>
    );
}
