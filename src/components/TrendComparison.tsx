"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingDown, Zap, Shield, ArrowRight, X, Swords, Loader2 } from "lucide-react";

interface ComparisonData {
    keyword: string;
    healthScore: number;
    decayScore: number;
    phase: string;
    velocity: string;
    collapseProbability: number;
    verdict: string;
    loading: boolean;
    error: string | null;
}

const emptyData: ComparisonData = {
    keyword: "",
    healthScore: 0,
    decayScore: 0,
    phase: "",
    velocity: "",
    collapseProbability: 0,
    verdict: "",
    loading: false,
    error: null,
};

// Pre-defined popular matchups - Viral trends and challenges
const POPULAR_MATCHUPS = [
    { a: "Lush Life", b: "Brat Summer", category: "Viral Audio" },
    { a: "Demure", b: "Very Mindful", category: "TikTok Trends" },
    { a: "Hawk Tuah", b: "Moo Deng", category: "Viral Moments" },
    { a: "Skibidi Toilet", b: "Grimace Shake", category: "Meme Culture" },
    { a: "Stanley Cup", b: "Owala Bottle", category: "Product Trends" },
    { a: "Quiet Luxury", b: "Mob Wife Aesthetic", category: "Fashion" },
];

interface TrendComparisonProps {
    onClose: () => void;
    userRole?: string;
}

export default function TrendComparison({ onClose, userRole = "general-user" }: TrendComparisonProps) {
    const [trendA, setTrendA] = useState<ComparisonData>({ ...emptyData });
    const [trendB, setTrendB] = useState<ComparisonData>({ ...emptyData });
    const [selectedMatchup, setSelectedMatchup] = useState<{ a: string; b: string } | null>(null);
    const [isComparing, setIsComparing] = useState(false);

    const analyzeTrend = async (keyword: string): Promise<ComparisonData> => {
        try {
            const res = await fetch("/api/trends/decay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword, userRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { ...emptyData, keyword, error: data.message || "Analysis failed" };
            }

            return {
                keyword,
                healthScore: data.healthScore ?? data.score ?? 50,
                decayScore: data.decayScore ?? data.decay ?? 50,
                phase: data.phase || data.decayAnalysis?.phase || "Unknown",
                velocity: data.velocity || data.decayAnalysis?.velocity || "Stable",
                collapseProbability: data.collapseProbability ?? data.decayAnalysis?.collapseProbability ?? 50,
                verdict: data.verdict?.verdict || data.decayAnalysis?.verdict?.verdict || "HOLD",
                loading: false,
                error: null,
            };
        } catch {
            return { ...emptyData, keyword, error: "Network error" };
        }
    };

    const runComparison = async (matchup: { a: string; b: string }) => {
        setSelectedMatchup(matchup);
        setIsComparing(true);
        setTrendA({ ...emptyData, keyword: matchup.a, loading: true });
        setTrendB({ ...emptyData, keyword: matchup.b, loading: true });

        // Run both analyses in parallel
        const [resultA, resultB] = await Promise.all([
            analyzeTrend(matchup.a),
            analyzeTrend(matchup.b),
        ]);

        setTrendA(resultA);
        setTrendB(resultB);
        setIsComparing(false);
    };

    const bothLoaded = trendA.keyword && !trendA.loading && trendB.keyword && !trendB.loading && !trendA.error && !trendB.error;

    // Determine winners for each metric
    const getWinner = (a: number, b: number, higherIsBetter: boolean) => {
        if (a === b) return "tie";
        return higherIsBetter ? (a > b ? "a" : "b") : (a < b ? "a" : "b");
    };

    const healthWinner = bothLoaded ? getWinner(trendA.healthScore, trendB.healthScore, true) : null;
    const decayWinner = bothLoaded ? getWinner(trendA.decayScore, trendB.decayScore, false) : null;
    const collapseWinner = bothLoaded ? getWinner(trendA.collapseProbability, trendB.collapseProbability, false) : null;
    const overallWinner = healthWinner;

    // Loading skeleton component
    const LoadingSkeleton = ({ label }: { label: string }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 p-6"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <Loader2 className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <div className="text-white/50 text-sm">Analyzing {label}...</div>
            <div className="w-full space-y-3">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="h-4 bg-white/5 rounded"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </motion.div>
    );

    const MetricCard = ({ label, valueA, valueB, winner, icon: Icon, unit = "" }: {
        label: string;
        valueA: number;
        valueB: number;
        winner: string | null;
        icon: React.ElementType;
        unit?: string;
    }) => (
        <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
            <div className={`text-right text-2xl font-bold font-mono ${winner === "a" ? "text-neon-green" : "text-white/70"}`}>
                {valueA}{unit}
                {winner === "a" && <Trophy className="inline w-4 h-4 ml-2 text-neon-green" />}
            </div>
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            <div className={`text-left text-2xl font-bold font-mono ${winner === "b" ? "text-neon-green" : "text-white/70"}`}>
                {winner === "b" && <Trophy className="inline w-4 h-4 mr-2 text-neon-green" />}
                {valueB}{unit}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-8"
                style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(15, 15, 25, 0.95))",
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    boxShadow: "0 0 60px rgba(0, 240, 255, 0.1)",
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Swords className="w-8 h-8 text-purple-400" />
                        <h2 className="text-3xl font-bold text-white">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                Trend Showdown
                            </span>
                        </h2>
                    </div>
                    <p className="text-white/50">Pick a matchup to see which trend is winning</p>
                </div>

                {/* Popular Matchups Grid */}
                {!selectedMatchup && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                        {POPULAR_MATCHUPS.map((matchup, index) => (
                            <motion.button
                                key={index}
                                onClick={() => runComparison(matchup)}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                            >
                                <div className="text-[10px] font-mono text-purple-400 mb-2">{matchup.category}</div>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-cyan-400 font-semibold">{matchup.a}</span>
                                    <span className="text-white/30 text-xs">vs</span>
                                    <span className="text-purple-400 font-semibold">{matchup.b}</span>
                                </div>
                                <div className="mt-3 text-xs text-white/30 group-hover:text-white/50 transition-colors">
                                    Click to compare →
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* Loading State */}
                {selectedMatchup && (trendA.loading || trendB.loading) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-8"
                    >
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                                <span className="text-cyan-400">{selectedMatchup.a}</span>
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
                                >
                                    <Swords className="w-5 h-5 text-white" />
                                </motion.div>
                                <span className="text-purple-400">{selectedMatchup.b}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-white/5 rounded-xl border border-cyan-500/20">
                                <LoadingSkeleton label={selectedMatchup.a} />
                            </div>
                            <div className="bg-white/5 rounded-xl border border-purple-500/20">
                                <LoadingSkeleton label={selectedMatchup.b} />
                            </div>
                        </div>

                        <div className="text-center mt-6 text-white/30 text-sm">
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Analyzing trends... this may take 15-30 seconds
                            </motion.span>
                        </div>
                    </motion.div>
                )}

                {/* Comparison Results */}
                <AnimatePresence>
                    {bothLoaded && selectedMatchup && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Winner Banner */}
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="text-center py-8 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-green/5 border border-neon-green/20"
                            >
                                <motion.div
                                    initial={{ rotate: -10, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <Trophy className="w-12 h-12 text-neon-green mx-auto mb-3" />
                                </motion.div>
                                <div className="text-3xl font-bold text-neon-green mb-1">
                                    {overallWinner === "a" ? trendA.keyword : overallWinner === "b" ? trendB.keyword : "It's a tie!"}
                                </div>
                                <div className="text-white/50">has the stronger trend health</div>
                            </motion.div>

                            {/* Metrics Comparison */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="grid grid-cols-3 gap-4 items-center pb-3 border-b border-white/10 mb-4">
                                    <div className="text-right text-cyan-400 font-semibold">{trendA.keyword}</div>
                                    <div className="text-center text-white/30 text-xs font-mono">METRIC</div>
                                    <div className="text-left text-purple-400 font-semibold">{trendB.keyword}</div>
                                </div>

                                <MetricCard label="Health Score" valueA={trendA.healthScore} valueB={trendB.healthScore} winner={healthWinner} icon={Shield} />
                                <MetricCard label="Decay Risk" valueA={trendA.decayScore} valueB={trendB.decayScore} winner={decayWinner} icon={TrendingDown} unit="%" />
                                <MetricCard label="Collapse Risk" valueA={trendA.collapseProbability} valueB={trendB.collapseProbability} winner={collapseWinner} icon={Zap} unit="%" />

                                {/* Verdicts */}
                                <div className="grid grid-cols-3 gap-4 items-center pt-4 mt-4 border-t border-white/10">
                                    <div className={`text-right text-lg font-bold ${trendA.verdict === "BUY" ? "text-neon-green" : trendA.verdict === "WATCH" ? "text-red-400" : "text-yellow-400"}`}>
                                        {trendA.verdict}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                                        <ArrowRight className="w-4 h-4" />
                                        <span>Verdict</span>
                                    </div>
                                    <div className={`text-left text-lg font-bold ${trendB.verdict === "BUY" ? "text-neon-green" : trendB.verdict === "WATCH" ? "text-red-400" : "text-yellow-400"}`}>
                                        {trendB.verdict}
                                    </div>
                                </div>
                            </div>

                            {/* Try Another Button */}
                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        setSelectedMatchup(null);
                                        setTrendA({ ...emptyData });
                                        setTrendB({ ...emptyData });
                                    }}
                                    className="px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
                                >
                                    ← Try Another Matchup
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error States */}
                {selectedMatchup && (trendA.error || trendB.error) && !trendA.loading && !trendB.loading && (
                    <div className="text-center py-8">
                        <div className="text-red-400 mb-4">
                            {trendA.error && <div>Error analyzing {trendA.keyword}: {trendA.error}</div>}
                            {trendB.error && <div>Error analyzing {trendB.keyword}: {trendB.error}</div>}
                        </div>
                        <button
                            onClick={() => setSelectedMatchup(null)}
                            className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white transition-all"
                        >
                            Try Another
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
