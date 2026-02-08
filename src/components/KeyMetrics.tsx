"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, Zap, Globe, Target, Clock } from "lucide-react";
import { METRIC_EMPHASIS, METRIC_DESCRIPTIONS } from "@/lib/role-config";

interface Metrics {
    currentInterest: number;
    peakInterest: number;
    averageInterest: number;
    trendDirection: string;
    weekOverWeekChange: number;
    monthOverMonthChange: number;
    volatility: number;
    daysFromPeak: number;
    consistencyScore: number;
}

interface KeyMetricsProps {
    metrics: Metrics;
    topRegions?: { name: string; value: number }[];
    category?: string;
    userRole?: string;
}

const MetricCard = ({
    label,
    value,
    subValue,
    icon: Icon,
    trend,
    delay = 0,
    description,
    emphasized = false,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    trend?: "up" | "down" | "neutral";
    delay?: number;
    description?: string;
    emphasized?: boolean;
}) => (
    <motion.div
        title={description}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`p-4 rounded-xl border bg-gradient-to-br from-white/5 to-transparent hover:border-white/20 transition-colors ${emphasized ? "border-l-2 border-white/60 shadow-[0_0_12px_rgba(0,240,255,0.08)]" : "border-white/10"}`}
    >
        <div className="flex items-start justify-between mb-2">
            <Icon className="w-4 h-4 text-white/40" />
            {trend && (
                <span
                    className={`text-xs font-mono ${trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-white/40"
                        }`}
                >
                    {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </span>
            )}
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/50 mt-1">{label}</div>
        {subValue && <div className="text-xs text-white/30 mt-0.5">{subValue}</div>}
    </motion.div>
);

export default function KeyMetrics({ metrics, topRegions = [], category = "General", userRole = "general-user" }: KeyMetricsProps) {
    const getTrend = (value: number): "up" | "down" | "neutral" => {
        if (value > 5) return "up";
        if (value < -5) return "down";
        return "neutral";
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${value.toFixed(1)}%`;
    };

    const emphSet = new Set(METRIC_EMPHASIS[userRole] || METRIC_EMPHASIS["general-user"]);
    const descs = METRIC_DESCRIPTIONS[userRole] || METRIC_DESCRIPTIONS["general-user"];

    return (
        <div className="space-y-4">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard
                    label="Current Interest"
                    value={`${metrics.currentInterest}/100`}
                    icon={BarChart3}
                    trend={getTrend(metrics.weekOverWeekChange)}
                    delay={0}
                    description={descs["Current Interest"]}
                    emphasized={emphSet.has("Current Interest")}
                />
                <MetricCard
                    label="Peak Interest"
                    value={`${metrics.peakInterest}/100`}
                    subValue={`${metrics.daysFromPeak}d ago`}
                    icon={Target}
                    delay={0.05}
                    description={descs["Peak Interest"]}
                    emphasized={emphSet.has("Peak Interest")}
                />
                <MetricCard
                    label="Week Change"
                    value={formatPercent(metrics.weekOverWeekChange)}
                    icon={TrendingUp}
                    trend={getTrend(metrics.weekOverWeekChange)}
                    delay={0.1}
                    description={descs["Week Change"]}
                    emphasized={emphSet.has("Week Change")}
                />
                <MetricCard
                    label="Month Change"
                    value={formatPercent(metrics.monthOverMonthChange)}
                    icon={TrendingDown}
                    trend={getTrend(metrics.monthOverMonthChange)}
                    delay={0.15}
                    description={descs["Month Change"]}
                    emphasized={emphSet.has("Month Change")}
                />
                <MetricCard
                    label="Volatility"
                    value={`${metrics.volatility.toFixed(1)}%`}
                    subValue={metrics.volatility > 40 ? "High" : metrics.volatility > 20 ? "Medium" : "Low"}
                    icon={Zap}
                    delay={0.2}
                    description={descs["Volatility"]}
                    emphasized={emphSet.has("Volatility")}
                />
                <MetricCard
                    label="Consistency"
                    value={`${metrics.consistencyScore}/100`}
                    subValue="Above 50% threshold"
                    icon={Clock}
                    delay={0.25}
                    description={descs["Consistency"]}
                    emphasized={emphSet.has("Consistency")}
                />
            </div>

            {/* Secondary Row: Category & Top Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-white/40" />
                        <span className="text-xs text-white/50">Category</span>
                    </div>
                    <div className="text-lg font-bold text-white">{category}</div>
                    <div className="text-xs text-white/40 mt-1">
                        Direction: <span className="text-neon-blue capitalize">{metrics.trendDirection}</span>
                    </div>
                </motion.div>

                {/* Top Regions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-white/40" />
                        <span className="text-xs text-white/50">Top Regions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {topRegions.slice(0, 5).map((region, i) => (
                            <span
                                key={region.name}
                                className="px-2 py-1 text-xs rounded border border-white/10 bg-white/5"
                            >
                                {region.name} <span className="text-neon-blue">{region.value}</span>
                            </span>
                        ))}
                        {topRegions.length === 0 && <span className="text-xs text-white/40">No regional data</span>}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
