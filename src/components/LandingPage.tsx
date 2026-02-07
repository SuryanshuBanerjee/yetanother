"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [searchText, setSearchText] = useState("");
    const phrases = ["#QuietLuxury", "#AIArt", "#SustainableFashion", "#VanLife"];

    // Typewriter effect
    useEffect(() => {
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                setSearchText(currentPhrase.substring(0, charIndex - 1));
                charIndex--;
            } else {
                setSearchText(currentPhrase.substring(0, charIndex + 1));
                charIndex++;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                setTimeout(() => { isDeleting = true; }, 1500);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
        };

        const timer = setInterval(type, isDeleting ? 50 : 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                background: `linear-gradient(135deg, 
          rgba(0, 240, 255, 0.15) 0%, 
          rgba(5, 5, 5, 1) 35%,
          rgba(5, 5, 5, 1) 65%,
          rgba(189, 0, 255, 0.15) 100%
        )`,
            }}
        >
            {/* Grain Overlay */}
            <div className="grain-overlay fixed inset-0 pointer-events-none z-[100]" />

            {/* HUD Container */}
            <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                className="relative w-[92vw] h-[88vh] rounded-2xl overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(15, 15, 25, 0.5))",
                    backdropFilter: "blur(20px)",
                    border: "1px solid transparent",
                    backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(15, 15, 25, 0.5)), 
                            linear-gradient(135deg, rgba(0, 240, 255, 0.4), rgba(189, 0, 255, 0.4))`,
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                }}
            >
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-purple-500/50 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-purple-500/50 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-400/50 rounded-br-2xl" />

                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                        <span className="text-sm font-mono text-white/60">TREND PRISM v2.0</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            ONLINE
                        </span>
                        <span>2026.02.07</span>
                    </div>
                </div>

                {/* Main Title */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.h1
                        className="text-[10vw] font-black tracking-tighter leading-none text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <span
                            className="block"
                            style={{
                                color: "transparent",
                                WebkitTextStroke: "2px rgba(0, 240, 255, 0.7)",
                            }}
                        >
                            TREND
                        </span>
                        <span
                            className="block bg-clip-text text-transparent"
                            style={{
                                backgroundImage: "linear-gradient(135deg, #00f0ff, #bd00ff)",
                                textShadow: "0 0 60px rgba(189, 0, 255, 0.4)",
                            }}
                        >
                            PRISM
                        </span>
                    </motion.h1>

                    <motion.p
                        className="mt-4 text-white/50 text-lg font-light tracking-wide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Public Reaction & Insights Social Monitor
                    </motion.p>
                </div>

                {/* Rotating Cube */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20vw] max-w-[280px] opacity-30 pointer-events-none"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                    <Image
                        src="/cube.svg"
                        alt="Holographic Cube"
                        width={280}
                        height={280}
                        className="w-full h-auto"
                        priority
                    />
                </motion.div>

                {/* Bottom Action Area */}
                <div className="absolute bottom-12 left-0 right-0 px-8">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        {/* Search Preview */}
                        <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span className="text-white/70 font-medium min-w-[180px]">
                                {searchText}<span className="animate-pulse text-cyan-400">|</span>
                            </span>
                        </div>

                        {/* Get Started Button */}
                        <motion.button
                            onClick={onStart}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-3 font-bold uppercase tracking-wider rounded-xl transition-all duration-300 pointer-events-auto"
                            style={{
                                background: "linear-gradient(135deg, #00f0ff, #bd00ff)",
                                boxShadow: "0 0 30px rgba(0, 240, 255, 0.3), 0 0 60px rgba(189, 0, 255, 0.2)",
                            }}
                        >
                            Get Started
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
