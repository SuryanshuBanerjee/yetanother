"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Loader2 } from "lucide-react";

interface TrendStock {
    id: string;
    name: string;
    symbol: string;
    score: number;
    change: number;
    volume: string;
    risk: "low" | "medium" | "high" | "critical";
    category: string;
}

const riskColors: Record<string, string> = {
    low: "text-green-400 bg-green-400/10",
    medium: "text-yellow-400 bg-yellow-400/10",
    high: "text-red-400 bg-red-400/10",
    critical: "text-red-500 bg-red-500/10",
};

interface TrendingStocksProps {
    onStockClick?: (keyword: string) => void;
}

export default function TrendingStocks({ onStockClick }: TrendingStocksProps) {
    const [stocks, setStocks] = useState<TrendStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLiveData, setHasLiveData] = useState(false);

    useEffect(() => {
        // Fetch from database (now seeded from CSV) and Google Trends
        Promise.all([
            fetch("/api/trends/database").then(r => r.json()).catch(() => ({ stocks: [] })),
            fetch("/api/trends/trending").then(r => r.json()).catch(() => ({ stocks: [] })),
        ]).then(([dbData, trendingData]) => {
            const dbStocks = dbData.stocks || [];
            const googleStocks = trendingData.stocks || [];

            // Merge: DB stocks first (CSV-seeded + user searches), then Google trending
            const merged = [
                ...dbStocks,
                ...googleStocks.filter(
                    (g: TrendStock) => !dbStocks.some((d: TrendStock) => d.name.toLowerCase() === g.name.toLowerCase())
                ),
            ].slice(0, 12);

            setStocks(merged);
            setHasLiveData(merged.length > 0);
            setIsLoading(false);
        });
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-neon-blue" />
                        Loading Trends...
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="hud-card p-4 animate-pulse">
                            <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
                            <div className="h-6 bg-white/10 rounded w-2/3 mb-3"></div>
                            <div className="h-8 bg-white/10 rounded w-1/2 mb-3"></div>
                            <div className="flex justify-between">
                                <div className="h-4 bg-white/10 rounded w-1/4"></div>
                                <div className="h-4 bg-white/10 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-neon-blue" />
                    {hasLiveData ? "Trending Now" : "No Trends Available"}
                </h2>
                <span className="text-xs font-mono text-white/40">
                    {hasLiveData ? `${stocks.length} trends • Click to analyze` : "Search for a trend to get started"}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stocks.map((stock, i) => (
                    <motion.div
                        key={stock.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onStockClick?.(stock.name)}
                        className="hud-card p-4 hover:border-white/20 transition-all cursor-pointer group"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="text-xs font-mono text-neon-blue">{stock.symbol}</span>
                                <h3 className="text-white font-semibold group-hover:text-neon-blue transition-colors">
                                    {stock.name}
                                </h3>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                                {stock.category}
                            </span>
                        </div>

                        {/* Score */}
                        <div className="flex items-end gap-2 mb-3">
                            <span className="text-2xl font-bold text-white">{stock.score}</span>
                            <div
                                className={`flex items-center gap-1 text-sm font-mono ${stock.change >= 0 ? "text-green-400" : "text-red-400"
                                    }`}
                            >
                                {stock.change >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{stock.change >= 0 ? "+" : ""}{stock.change}%</span>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-white/50">
                                <Activity className="w-3 h-3" />
                                <span>{stock.volume}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${riskColors[stock.risk] || riskColors.medium}`}>
                                <AlertTriangle className="w-3 h-3" />
                                <span className="capitalize">{stock.risk}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
