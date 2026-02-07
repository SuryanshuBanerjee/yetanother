"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Download, Share2, ExternalLink } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import KeyMetrics from "./KeyMetrics";
import ProsCons from "./ProsCons";
import SimilarTrends from "./SimilarTrends";

interface TrendDashboardProps {
    data: {
        keyword: string;
        // Validation
        validation?: {
            category?: string;
            reason?: string;
            trendName?: string;
        };
        // Basic Metrics
        basicMetrics?: {
            interestOverTime?: { time: string; formattedTime: string; value: number }[];
            topRegions?: { name: string; value: number }[];
            relatedQueries?: {
                top?: { query: string; value: number }[];
                rising?: { query: string; value: number }[];
            };
            metrics?: {
                currentInterest: number;
                peakInterest: number;
                averageInterest: number;
                trendDirection: string;
                weekOverWeekChange: number;
                monthOverMonthChange: number;
                volatility: number;
                daysFromPeak: number;
                consistencyScore: number;
            };
            llmInterpretation?: string;
        };
        // Advanced Inferences
        advancedInferences?: {
            phase?: string;
            velocity?: string;
            overallRiskScore?: number;
            collapseProbability?: number;
            timeToCollapse?: string;
            llmAnalysis?: string;
        };
        // Verdict
        verdict?: {
            pros?: { title: string; detail: string; impact: number }[];
            cons?: { title: string; detail: string; impact: number }[];
            verdict?: string;
            confidence?: number;
            summary?: string;
            timeHorizon?: string;
            riskLevel?: string;
        };
        // Legacy fields for compatibility
        phase?: string;
        summary?: string;
        decayScore?: number;
        healthScore?: number;
    };
    onRelatedTrendClick?: (trend: string) => void;
    userRole?: string;
}

export default function TrendDashboard({ data, onRelatedTrendClick, userRole = "general-user" }: TrendDashboardProps) {
    const {
        keyword,
        validation,
        basicMetrics,
        advancedInferences,
        verdict,
    } = data;

    const category = validation?.category || "General";
    const metrics = basicMetrics?.metrics;
    const interestOverTime = basicMetrics?.interestOverTime || [];
    const topRegions = basicMetrics?.topRegions || [];
    const relatedQueries = basicMetrics?.relatedQueries || { top: [], rising: [] };

    const phase = advancedInferences?.phase || data.phase || "Unknown";
    const weekChange = metrics?.weekOverWeekChange || 0;
    const isUp = weekChange >= 0;

    const verdictText = verdict?.verdict || (data.healthScore && data.healthScore > 60 ? "BUY" : data.healthScore && data.healthScore > 40 ? "HOLD" : "WATCH");
    const summaryText = verdict?.summary || basicMetrics?.llmInterpretation || advancedInferences?.llmAnalysis || data.summary || "";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header Section - Screener style */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-white/10"
            >
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{keyword}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${isUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {isUp ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                            {isUp ? "+" : ""}{weekChange.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/70">{category}</span>
                        <span>Phase: <span className="text-neon-blue">{phase}</span></span>
                        {verdict?.riskLevel && (
                            <span>Risk: <span className={`${verdict.riskLevel === "Critical" ? "text-red-400" : verdict.riskLevel === "High" ? "text-orange-400" : verdict.riskLevel === "Medium" ? "text-yellow-400" : "text-green-400"}`}>{verdict.riskLevel}</span></span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue text-sm transition-colors border border-neon-blue/30">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </motion.div>

            {/* Candlestick Chart */}
            <CandlestickChart data={interestOverTime} keyword={keyword} />

            {/* Key Metrics Grid */}
            {metrics && (
                <KeyMetrics
                    metrics={metrics}
                    topRegions={topRegions}
                    category={category}
                />
            )}

            {/* About Section */}
            {summaryText && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
                >
                    <h3 className="text-lg font-bold text-white mb-3">About</h3>
                    <p className="text-white/70 leading-relaxed">{summaryText}</p>
                    {advancedInferences?.timeToCollapse && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm">
                            <span className="text-white/50">Time Horizon:</span>
                            <span className="text-neon-blue font-mono">{advancedInferences.timeToCollapse}</span>
                            <span className="text-white/50">Collapse Probability:</span>
                            <span className={`font-mono ${(advancedInferences.collapseProbability || 0) > 60 ? "text-red-400" : "text-green-400"}`}>
                                {advancedInferences.collapseProbability}%
                            </span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Pros & Cons */}
            <ProsCons
                pros={verdict?.pros || []}
                cons={verdict?.cons || []}
                verdict={verdictText}
                confidence={verdict?.confidence}
                userRole={userRole}
                summary={verdict?.summary}
            />

            {/* Similar Trends */}
            <SimilarTrends
                trends={relatedQueries.top || []}
                rising={relatedQueries.rising || []}
                onTrendClick={onRelatedTrendClick}
            />

            {/* Footer */}
            <div className="text-center text-xs text-white/30 pt-8 border-t border-white/5 font-mono">
                Generated by TREND PRISM V2.0 • Multi-Model AI Pipeline • Groq + OpenRouter + Featherless
            </div>
        </motion.div>
    );
}
