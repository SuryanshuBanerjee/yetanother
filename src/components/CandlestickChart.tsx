"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ROLE_CONTEXT } from "@/lib/role-config";

interface CandlestickData {
    time: string;
    formattedTime: string;
    value: number;
}

interface CandlestickChartProps {
    data: CandlestickData[];
    keyword: string;
    userRole?: string;
}

export default function CandlestickChart({ data, keyword, userRole = "general-user" }: CandlestickChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.slice(-30); // Last 30 days
    }, [data]);

    const maxValue = useMemo(() => Math.max(...chartData.map((d) => d.value), 1), [chartData]);
    const minValue = useMemo(() => Math.min(...chartData.map((d) => d.value), 0), [chartData]);
    const range = maxValue - minValue || 1;

    // Calculate moving averages
    const ma7 = useMemo(() => {
        return chartData.map((_, i) => {
            const start = Math.max(0, i - 6);
            const slice = chartData.slice(start, i + 1);
            return slice.reduce((a, b) => a + b.value, 0) / slice.length;
        });
    }, [chartData]);

    const ma30 = useMemo(() => {
        return chartData.map((_, i) => {
            const slice = chartData.slice(0, i + 1);
            return slice.reduce((a, b) => a + b.value, 0) / slice.length;
        });
    }, [chartData]);

    // Current vs previous for color
    const current = chartData[chartData.length - 1]?.value || 0;
    const previous = chartData[chartData.length - 2]?.value || 0;
    const isUp = current >= previous;

    if (chartData.length === 0) {
        return (
            <div className="rounded-xl p-6 border border-white/10 bg-white/5">
                <p className="text-white/40 text-center">No chart data available</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Popularity Over Time</h3>
                    <p className="text-xs text-white/40 font-mono">Google Trends Interest (0-100)</p>
                    <p className="text-xs text-white/30 mt-1">{(ROLE_CONTEXT[userRole] || ROLE_CONTEXT["general-user"]).chart}</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-neon-blue" />
                        <span className="text-white/50">7-Day MA</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-purple-400" />
                        <span className="text-white/50">30-Day MA</span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-48 mt-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-white/30 font-mono">
                    <span>{maxValue}</span>
                    <span>{Math.round((maxValue + minValue) / 2)}</span>
                    <span>{minValue}</span>
                </div>

                {/* Grid and bars */}
                <div className="ml-10 h-full relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="border-t border-white/5" />
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="absolute inset-0 flex items-end gap-0.5">
                        {chartData.map((point, i) => {
                            const height = ((point.value - minValue) / range) * 100;
                            const prevValue = chartData[i - 1]?.value || point.value;
                            const barIsUp = point.value >= prevValue;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: i * 0.02, duration: 0.3 }}
                                    className="flex-1 rounded-t-sm relative group"
                                    style={{
                                        background: barIsUp
                                            ? "linear-gradient(180deg, #00f0ff 0%, #00f0ff40 100%)"
                                            : "linear-gradient(180deg, #ff2a6d 0%, #ff2a6d40 100%)",
                                        minWidth: "4px",
                                    }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-black/90 border border-white/20 rounded px-2 py-1 text-xs whitespace-nowrap">
                                            <div className="text-white font-bold">{point.value}</div>
                                            <div className="text-white/50">{point.formattedTime}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* MA7 line */}
                    <svg className="absolute inset-0 pointer-events-none overflow-visible">
                        <polyline
                            fill="none"
                            stroke="#00f0ff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={ma7
                                .map((val, i) => {
                                    const x = (i / (chartData.length - 1)) * 100;
                                    const y = 100 - ((val - minValue) / range) * 100;
                                    return `${x}%,${y}%`;
                                })
                                .join(" ")}
                        />
                    </svg>

                    {/* MA30 line */}
                    <svg className="absolute inset-0 pointer-events-none overflow-visible">
                        <polyline
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4 2"
                            points={ma30
                                .map((val, i) => {
                                    const x = (i / (chartData.length - 1)) * 100;
                                    const y = 100 - ((val - minValue) / range) * 100;
                                    return `${x}%,${y}%`;
                                })
                                .join(" ")}
                        />
                    </svg>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="flex justify-between mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                    <span className="text-white/50">Current: </span>
                    <span className={`font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>{current}</span>
                </div>
                <div>
                    <span className="text-white/50">Peak: </span>
                    <span className="font-bold text-white">{maxValue}</span>
                </div>
                <div>
                    <span className="text-white/50">7D Avg: </span>
                    <span className="font-bold text-neon-blue">{Math.round(ma7[ma7.length - 1] || 0)}</span>
                </div>
                <div>
                    <span className="text-white/50">30D Avg: </span>
                    <span className="font-bold text-purple-400">{Math.round(ma30[ma30.length - 1] || 0)}</span>
                </div>
            </div>
        </motion.div>
    );
}
