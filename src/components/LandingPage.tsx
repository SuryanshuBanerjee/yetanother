"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import PrismLogo from "./PrismLogo";

const EMOJI_LIST = ["#", "❤️", "💬", "↗️", "🔥", "✨", "👀", "🔔", "📢", "💭"];

interface Emoji {
    id: number;
    char: string;
    left: number;
}


interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [searchText, setSearchText] = useState("");
    const [emojis, setEmojis] = useState<Emoji[]>([]);
    const phrases = ["#QuietLuxury", "#AIArt", "#SustainableFashion", "#VanLife"];

    // Emoji Spawner
    useEffect(() => {
        const interval = setInterval(() => {
            const newEmoji: Emoji = {
                id: Date.now(),
                char: EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)],
                left: Math.random() * 100, // Random percentage within container
            };
            setEmojis((prev) => [...prev.slice(-15), newEmoji]); // Keep last 15 to prevent memory leak
        }, 400); // New emoji every 400ms

        return () => clearInterval(interval);
    }, []);

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
            {/* Subtle gradient background */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)`
                }}
            />

            {/* HUD Container */}
            <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                className="relative w-[92vw] h-[88vh] rounded-[40px] overflow-hidden"
                style={{
                    background: "linear-gradient(180deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.15)", // Brighter solid border base
                    boxShadow: "0 0 40px rgba(255, 255, 255, 0.05), inset 0 0 80px rgba(255, 255, 255, 0.05)",
                }}
            >
                {/* Illuminated Edge Gradient Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-[40px] z-50"
                    style={{
                        padding: "1px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.4) 100%)",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        opacity: 0.8, // Make it visible
                    }}
                />


                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <PrismLogo className="w-8 h-8" />
                        <span className="text-sm font-mono text-white/60">TREND PRISM</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        </span>
                        <span>2026.02.08</span>
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
                                WebkitTextStroke: "2px rgba(255, 255, 255, 0.3)",
                            }}
                        >
                            TREND
                        </span>
                        <span className="block text-white">
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

                {/* Rotating Cube - Original colors */}
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22vw] max-w-[300px] pointer-events-none"
                    style={{ opacity: 0.4 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                >
                    <Image
                        src="/cube.svg"
                        alt="Holographic Cube"
                        width={300}
                        height={300}
                        className="w-full h-auto"
                        priority
                    />
                </motion.div>

                {/* Bottom Action Area */}
                <div className="absolute bottom-12 left-0 right-0 px-8">
                    <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                        {/* Emoji Stream */}
                        <div className="absolute left-10 bottom-full w-64 h-64 pointer-events-none overflow-visible">
                            <AnimatePresence>
                                {emojis.map((emoji) => (
                                    <motion.div
                                        key={emoji.id}
                                        initial={{ opacity: 0, y: 20, x: 0, scale: 0.5 }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            y: -200 - Math.random() * 100,
                                            x: (Math.random() - 0.5) * 80,
                                            scale: [0.5, 1.2, 0.8],
                                            rotate: (Math.random() - 0.5) * 45,
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 2 + Math.random(), ease: "easeOut" }}
                                        className="absolute bottom-0 left-8 text-2xl filter drop-shadow-lg"
                                        style={{ left: `${emoji.left}%` }}
                                    >
                                        {emoji.char}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Search Preview */}
                        <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 relative z-10 backdrop-blur-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span className="text-white/70 font-medium min-w-[180px]">
                                {searchText}<span className="animate-pulse text-white">|</span>
                            </span>
                        </div>

                        {/* Get Started Button */}
                        <motion.button
                            onClick={onStart}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-3 font-bold uppercase tracking-wider rounded-xl transition-all duration-300 pointer-events-auto bg-white text-black hover:bg-white/90 relative z-10"
                        >
                            Get Started
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
