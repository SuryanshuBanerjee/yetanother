"use client";

import React from "react";
import dynamic from "next/dynamic";
import { DecayAnalysis } from "@/lib/decayEngine";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface VibeEntropyChartProps {
    data: DecayAnalysis["chartData"];
    entropy: number;
}

export default function VibeEntropyChart({ data, entropy }: VibeEntropyChartProps) {
    return (
        <div className="w-full h-[400px] rounded-lg border border-white/10 bg-black/50 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10 flex flex-col">
                <span className="text-xs uppercase text-white/40 tracking-widest font-mono">Entropy Signal</span>
                <span className={`text-2xl font-bold font-mono ${entropy > 70 ? "text-neon-purple animate-pulse" : "text-neon-blue"}`}>
                    {entropy.toFixed(1)}% <span className="text-xs text-white/50">{entropy > 70 ? "CRITIAL" : "NORMAL"}</span>
                </span>
            </div>

            <Plot
                data={[
                    {
                        x: data.map((d) => d.time),
                        open: data.map((d) => d.open),
                        high: data.map((d) => d.high),
                        low: data.map((d) => d.low),
                        close: data.map((d) => d.close),
                        type: "candlestick",
                        increasing: { line: { color: "#ffffff" } }, // Neon Blue
                        decreasing: { line: { color: "#ff2a6d" } }, // Decay Red
                    },
                ]}
                layout={{
                    autosize: true,
                    font: { family: "Geist Mono, monospace", color: "#ededed" },
                    plot_bgcolor: "rgba(0,0,0,0)",
                    paper_bgcolor: "rgba(0,0,0,0)",
                    xaxis: {
                        gridcolor: "rgba(255,255,255,0.05)",
                        zerolinecolor: "rgba(255,255,255,0.1)",
                    },
                    yaxis: {
                        gridcolor: "rgba(255,255,255,0.05)",
                        zerolinecolor: "rgba(255,255,255,0.1)",
                    },
                    margin: { l: 40, r: 20, t: 60, b: 40 },
                    showlegend: false,
                    dragmode: false,
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displayModeBar: false }}
            />

            {/* Glitch Overlay on Hover (Optional, can be CSS) */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
    );
}
