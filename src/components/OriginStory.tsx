"use client";

import { DecayAnalysis } from "@/lib/decayEngine";
import { Clock, GitCommit, ScrollText } from "lucide-react";

export default function OriginStory({ data }: { data: DecayAnalysis }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-neon-blue" />
                Origin & Context
            </h2>

            {/* Narrative & Ancestry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">Narrative Summary</h3>
                    <p className="text-lg leading-relaxed text-white/80">{data.summary}</p>

                    <div className="mt-6">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Memetic Ancestry</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.origin.ancestry.map((item, i) => (
                                <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono border border-white/5 text-neon-purple/80">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="p-6 rounded-2xl bg-surface-1/50 border border-white/10 backdrop-blur-md">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Key Events
                    </h3>
                    <div className="space-y-6 relative ml-2">
                        {/* Timeline Line */}
                        <div className="absolute top-2 bottom-2 left-[5px] w-[1px] bg-white/10" />

                        {data.origin.timeline.map((event, i) => (
                            <div key={i} className="relative pl-6">
                                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-surface-2 border border-white/20" />
                                <span className="text-neon-blue text-xs font-mono block mb-1">{event.date}</span>
                                <p className="text-sm text-white/70 leading-snug">{event.event}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
