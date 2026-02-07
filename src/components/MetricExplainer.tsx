"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MetricInfo {
    name: string;
    definition: string;
    whyItMatters: string;
    example: string;
}

const METRIC_DEFINITIONS: Record<string, MetricInfo> = {
    decayScore: {
        name: "Decay Score",
        definition: "Measures how 'dead' a trend is on a scale of 0-100.",
        whyItMatters: "A high score (70+) means the trend is losing relevance fast. Engagement is dropping, creators are moving on, and mainstream attention is fading.",
        example: "Think of it like a meme's expiration date. A score of 20 means it's fresh; 80 means it's becoming a 'dead meme'."
    },
    entropy: {
        name: "Vibe Entropy",
        definition: "Measures how chaotic and fragmented the conversation around a trend has become.",
        whyItMatters: "High entropy means there's no clear narrative. Everyone is using the trend differently, often contradicting each other. This usually precedes a crash.",
        example: "Imagine a song everyone loves. Low entropy: everyone agrees it's great. High entropy: half say it's ironic, half say it's cringe, nobody knows anymore."
    },
    sludgeScore: {
        name: "Sludge Index",
        definition: "Percentage of trend content that appears to be bot-generated or AI-created rather than authentic human posts.",
        whyItMatters: "High sludge (60%+) indicates the trend is being artificially inflated. Real human engagement is low, and authentic creators are drowned out by synthetic content.",
        example: "Like a product with fake 5-star reviews. The numbers look good, but real customers aren't actually happy."
    },
    collapseProbability: {
        name: "Collapse Probability",
        definition: "The statistical likelihood that this trend will become irrelevant within the estimated timeframe.",
        whyItMatters: "A 70%+ probability means you should NOT invest resources (time, money, content) into this trend. It's unlikely to pay off.",
        example: "Like a stock with a 'Strong Sell' rating. The analysts have seen the warning signs."
    },
    healthScore: {
        name: "Trend Health",
        definition: "Overall vitality of the trend (0-100). Essentially the opposite of the Decay Score.",
        whyItMatters: "A healthy trend (70+) has strong organic engagement, clear narratives, and active creator participation. Safe to invest in.",
        example: "Think of it as a plant. Green and thriving? High health. Wilting? Low health."
    },
    modularity: {
        name: "Modularity (Fragmentation)",
        definition: "Measures how polarized or split the trend's community is into isolated sub-groups.",
        whyItMatters: "Rising modularity means 'culture wars' are forming. The trend is no longer unifying; it's becoming a battleground. Brands should avoid.",
        example: "A fandom that used to be united now has 5 factions fighting over the 'true' interpretation."
    },
    clustering: {
        name: "Clustering (Cohesion)",
        definition: "Measures how tightly connected the core community around a trend is.",
        whyItMatters: "Falling clustering means the 'core fans' are drifting apart. The trend is losing its dedicated base, which is often a leading indicator of decline.",
        example: "A subreddit where everyone knew each other is now full of lurkers who don't interact."
    }
};

export default function MetricExplainer({ metricKey, children }: { metricKey: keyof typeof METRIC_DEFINITIONS; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const info = METRIC_DEFINITIONS[metricKey];

    if (!info) return <>{children}</>;

    return (
        <div className="relative inline-flex items-center gap-2 group">
            {children}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-neon-blue/20 text-white/30 hover:text-neon-blue transition-colors"
                aria-label={`Explain ${info.name}`}
            >
                <HelpCircle className="w-3 h-3" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 top-full left-0 mt-2 w-80 p-4 rounded-xl bg-surface-2/95 backdrop-blur-lg border border-white/10 shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-white text-sm">{info.name}</h4>
                            <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-neon-blue font-mono uppercase tracking-wider">What it is</span>
                                <p className="text-white/70 mt-1">{info.definition}</p>
                            </div>
                            <div>
                                <span className="text-neon-purple font-mono uppercase tracking-wider">Why it matters</span>
                                <p className="text-white/70 mt-1">{info.whyItMatters}</p>
                            </div>
                            <div>
                                <span className="text-sludge-green font-mono uppercase tracking-wider">Example</span>
                                <p className="text-white/70 mt-1 italic">{info.example}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
