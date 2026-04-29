"use client";

import { motion } from "framer-motion";

export default function PrismLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <defs>
                <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2ea" />
                    <stop offset="100%" stopColor="#ff0099" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Main Prism Shape - Geometric Triangle */}
            <path
                d="M50 15 L85 75 L15 75 Z"
                stroke="url(#prismGradient)"
                strokeWidth="6"
                fill="rgba(255, 255, 255, 0.05)"
                style={{ filter: "url(#glow)" }}
            />

            {/* Internal Facet Lines for "Prism" effect */}
            <path
                d="M50 15 L50 45"
                stroke="url(#prismGradient)"
                strokeWidth="3"
                opacity="0.6"
            />
            <path
                d="M50 45 L85 75"
                stroke="url(#prismGradient)"
                strokeWidth="3"
                opacity="0.6"
            />
            <path
                d="M50 45 L15 75"
                stroke="url(#prismGradient)"
                strokeWidth="3"
                opacity="0.6"
            />

            {/* Central Glow Point */}
            <circle cx="50" cy="48" r="4" fill="white" className="animate-pulse" />
        </motion.svg>
    );
}
