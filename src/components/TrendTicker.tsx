"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendItem {
    name: string;
    symbol: string;
    change: number;
    isUp: boolean;
}

const mockTrends: TrendItem[] = [
    { name: "Quiet Luxury", symbol: "#QLUX", change: 12.4, isUp: true },
    { name: "AI Art", symbol: "#AIART", change: -3.2, isUp: false },
    { name: "Clean Girl", symbol: "#CLNGRL", change: 8.7, isUp: true },
    { name: "Mob Wife", symbol: "#MOBWF", change: 24.1, isUp: true },
    { name: "Vanilla Girl", symbol: "#VNLA", change: -1.8, isUp: false },
    { name: "Coquette", symbol: "#CQTE", change: 15.3, isUp: true },
    { name: "Cottagecore", symbol: "#CTGCR", change: -5.4, isUp: false },
    { name: "Dark Academia", symbol: "#DKACA", change: 2.1, isUp: true },
    { name: "Coastal Gran", symbol: "#CSTGR", change: -8.2, isUp: false },
    { name: "Dopamine Dress", symbol: "#DPDRSS", change: 18.9, isUp: true },
];

export default function TrendTicker() {
    // Duplicate for seamless loop
    const items = [...mockTrends, ...mockTrends];

    return (
        <div className="w-full overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur-sm">
            <motion.div
                className="flex gap-8 py-3"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {items.map((trend, i) => (
                    <div
                        key={`${trend.symbol}-${i}`}
                        className="flex items-center gap-3 shrink-0 px-4"
                    >
                        <span className="font-mono text-xs text-white/50">{trend.symbol}</span>
                        <span className="text-sm text-white font-medium">{trend.name}</span>
                        <div
                            className={`flex items-center gap-1 text-sm font-mono ${trend.isUp ? "text-green-400" : "text-red-400"
                                }`}
                        >
                            {trend.isUp ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{trend.isUp ? "+" : ""}{trend.change.toFixed(1)}%</span>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
