"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DecayAnalysis } from "@/lib/decayEngine";
import { BarChart3, GitMerge, Layers, TrendingUp } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AdvancedMetrics({ data }: { data: DecayAnalysis }) {
    const [activeTab, setActiveTab] = useState<"entropy" | "rot" | "volume" | "drivers">("entropy");

    const commonLayout = {
        autosize: true,
        font: { family: "Geist Mono, monospace", color: "#ededed" },
        plot_bgcolor: "rgba(0,0,0,0)",
        paper_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 40, r: 20, t: 20, b: 40 },
        showlegend: true,
        legend: { orientation: "h", y: -0.2 },
        xaxis: { gridcolor: "rgba(255,255,255,0.05)", zerolinecolor: "rgba(255,255,255,0.1)" },
        yaxis: { gridcolor: "rgba(255,255,255,0.05)", zerolinecolor: "rgba(255,255,255,0.1)" }
    };

    const renderChart = () => {
        switch (activeTab) {
            case "entropy":
                return (
                    <Plot
                        data={[
                            {
                                x: data.metricsHistory.map(m => m.date),
                                y: data.metricsHistory.map(m => m.entropy),
                                type: "scatter",
                                mode: "lines+markers",
                                name: "Semantic Entropy",
                                line: { color: "#888888", width: 3 }, // Neon Purple
                                fill: "tozeroy",
                                fillcolor: "rgba(189, 0, 255, 0.1)"
                            }
                        ]}
                        layout={{ ...commonLayout as any, title: "" }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "100%" }}
                        config={{ displayModeBar: false }}
                    />
                );
            case "rot":
                return (
                    <Plot
                        data={[
                            {
                                x: data.metricsHistory.map(m => m.date),
                                y: data.metricsHistory.map(m => m.modularity),
                                type: "scatter",
                                mode: "lines",
                                name: "Modularity (Fragmentation)",
                                line: { color: "#ff2a6d", width: 2 } // Decay Red
                            },
                            {
                                x: data.metricsHistory.map(m => m.date),
                                y: data.metricsHistory.map(m => m.clustering),
                                type: "scatter",
                                mode: "lines",
                                name: "Clustering (Cohesion)",
                                line: { color: "#ffffff", width: 2 } // Neon Blue
                            }
                        ]}
                        layout={{ ...commonLayout as any, title: "" }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "100%" }}
                        config={{ displayModeBar: false }}
                    />
                );
            case "volume":
                return (
                    <Plot
                        data={[
                            {
                                x: data.metricsHistory.map(m => m.date),
                                y: data.metricsHistory.map(m => m.volume),
                                type: "scatter",
                                fill: "tozeroy",
                                name: "Post Volume",
                                line: { color: "#ffffff" } // Sludge Green
                            }
                        ]}
                        layout={{ ...commonLayout as any, title: "" }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "100%" }}
                        config={{ displayModeBar: false }}
                    />
                );
            case "drivers":
                return (
                    <Plot
                        data={[
                            {
                                x: data.drivers.map(d => d.name),
                                y: data.drivers.map(d => d.impact),
                                type: "bar",
                                marker: {
                                    color: ["#888888", "#ff2a6d", "#ffffff", "#ffffff", "#ffffff"]
                                },
                                text: data.drivers.map(d => `${d.impact}%`),
                                textposition: "auto"
                            }
                        ]}
                        layout={{ ...commonLayout as any, title: "" }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "100%" }}
                        config={{ displayModeBar: false }}
                    />
                );
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md min-h-[500px] flex flex-col">
            <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4 mb-4">
                {[
                    { id: "entropy", label: "Entropy Horizon", icon: TrendingUp },
                    { id: "rot", label: "Structural Rot", icon: GitMerge },
                    { id: "volume", label: "Volume Decay", icon: Layers },
                    { id: "drivers", label: "Explainable Drivers", icon: BarChart3 },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${activeTab === tab.id ? "bg-white/10 text-neon-blue border border-neon-blue/30" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="flex-1 w-full relative">
                {renderChart()}
            </div>

            {/* Explanation text based on active tab */}
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 text-sm text-white/60">
                {activeTab === "entropy" && "Semantic Entropy tracks the breakdown of the trend's meaning. High entropy indicates the narrative is dissolving into incoherence."}
                {activeTab === "rot" && "Structural Rot compares fragmentation (Modularity) vs community tightness (Clustering). Divergence signals intense polarization."}
                {activeTab === "volume" && "Pure volume decay, fitted with an exponential degradation curve to predict the 'zero-relevance' date."}
                {activeTab === "drivers" && "Waterfall analysis identifying the primary factors contributing to the trend's current Sell Rating."}
            </div>
        </div>
    );
}
