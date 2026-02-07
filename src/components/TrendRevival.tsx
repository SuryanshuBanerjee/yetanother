"use client";

import { useState } from "react";
import { Sparkles, RefreshCcw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Pivot {
    title: string;
    strategy: string;
}

export default function TrendRevival({ keyword, phase }: { keyword: string, phase: string }) {
    const [pivots, setPivots] = useState<Pivot[] | null>(null);
    const [loading, setLoading] = useState(false);

    const generatePlaybook = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/trends/revival", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword, phase }),
            });
            const data = await res.json();
            if (data.pivots) {
                setPivots(data.pivots);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 relative overflow-hidden h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <span className="text-xs uppercase text-white/40 tracking-widest font-mono mb-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-neon-blue" /> AI Playbook
                    </span>
                    <h3 className="text-xl font-bold text-white">Revival Protocols</h3>
                </div>

                <button
                    onClick={generatePlaybook}
                    disabled={loading}
                    className="px-4 py-2 bg-white/5 hover:bg-neon-purple hover:text-white border border-white/10 rounded-lg text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {loading ? "Synthesizing..." : "Generate Pivots"}
                </button>
            </div>

            <div className="flex-1 space-y-4">
                {!pivots && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm text-center p-8 border border-dashed border-white/10 rounded-xl">
                        <Sparkles className="w-8 h-8 mb-3 opacity-50" />
                        Click to generate AI-driven strategies to monetize this dying trend.
                    </div>
                )}

                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 w-full bg-white/5 animate-pulse rounded-lg" />
                        ))}
                    </div>
                )}

                {pivots && pivots.map((pivot, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-neon-purple/30 group transition-all"
                    >
                        <h4 className="text-neon-blue font-mono text-sm mb-1 group-hover:text-neon-purple transition-colors flex items-center gap-2">
                            0{idx + 1} // {pivot.title}
                        </h4>
                        <p className="text-white/70 text-sm leading-relaxed">
                            {pivot.strategy}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Decor */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 bg-neon-purple/20 blur-3xl rounded-full" />
        </div>
    );
}

// Icon helper
function Zap({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    )
}
