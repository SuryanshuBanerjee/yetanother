"use client";

import { useState } from "react";
import { Sliders, RefreshCw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Simulator({ initialProbability }: { initialProbability: number }) {
    const [novelty, setNovelty] = useState(0);
    const [influencer, setInfluencer] = useState(0);
    const [controversy, setControversy] = useState(0);

    // Simple client-side simulation logic
    // Each lever reduces the collapse probability
    const simulatedProb = Math.max(5, Math.floor(initialProbability - (novelty * 0.4) - (influencer * 0.3) - (controversy * 0.2)));

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <Sliders className="w-5 h-5 text-neon-blue" />
                <h2 className="text-xl font-bold">Revival Simulator</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-mono uppercase text-white/50 mb-2 block flex justify-between">
                            <span>Inject Novel Content</span>
                            <span className="text-neon-blue">+{novelty}%</span>
                        </label>
                        <input
                            type="range" min="0" max="100" value={novelty} onChange={(e) => setNovelty(Number(e.target.value))}
                            className="w-full accent-neon-blue h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-mono uppercase text-white/50 mb-2 block flex justify-between">
                            <span>Re-engage Top Creators</span>
                            <span className="text-neon-purple">+{influencer}%</span>
                        </label>
                        <input
                            type="range" min="0" max="100" value={influencer} onChange={(e) => setInfluencer(Number(e.target.value))}
                            className="w-full accent-neon-purple h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-mono uppercase text-white/50 mb-2 block flex justify-between">
                            <span>Neutralize Controversy</span>
                            <span className="text-sludge-green">+{controversy}%</span>
                        </label>
                        <input
                            type="range" min="0" max="100" value={controversy} onChange={(e) => setControversy(Number(e.target.value))}
                            className="w-full accent-sludge-green h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={() => { setNovelty(0); setInfluencer(0); setControversy(0); }}
                        className="text-xs flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Reset Simulation
                    </button>
                </div>

                {/* Results */}
                <div className="bg-black/40 rounded-xl p-6 border border-white/5 flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="text-center z-10">
                        <div className="text-sm text-white/40 mb-2">New Collapse Probability</div>
                        <motion.div
                            key={simulatedProb}
                            initial={{ scale: 1.2, color: "#fff" }}
                            animate={{ scale: 1, color: simulatedProb > 50 ? "#ff2a6d" : "#39ff14" }}
                            className="text-5xl font-bold font-mono"
                        >
                            {simulatedProb}%
                        </motion.div>

                        <div className="mt-4 flex items-center gap-2 justify-center text-xs text-white/60">
                            <span>Original: {initialProbability}%</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-green-400">-{initialProbability - simulatedProb}% Risk</span>
                        </div>
                    </div>

                    {/* Background Viz */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/50 to-transparent pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
