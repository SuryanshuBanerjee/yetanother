"use client";

import React from "react";
import { Bot, User } from "lucide-react"; // Assuming 'User' icon exists in lucide-react

export default function SludgeDetector({ sludgeScore }: { sludgeScore: number }) {
    const rotation = (sludgeScore / 100) * 180; // 0-180 degrees mapping

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden group">

            <div className="absolute top-4 left-4 z-10 flex flex-col pointer-events-none">
                <span className="text-xs uppercase text-white/40 tracking-widest font-mono mb-1">Sludge Index</span>
                <span className="text-xs text-sludge-green/80">Synthetic Content Detected</span>
            </div>

            <div className="relative w-48 h-24 mt-8">
                {/* Gauge Background */}
                <div className="absolute bottom-0 left-0 w-full h-full rounded-t-full border-[12px] border-white/5 border-b-0" />

                {/* Gauge Value */}
                <div
                    className="absolute bottom-0 left-0 w-full h-full rounded-t-full border-[12px] border-sludge-green border-b-0 transition-all duration-1000 ease-out origin-bottom"
                    style={{
                        transform: `rotate(${rotation - 180}deg)`,
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" // Masks the rotation to keep semicircle shape
                    }}
                />

                {/* Needle (Simple pointer) */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-24 bg-white origin-bottom transition-transform duration-1000"
                    style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
                >
                    <div className="w-3 h-3 bg-white rounded-full absolute -top-1 left-1/2 -translate-x-1/2 shadow-[0_0_10px_white]" />
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between w-full px-4 text-xs font-mono uppercase tracking-widest text-white/40">
                <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-neon-blue" />
                    <span>Organic</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Synthetic</span>
                    <Bot className="w-3 h-3 text-sludge-green" />
                </div>
            </div>

            <div className="mt-4 text-center">
                <span className="text-3xl font-bold text-white">{sludgeScore}%</span>
                <span className="text-xs text-white/30 ml-2">CONTENT IS "SLUDGE"</span>
            </div>

            {/* Background Grid Effect */}
            <div className="pointer-events-none absolute inset-0 z-[-1] opacity-10"
                style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "10px 10px"
                }}
            />
        </div>
    );
}
