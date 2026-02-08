"use client";

import { motion } from "framer-motion";

interface SentimentBreakdownProps {
    newsSentiment?: string;
    trendDirection?: string;
    weekOverWeekChange?: number;
}

export default function SentimentBreakdown({ newsSentiment, trendDirection, weekOverWeekChange = 0 }: SentimentBreakdownProps) {
    // Derive sentiment percentages from available signals
    let positive = 33;
    let neutral = 34;
    let negative = 33;

    // News sentiment signal
    if (newsSentiment === "positive") {
        positive += 15;
        neutral -= 5;
        negative -= 10;
    } else if (newsSentiment === "negative") {
        negative += 15;
        neutral -= 5;
        positive -= 10;
    } else if (newsSentiment === "mixed") {
        neutral += 10;
        positive -= 5;
        negative -= 5;
    }

    // Trend direction signal
    if (trendDirection === "up" || trendDirection === "rising") {
        positive += 10;
        negative -= 10;
    } else if (trendDirection === "down" || trendDirection === "falling") {
        negative += 10;
        positive -= 10;
    }

    // WoW change signal
    if (weekOverWeekChange > 10) {
        positive += 8;
        neutral -= 4;
        negative -= 4;
    } else if (weekOverWeekChange > 0) {
        positive += 4;
        neutral -= 2;
        negative -= 2;
    } else if (weekOverWeekChange < -10) {
        negative += 8;
        neutral -= 4;
        positive -= 4;
    } else if (weekOverWeekChange < 0) {
        negative += 4;
        neutral -= 2;
        positive -= 2;
    }

    // Normalize to 100%
    const total = positive + neutral + negative;
    positive = Math.round((positive / total) * 100);
    negative = Math.round((negative / total) * 100);
    neutral = 100 - positive - negative;

    const dominantSentiment = positive >= negative && positive >= neutral
        ? "Positive"
        : negative >= positive && negative >= neutral
            ? "Negative"
            : "Neutral";

    const dominantColor = dominantSentiment === "Positive"
        ? "text-green-400"
        : dominantSentiment === "Negative"
            ? "text-red-400"
            : "text-yellow-400";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
        >
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-bold text-white">Sentiment Breakdown</h3>
                    <p className="text-xs text-white/40">Derived from news, trend direction, and momentum signals</p>
                </div>
                <span className={`text-sm font-bold ${dominantColor}`}>
                    {dominantSentiment}
                </span>
            </div>

            {/* Stacked bar */}
            <div className="h-6 w-full rounded-full overflow-hidden flex bg-white/5 mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${positive}%` }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="h-full bg-green-500 flex items-center justify-center"
                >
                    {positive >= 15 && (
                        <span className="text-[10px] font-bold text-white">{positive}%</span>
                    )}
                </motion.div>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${neutral}%` }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="h-full bg-yellow-500/70 flex items-center justify-center"
                >
                    {neutral >= 15 && (
                        <span className="text-[10px] font-bold text-white">{neutral}%</span>
                    )}
                </motion.div>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${negative}%` }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="h-full bg-red-500 flex items-center justify-center"
                >
                    {negative >= 15 && (
                        <span className="text-[10px] font-bold text-white">{negative}%</span>
                    )}
                </motion.div>
            </div>

            {/* Legend */}
            <div className="flex justify-between text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-white/60">Positive</span>
                    <span className="text-green-400 font-mono font-bold">{positive}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-yellow-500/70" />
                    <span className="text-white/60">Neutral</span>
                    <span className="text-yellow-400 font-mono font-bold">{neutral}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-white/60">Negative</span>
                    <span className="text-red-400 font-mono font-bold">{negative}%</span>
                </div>
            </div>
        </motion.div>
    );
}
