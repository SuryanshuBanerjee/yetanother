"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, TrendingUp, Clock, Loader2, ArrowRight, Zap, X } from "lucide-react";

interface TrendSuggestion {
    trend: string;
    relevance: string;
    implementation: string;
    momentum: "Rising" | "Peak" | "Stable" | "Declining";
    confidence: number;
}

interface SuggestionsResponse {
    suggestions: TrendSuggestion[];
    summary: string;
    timing: string;
}

interface CampaignTrendSuggesterProps {
    onTrendSelect?: (trend: string) => void;
    onClose?: () => void;
}

export default function CampaignTrendSuggester({ onTrendSelect, onClose }: CampaignTrendSuggesterProps) {
    const [campaign, setCampaign] = useState("");
    const [industry, setIndustry] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [goals, setGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SuggestionsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaign.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await fetch("/api/campaign/suggest-trends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign,
                    industry,
                    targetAudience,
                    goals,
                }),
            });

            if (!res.ok) throw new Error("Failed to get suggestions");

            const data = await res.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const getMomentumColor = (momentum: string) => {
        switch (momentum) {
            case "Rising": return "text-emerald-400";
            case "Peak": return "text-white";
            case "Stable": return "text-white/60";
            case "Declining": return "text-red-400";
            default: return "text-white/50";
        }
    };

    const getMomentumBg = (momentum: string) => {
        switch (momentum) {
            case "Rising": return "bg-emerald-500/20 border-emerald-500/30";
            case "Peak": return "bg-white/20 border-white/30";
            case "Stable": return "bg-white/10 border-white/20";
            case "Declining": return "bg-red-500/20 border-red-500/30";
            default: return "bg-white/10 border-white/20";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-black/90 border border-white/10 rounded-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/90 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Campaign Trend Finder</h2>
                            <p className="text-xs text-white/50">Describe your campaign, get trend suggestions</p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Input Form */}
                    {!results && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Campaign Description - Main Input */}
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Describe Your Campaign *
                                </label>
                                <textarea
                                    value={campaign}
                                    onChange={(e) => setCampaign(e.target.value)}
                                    placeholder="e.g., Launching a new sustainable sneaker line targeting Gen Z, focusing on eco-consciousness and streetwear culture..."
                                    className="w-full h-28 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
                                    required
                                />
                            </div>

                            {/* Optional Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5">
                                        Industry
                                    </label>
                                    <input
                                        type="text"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        placeholder="e.g., Fashion, Tech, Food..."
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1.5">
                                        Target Audience
                                    </label>
                                    <input
                                        type="text"
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        placeholder="e.g., Gen Z, Millennials..."
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1.5">
                                    Campaign Goals
                                </label>
                                <input
                                    type="text"
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                    placeholder="e.g., Brand awareness, Drive sales, Increase engagement..."
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !campaign.trim()}
                                className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Finding Trends...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Get Trend Suggestions
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </form>
                    )}

                    {/* Results */}
                    <AnimatePresence>
                        {results && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Summary */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-white/70" />
                                        <span className="text-xs font-mono text-white/50 uppercase">Strategic Overview</span>
                                    </div>
                                    <p className="text-white/80 text-sm leading-relaxed">{results.summary}</p>
                                </div>

                                {/* Timing */}
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-400">{results.timing}</span>
                                </div>

                                {/* Trend Suggestions */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
                                        Recommended Trends
                                    </h3>
                                    {results.suggestions.map((suggestion, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-white">{suggestion.trend}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${getMomentumBg(suggestion.momentum)} ${getMomentumColor(suggestion.momentum)}`}>
                                                        {suggestion.momentum}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-white/40 font-mono">
                                                    {suggestion.confidence}% match
                                                </div>
                                            </div>

                                            <p className="text-sm text-white/60 mb-3">{suggestion.relevance}</p>

                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
                                                <TrendingUp className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                                                <p className="text-sm text-white/70">{suggestion.implementation}</p>
                                            </div>

                                            {onTrendSelect && (
                                                <button
                                                    onClick={() => onTrendSelect(suggestion.trend)}
                                                    className="mt-3 flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
                                                >
                                                    <span>Analyze this trend</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* New Search Button */}
                                <button
                                    onClick={() => {
                                        setResults(null);
                                        setCampaign("");
                                        setIndustry("");
                                        setTargetAudience("");
                                        setGoals("");
                                    }}
                                    className="w-full py-2.5 border border-white/20 text-white/70 rounded-xl hover:bg-white/5 transition-colors text-sm"
                                >
                                    New Campaign Search
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
