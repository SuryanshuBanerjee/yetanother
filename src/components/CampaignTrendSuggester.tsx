"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, TrendingUp, ArrowRight, Zap, X, BarChart3, Share2 } from "lucide-react";

interface TrendSuggestion {
    name: string;
    platform: string;
    phase: "Rising" | "Peak" | "Stabilizing";
    score: number;
    reason: string;
    execution: string;
}

interface SuggestionsResponse {
    strategic_angle: string;
    recommended_trends: TrendSuggestion[];
}

interface CampaignTrendSuggesterProps {
    onTrendSelect?: (trend: string) => void;
    onClose?: () => void;
}

export default function CampaignTrendSuggester({ onTrendSelect, onClose }: CampaignTrendSuggesterProps) {
    const [campaign, setCampaign] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SuggestionsResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaign.trim()) return;

        setLoading(true);
        setResults(null);

        try {
            const res = await fetch("/api/campaign/suggest-trends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaign }),
            });
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Campaign Catalyst</h2>
                            <p className="text-xs text-white/50">AI-Powered Trend Matching</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    )}
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!results ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">What are you promoting?</label>
                                <textarea
                                    value={campaign}
                                    onChange={(e) => setCampaign(e.target.value)}
                                    placeholder="e.g. Launching a cyberpunk-themed energy drink for gamers..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !campaign.trim()}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Analyzing Viral Patterns...</span>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Find Viral Angles
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-8">
                            {/* Strategy Header */}
                            <div className="text-center space-y-2">
                                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Strategic Angle</span>
                                <h3 className="text-2xl font-bold text-white leading-tight">
                                    "{results.strategic_angle}"
                                </h3>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.recommended_trends.map((trend, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-all"
                                    >
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${trend.phase === 'Rising' ? 'text-emerald-400 border-emerald-500/30' :
                                                    trend.phase === 'Peak' ? 'text-white border-white/30' : 'text-orange-400 border-orange-500/30'
                                                }`}>
                                                {trend.phase}
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                                                <Share2 className="w-3 h-3" /> {trend.platform}
                                            </div>
                                            <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                                                {trend.name}
                                            </h4>
                                        </div>

                                        <div className="space-y-3 mb-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${trend.score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-emerald-400">{trend.score}/100</span>
                                            </div>

                                            <p className="text-sm text-white/60 leading-relaxed">
                                                {trend.reason}
                                            </p>

                                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-2 text-xs text-white/40 mb-1 uppercase tracking-wide">
                                                    <Zap className="w-3 h-3" /> Execution
                                                </div>
                                                <p className="text-sm text-white/90 font-medium">
                                                    {trend.execution}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onTrendSelect?.(trend.name)}
                                            className="w-full py-2.5 flex items-center justify-center gap-2 rounded-lg border border-white/10 text-white/70 hover:bg-white hover:text-black transition-all text-sm font-medium"
                                        >
                                            Analyze Trend <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={() => setResults(null)}
                                className="w-full py-3 text-sm text-white/40 hover:text-white transition-colors"
                            >
                                Start New Search
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
