"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Share2 } from "lucide-react";
import ExportButton from "./ExportButton";
import CandlestickChart from "./CandlestickChart";
import KeyMetrics from "./KeyMetrics";
import ProsCons from "./ProsCons";
import SimilarTrends from "./SimilarTrends";
import TrendTriade from "./TrendTriade";
import VelocityGauges from "./VelocityGauges";
import ActionItems from "./ActionItems";
import MetricsHistoryChart from "./MetricsHistoryChart";
import NewsHeadlines from "./NewsHeadlines";
import SentimentBreakdown from "./SentimentBreakdown";
import DecayTimeline from "./DecayTimeline";
import { SECTION_ORDER, type SectionId } from "@/lib/role-config";

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
            trendTriade?: {
                communityFragmentation: { score: number; indicators: string[]; detail: string };
                semanticSaturation: { score: number; indicators: string[]; detail: string };
                commercialExhaustion: { score: number; indicators: string[]; detail: string };
            };
            deltaVelocity?: number | { value: number; label: string; detail: string };
            peakWidth?: number | { days: number; label: string; detail: string };
            decayHalfLife?: number | { days: number; label: string; detail: string };
            regionalSkew?: {
                concentration?: number;
                dominantRegion?: string;
                isGlobal?: boolean;
            };
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
            actionItems?: string[];
            opportunityWindow?: string;
        };
        // Metrics History
        metricsHistory?: {
            date: string;
            entropy?: number;
            modularity?: number;
            clustering?: number;
            volume?: number;
        }[];
        // News
        newsHeadlines?: string[];
        newsArticles?: { title: string; description: string; source: string; date: string }[];
        newsSentiment?: string;
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
        metricsHistory,
        newsHeadlines,
        newsArticles,
        newsSentiment,
    } = data;

    const category = validation?.category || "General";
    const metrics = basicMetrics?.metrics;
    const interestOverTime = basicMetrics?.interestOverTime || [];
    const topRegions = basicMetrics?.topRegions || [];
    const relatedQueries = basicMetrics?.relatedQueries || { top: [], rising: [] };

    const phase = advancedInferences?.phase || data.phase || "Unknown";
    const weekChange = metrics?.weekOverWeekChange || 0;

    // Extract numeric values from advanced inferences (API returns objects like {value, label, detail})
    const deltaVelocityNum = advancedInferences?.deltaVelocity == null ? undefined
        : typeof advancedInferences.deltaVelocity === "object" ? advancedInferences.deltaVelocity.value
            : advancedInferences.deltaVelocity;
    const peakWidthNum = advancedInferences?.peakWidth == null ? undefined
        : typeof advancedInferences.peakWidth === "object" ? advancedInferences.peakWidth.days
            : advancedInferences.peakWidth;
    const decayHalfLifeNum = advancedInferences?.decayHalfLife == null ? undefined
        : typeof advancedInferences.decayHalfLife === "object" ? advancedInferences.decayHalfLife.days
            : advancedInferences.decayHalfLife;
    const isUp = weekChange >= 0;

    const verdictText = verdict?.verdict || (data.healthScore && data.healthScore > 60 ? "NOT ANYTIME SOON" : data.healthScore && data.healthScore > 40 ? "INEVITABLE DECLINE" : "DECLINING");
    const summaryText = basicMetrics?.llmInterpretation || advancedInferences?.llmAnalysis || data.summary || verdict?.summary || "";
    const deepAnalysis = advancedInferences?.llmAnalysis && verdict?.summary && advancedInferences.llmAnalysis !== verdict.summary
        ? advancedInferences.llmAnalysis
        : null;

    // Build section map — each section only renders if it has data
    const sectionMap: Record<SectionId, ReactNode> = {
        Chart: interestOverTime.length > 0 ? (
            <div id="trend-chart-candlestick">
                <CandlestickChart data={interestOverTime} keyword={keyword} userRole={userRole} aiExplanation={basicMetrics?.llmInterpretation} />
            </div>
        ) : null,

        KeyMetrics: metrics ? (
            <KeyMetrics metrics={metrics} topRegions={topRegions} category={category} userRole={userRole} />
        ) : null,

        ActionItems: verdict?.actionItems && verdict.actionItems.length > 0 ? (
            <div id="action-items-section">
                <ActionItems
                    actionItems={verdict.actionItems}
                    timeHorizon={verdict.timeHorizon}
                    opportunityWindow={verdict.opportunityWindow}
                    userRole={userRole}
                />
            </div>
        ) : null,

        ProsCons: (
            <ProsCons
                pros={verdict?.pros || []}
                cons={verdict?.cons || []}
                verdict={verdictText}
                confidence={verdict?.confidence}
                userRole={userRole}
                summary={verdict?.summary}
                hasActionItems={!!verdict?.actionItems && verdict.actionItems.length > 0}
            />
        ),

        Triade: advancedInferences?.trendTriade ? (
            <div id="trend-chart-triade">
                <TrendTriade trendTriade={advancedInferences.trendTriade} userRole={userRole} />
            </div>
        ) : null,

        Velocity: (deltaVelocityNum != null || peakWidthNum != null || decayHalfLifeNum != null || advancedInferences?.regionalSkew) ? (
            <VelocityGauges
                deltaVelocity={deltaVelocityNum}
                peakWidth={peakWidthNum}
                decayHalfLife={decayHalfLifeNum}
                regionalSkew={advancedInferences?.regionalSkew}
            />
        ) : null,

        DecayTimeline: (
            <DecayTimeline
                phase={phase}
                collapseProbability={advancedInferences?.collapseProbability || 50}
                velocity={advancedInferences?.velocity || "Stable"}
                healthScore={data.healthScore || 50}
            />
        ),

        MetricsHistory: metricsHistory && metricsHistory.length > 0 ? (
            <div id="trend-chart-metrics-history">
                <MetricsHistoryChart metricsHistory={metricsHistory} userRole={userRole} />
            </div>
        ) : null,

        About: summaryText ? (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
            >
                <h3 className="text-lg font-bold text-white mb-3">About</h3>
                <p className="text-white/70 leading-relaxed">{summaryText}</p>
                {deepAnalysis && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-white mb-2">AI Deep Analysis</h4>
                        <p className="text-white/60 text-sm leading-relaxed">{deepAnalysis}</p>
                    </div>
                )}
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
        ) : null,

        News: newsHeadlines && newsHeadlines.length > 0 ? (
            <NewsHeadlines headlines={newsHeadlines} articles={newsArticles} sentiment={newsSentiment} />
        ) : null,

        Sentiment: (
            <SentimentBreakdown
                newsSentiment={newsSentiment}
                trendDirection={metrics?.trendDirection}
                weekOverWeekChange={metrics?.weekOverWeekChange}
            />
        ),

        SimilarTrends: (
            <SimilarTrends
                trends={relatedQueries.top || []}
                rising={relatedQueries.rising || []}
                onTrendClick={onRelatedTrendClick}
                userRole={userRole}
            />
        ),
    };

    // Get section order for current role, fallback to general-user
    const orderedSections = SECTION_ORDER[userRole] || SECTION_ORDER["general-user"];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header Section - Screener style (pinned, outside dynamic ordering) */}
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
                    <ExportButton data={data} userRole={userRole} />
                </div>
            </motion.div>

            {/* Dynamic Section Ordering Based on Role */}
            {orderedSections.map((sectionId, index) => {
                const section = sectionMap[sectionId];
                if (!section) return null;
                return (
                    <motion.div
                        key={sectionId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                    >
                        {section}
                    </motion.div>
                );
            })}

            {/* Footer (pinned, outside dynamic ordering) */}
            <div className="text-center text-xs text-white/30 pt-8 border-t border-white/5 font-mono">
                Generated by TREND PRISM V2.0 • Multi-Model AI Pipeline • Groq + Gemini + Featherless
            </div>
        </motion.div>
    );
}
