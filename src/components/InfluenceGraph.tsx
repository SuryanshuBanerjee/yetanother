"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Creator } from "@/lib/decayEngine";
import { Network } from "lucide-react";

// Dynamically import Plotly
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function InfluenceGraph({ creators }: { creators: Creator[] }) {
    // Mapper for status colors
    const statusColors = {
        Active: "#00f0ff",     // Neon Blue
        Declining: "#ff2a6d", // Decay Red
        Left: "#888888"       // Grey
    };

    const trace = {
        x: creators.map(c => c.x * (Math.random() * 0.5 + 0.8)), // Jitter for visual interest
        y: creators.map(c => c.y * (Math.random() * 0.5 + 0.8)),
        mode: 'markers+text',
        type: 'scatter',
        text: creators.map(c => c.handle),
        textposition: 'top center',
        marker: {
            size: creators.map(c => c.influence / 3), // Size by influence
            color: creators.map(c => statusColors[c.status]),
            opacity: 0.8,
            line: {
                color: 'white',
                width: 1
            }
        },
        hoverinfo: 'text',
        hovertext: creators.map(c =>
            `<b>${c.handle}</b><br>Followers: ${c.followers}<br>Status: ${c.status}<br>Influence: ${c.influence}/100`
        ),
    };

    return (
        <div className="relative p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md">
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                    <Network className="w-5 h-5 text-neon-blue" />
                    Creator Influence Map
                </h2>
                <p className="text-xs text-white/50 font-mono uppercase tracking-widest">
                    Network Centrality • Rot Detection
                </p>
            </div>

            <div className="h-[400px] w-full">
                <Plot
                    data={[trace as any]}
                    layout={{
                        autosize: true,
                        font: { family: "Geist Mono, monospace", color: "#ededed" },
                        plot_bgcolor: "rgba(0,0,0,0)",
                        paper_bgcolor: "rgba(0,0,0,0)",
                        xaxis: { showgrid: false, zeroline: false, showticklabels: false },
                        yaxis: { showgrid: false, zeroline: false, showticklabels: false },
                        margin: { l: 0, r: 0, t: 0, b: 0 },
                        showlegend: false,
                        dragmode: "pan",
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                    config={{ displayModeBar: false, scrollZoom: true }}
                />
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/50 p-3 rounded-lg border border-white/10 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-blue" /> Active
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-decay-red" /> Deserter / Declining
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" /> Left Platform
                </div>
            </div>
        </div>
    );
}
