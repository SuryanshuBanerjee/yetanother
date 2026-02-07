"use client";

import { GhostMarketData } from "@/lib/decayEngine";
import { Warehouse, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";

const riskColors = {
    Low: "text-neon-green border-neon-green/30",
    Medium: "text-yellow-400 border-yellow-400/30",
    High: "text-orange-500 border-orange-500/30",
    Critical: "text-decay-red border-decay-red/30 animate-pulse"
};

export default function GhostMarket({ data }: { data: GhostMarketData }) {
    if (!data.lagWarning) {
        return (
            <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                    <Warehouse className="w-5 h-5 text-neon-green" />
                    <h3 className="font-bold text-white">Ghost Market</h3>
                </div>
                <div className="text-center py-8">
                    <div className="text-4xl font-bold text-neon-green mb-2">$0</div>
                    <p className="text-xs text-white/40">No Corporate Lag Detected</p>
                    <p className="text-xs text-white/60 mt-2">Major retailers have not invested in this trend.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl bg-surface-1/50 border backdrop-blur-md ${riskColors[data.riskLevel]}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5" />
                    <h3 className="font-bold text-white">Ghost Market Liquidity</h3>
                </div>
                <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded border ${riskColors[data.riskLevel]}`}>
                    {data.riskLevel} RISK
                </span>
            </div>

            {/* Trapped Capital */}
            <div className="text-center py-4 mb-4 bg-black/40 rounded-xl border border-white/5">
                <div className="flex items-center justify-center gap-1 text-decay-red">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-5xl font-bold">{data.trappedCapital.replace('$', '')}</span>
                </div>
                <p className="text-xs text-white/40 mt-1">Estimated Trapped Capital</p>
            </div>

            {/* Corporate Lag Alert */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-decay-red/10 border border-decay-red/20 mb-4">
                <AlertTriangle className="w-4 h-4 text-decay-red mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-decay-red">CORPORATE LAG CRISIS</p>
                    <p className="text-xs text-white/60 mt-1">
                        Major retailers are releasing products for a dying trend. Unsold inventory imminent.
                    </p>
                </div>
            </div>

            {/* Retailer List */}
            <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase text-white/40">Affected Retailers</p>
                {data.retailers.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                        <div>
                            <span className="text-sm font-bold text-white">{r.name}</span>
                            <span className="text-xs text-white/40 ml-2">{r.product}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/50">
                            <Clock className="w-3 h-3" />
                            <span>+{r.lagDays}d behind</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
