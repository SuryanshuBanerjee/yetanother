"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, Network, Lock, Zap } from "lucide-react";

const LOGS = [
    { text: "Initializing ghost protocols...", icon: Lock },
    { text: "Connecting to global neural lattice...", icon: Network },
    { text: "Scraping r/WallStreetBets for sentiment spikes...", icon: Terminal },
    { text: "Analyzing Google Trends decay patterns...", icon: Cpu },
    { text: "Calculating vibe entropy...", icon: Zap },
    { text: "Synthesizing prediction models...", icon: Network },
];

export default function ThinkingUI({ onComplete }: { onComplete: () => void }) {
    const [currentLog, setCurrentLog] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLog((prev) => {
                if (prev >= LOGS.length - 1) {
                    clearInterval(interval);
                    setTimeout(onComplete, 800); // Small delay before finishing
                    return prev;
                }
                return prev + 1;
            });
        }, 800); // Duration per log

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-mono text-neon-blue"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
        >
            <div className="w-full max-w-md px-6">
                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs uppercase tracking-widest text-white/50">System Monitor</span>
                    <span className="animate-pulse text-xs text-neon-green">ONLINE</span>
                </div>

                <div className="h-64 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {LOGS.slice(Math.max(0, currentLog - 3), currentLog + 1).map((log, index) => {
                            const Icon = log.icon;
                            const isLast = index === Math.min(3, currentLog); // Highlight the current active log (which is always at the bottom of the slice)

                            return (
                                <motion.div
                                    key={log.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: isLast ? 1 : 0.5, x: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`flex items-center gap-3 ${isLast ? "text-neon-blue text-glow" : "text-white/40"}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm tracking-wide">{log.text}</span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Loading Bar */}
                <div className="relative mt-8 h-1 w-full overflow-hidden bg-white/10 rounded-full">
                    <motion.div
                        className="absolute inset-0 bg-neon-purple shadow-[0_0_10px_var(--color-brand-purple)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentLog + 1) / LOGS.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-white/30 uppercase">
                    <span>Cpu: 47%</span>
                    <span>Mem: 12GB</span>
                    <span>Net: 1.2Gbps</span>
                </div>
            </div>

            {/* Background Grid Effect */}
            <div className="pointer-events-none absolute inset-0 z-[-1] opacity-20"
                style={{
                    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />
        </motion.div>
    );
}
