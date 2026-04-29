"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendItem {
    name: string;
    symbol: string;
    change: number;
    isUp: boolean;
}

const curatedTrends: TrendItem[] = [
    { name: "Generative AI", symbol: "#GENAI", change: 42.0, isUp: true },
    { name: "NFTs", symbol: "#NFT", change: -67.0, isUp: false },
    { name: "Metaverse", symbol: "#META", change: -54.0, isUp: false },
    { name: "Ozempic", symbol: "#OZM", change: 28.0, isUp: true },
    { name: "Quiet Quitting", symbol: "#QQ", change: -72.0, isUp: false },
    { name: "Web3", symbol: "#WEB3", change: -41.0, isUp: false },
    { name: "Short-Form Video", symbol: "#SFV", change: 19.0, isUp: true },
    { name: "Deinfluencing", symbol: "#DEINF", change: -31.0, isUp: false },
    { name: "Sustainable Fashion", symbol: "#SFASH", change: 14.0, isUp: true },
    { name: "Digital Nomad", symbol: "#DNOM", change: 6.0, isUp: true },
    { name: "Crypto", symbol: "#CRYPTO", change: 33.0, isUp: true },
    { name: "AI Companions", symbol: "#AICMP", change: 47.0, isUp: true },
];

export default function TrendTicker() {
    const [trends] = useState<TrendItem[]>(curatedTrends);

    // Double for infinite scroll effect
    const items = [...trends, ...trends];

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
