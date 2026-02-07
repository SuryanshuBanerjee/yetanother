"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3 } from "lucide-react";

interface TrendStock {
    id: string;
    name: string;
    symbol: string;
    score: number;
    change: number;
    volume: string;
    risk: "low" | "medium" | "high";
    category: string;
}

const mockStocks: TrendStock[] = [
    { id: "1", name: "Quiet Luxury", symbol: "#QLUX", score: 847, change: 12.4, volume: "2.4M", risk: "low", category: "Fashion" },
    { id: "2", name: "AI Art", symbol: "#AIART", score: 623, change: -3.2, volume: "5.1M", risk: "high", category: "Tech" },
    { id: "3", name: "Mob Wife", symbol: "#MOBWF", score: 912, change: 24.1, volume: "1.8M", risk: "medium", category: "Fashion" },
    { id: "4", name: "Dopamine Dressing", symbol: "#DPDRSS", score: 756, change: 18.9, volume: "890K", risk: "low", category: "Fashion" },
    { id: "5", name: "Deinfluencing", symbol: "#DEINFL", score: 534, change: -8.2, volume: "3.2M", risk: "high", category: "Lifestyle" },
    { id: "6", name: "Coquette", symbol: "#CQTE", score: 689, change: 15.3, volume: "1.1M", risk: "low", category: "Fashion" },
    { id: "7", name: "Roman Empire", symbol: "#ROMEMP", score: 421, change: -12.5, volume: "780K", risk: "high", category: "Culture" },
    { id: "8", name: "Girl Dinner", symbol: "#GRLDNR", score: 567, change: 5.7, volume: "2.9M", risk: "medium", category: "Food" },
];

const riskColors = {
    low: "text-green-400 bg-green-400/10",
    medium: "text-yellow-400 bg-yellow-400/10",
    high: "text-red-400 bg-red-400/10",
};

export default function TrendingStocks() {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-neon-blue" />
                    Trending Now
                </h2>
                <span className="text-xs font-mono text-white/40">Updated 2m ago</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockStocks.map((stock, i) => (
                    <motion.div
                        key={stock.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
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
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${riskColors[stock.risk]}`}>
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
