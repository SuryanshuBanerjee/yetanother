"use client";

import { DecayAnalysis } from "@/lib/decayEngine";
import OriginStory from "./OriginStory";
import EvidenceCarousel from "./EvidenceCarousel";
import InfluenceGraph from "./InfluenceGraph";
import PredictionCards from "./PredictionCards";
import AdvancedMetrics from "./AdvancedMetrics";
import Simulator from "./Simulator";
import SludgeDetector from "./SludgeDetector";
import TrendRevival from "./TrendRevival";
import RoleSelector from "./RoleSelector";
import ActionPlaybook from "./ActionPlaybook";
import GhostMarket from "./GhostMarket";
import IntegrityScore from "./IntegrityScore";
import HorizonAlerts from "./HorizonAlerts";
import Necromancy from "./Necromancy";
import { Download, Share2 } from "lucide-react";

export default function TrendReport({ data }: { data: DecayAnalysis }) {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* 0. Report Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter">{data.keyword}</h1>
                            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono uppercase tracking-widest text-white/50">
                                {data.phase} Phase
                            </span>
                        </div>
                        <p className="text-white/60 max-w-2xl text-lg">
                            Deep intelligence report generated via multi-signal decay analysis.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-mono transition-colors border border-white/10">
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue text-sm font-mono transition-colors border border-neon-blue/30">
                            <Download className="w-4 h-4" /> Export PDF
                        </button>
                    </div>
                </div>

                {/* Role Selector */}
                <div className="flex justify-end">
                    <RoleSelector />
                </div>
            </div>

            {/* 1. Origin & Narrative */}
            <section>
                <OriginStory data={data} />
            </section>

            {/* 2. Visual Evidence */}
            <section>
                <EvidenceCarousel posts={data.posts} />
            </section>

            {/* 3. Prediction & Health */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span className="text-decay-red">●</span> Critical Signals
                </h2>
                <PredictionCards data={data} />
            </section>

            {/* 4. Ghost Market & Integrity (Phase 4) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GhostMarket data={data.ghostMarket} />
                <IntegrityScore data={data.integrity} />
            </section>

            {/* 5. Deep Metrics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Col: Network & Sludge */}
                <div className="lg:col-span-5 space-y-6">
                    <InfluenceGraph creators={data.creators} />
                    <SludgeDetector sludgeScore={data.sludgeScore} />
                </div>

                {/* Right Col: Advanced Charts */}
                <div className="lg:col-span-7">
                    <AdvancedMetrics data={data} />
                </div>
            </section>

            {/* 6. Horizon Alerts & Necromancy (Phase 4) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HorizonAlerts />
                <Necromancy keyword={data.keyword} />
            </section>

            {/* 7. Simulation & Revival */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Simulator initialProbability={data.collapseProbability} />
                <TrendRevival keyword={data.keyword} phase={data.phase} />
            </section>

            {/* 8. Role-Based Action Playbook */}
            <section>
                <ActionPlaybook data={data} />
            </section>

            {/* Footer / Transparency */}
            <div className="text-center text-xs text-white/30 pt-12 border-t border-white/5 font-mono">
                GENERATED BY GHOST_IN_THE_MACHINE V2.0.0 • CONFIDENCE: 94% • SOURCES: 14,203
            </div>
        </div>
    );
}
