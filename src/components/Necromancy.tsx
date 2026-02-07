"use client";

import { useState } from "react";
import { Skull, Sparkles, Target, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NecromancyPivot {
    targetNiche: string;
    rebrandName: string;
    strategy: string;
    platform: string;
}

const MOCK_PIVOTS: Record<string, NecromancyPivot[]> = {
    default: [
        {
            targetNiche: "ADHD Productivity Community",
            rebrandName: "Kinetic Focus Tools",
            strategy: "Position as a therapeutic sensory tool for neurodivergent professionals. Partner with ADHD coaches on LinkedIn.",
            platform: "LinkedIn"
        },
        {
            targetNiche: "Retro Gaming Collectors",
            rebrandName: "Vintage Tactile Art",
            strategy: "Rebrand as collectible nostalgia items. Limited editions with custom designs. Target millennial collectors.",
            platform: "eBay / Etsy"
        },
        {
            targetNiche: "Corporate Wellness Programs",
            rebrandName: "Desk Decompressors",
            strategy: "Sell in bulk to HR departments as 'stress relief tools' for employee wellness kits.",
            platform: "B2B Direct Sales"
        }
    ]
};

export default function Necromancy({ keyword }: { keyword: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [pivots, setPivots] = useState<NecromancyPivot[] | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleRevive = async () => {
        setIsLoading(true);

        // Simulate AI thinking
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, this would call /api/trends/necromancy
        setPivots(MOCK_PIVOTS.default);
        setHasGenerated(true);
        setIsLoading(false);
    };

    return (
        <div className="p-6 rounded-2xl bg-surface-1/50 border border-neon-purple/20 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Skull className="w-5 h-5 text-neon-purple" />
                    <h3 className="font-bold text-white">Digital Necromancy</h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-neon-purple/10 text-neon-purple/70 border border-neon-purple/20">
                    REVIVAL ENGINE
                </span>
            </div>

            <p className="text-xs text-white/50 mb-6">
                AI-powered cultural pivot suggestions. Resurrect dead trends by finding new niches.
            </p>

            {/* Generate Button */}
            {!hasGenerated && (
                <button
                    onClick={handleRevive}
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30 font-mono text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Cultural Vectors...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Revival Strategies for "{keyword}"
                        </>
                    )}
                </button>
            )}

            {/* Pivots */}
            <AnimatePresence>
                {pivots && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 mt-4"
                    >
                        {pivots.map((pivot, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className="p-4 rounded-lg bg-black/40 border border-neon-purple/10 hover:border-neon-purple/30 transition-colors"
                            >
                                {/* Target Niche */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-neon-blue" />
                                    <span className="text-xs font-mono uppercase text-white/40">Target Niche</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">{pivot.targetNiche}</h4>

                                {/* Rebrand */}
                                <div className="mb-3">
                                    <span className="text-xs text-white/40">Rebrand As: </span>
                                    <span className="text-sm text-neon-purple font-bold">"{pivot.rebrandName}"</span>
                                </div>

                                {/* Strategy */}
                                <p className="text-xs text-white/60 leading-relaxed mb-3">
                                    {pivot.strategy}
                                </p>

                                {/* Platform */}
                                <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-white/50">
                                    📍 {pivot.platform}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Regenerate */}
            {hasGenerated && (
                <button
                    onClick={handleRevive}
                    disabled={isLoading}
                    className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 font-mono text-xs transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Regenerate Strategies
                </button>
            )}
        </div>
    );
}
