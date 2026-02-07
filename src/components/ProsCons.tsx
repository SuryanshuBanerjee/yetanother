"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface ProConItem {
    title: string;
    detail: string;
    impact: number;
}

interface ProsConsProps {
    pros: ProConItem[];
    cons: ProConItem[];
    verdict?: string;
    confidence?: number;
    userRole?: string;
    summary?: string;
}

// Role-specific verdict explanations
const VERDICT_EXPLANATIONS: Record<string, Record<string, string>> = {
    "content-creator": {
        BUY: "Create content NOW — high engagement potential and growing audience interest. Early adoption = maximum reach.",
        SELL: "Stop creating content about this — you'll get poor reach and may lose audience trust by jumping on a dead trend.",
        HOLD: "Wait and watch — not the right moment yet. Build drafts but don't publish until momentum shifts.",
        WATCH: "Keep monitoring — this could go viral or crash. Prepare content but wait for clearer signals.",
    },
    "marketing-team": {
        BUY: "Green light for campaigns — strong ROI potential if you act NOW. Budget allocation recommended.",
        SELL: "Pull any active campaigns — risk of wasted spend and negative brand association. Redirect budget.",
        HOLD: "Don't commit budget yet — wait for trend direction to confirm. Keep creatives ready.",
        WATCH: "Reserve budget but don't deploy — monitor for 1-2 weeks before committing spend.",
    },
    "platform-moderator": {
        BUY: "Amplify this trend — high engagement, low risk. Will drive positive platform metrics.",
        SELL: "Consider suppressing or de-ranking — potential moderation issues or community backlash incoming.",
        HOLD: "Let it run organically — don't actively promote but don't suppress either.",
        WATCH: "Flag for monitoring — potential for viral surge or controversy. Prepare moderation resources.",
    },
    "general-user": {
        BUY: "This trend is worth your attention — it's going somewhere interesting. Worth exploring now.",
        SELL: "This trend is dying or becoming problematic — move on to something new and fresh.",
        HOLD: "Interesting but uncertain — keep an eye on it. Check back in a few days.",
        WATCH: "Developing situation — could go either way. Worth occasional monitoring.",
    },
};

// Stock-to-Trend metric explanations
const METRIC_EXPLANATIONS: Record<string, string> = {
    "Current Interest": "Like a stock's current price — shows how much attention the trend has right now (0-100 scale)",
    "Peak Interest": "The highest attention this trend ever received — like an all-time-high stock price",
    "Week Change": "How much interest grew/dropped in 7 days — indicates short-term momentum",
    "Month Change": "Monthly momentum — reveals if trend is in sustained growth or decline",
    "Volatility": "How wildly attention fluctuates — high volatility = unpredictable, risky trend",
    "Consistency": "How reliably the trend maintains interest — like a stock's dividend consistency",
};

interface ProsConsFullProps extends ProsConsProps {
    hasActionItems?: boolean;
}

export default function ProsCons({ pros = [], cons = [], verdict, confidence, userRole = "general-user", summary, hasActionItems }: ProsConsFullProps) {
    const getVerdictColor = (v: string) => {
        switch (v?.toUpperCase()) {
            case "BUY":
                return "text-green-400 border-green-400/30 bg-green-400/10";
            case "SELL":
                return "text-red-400 border-red-400/30 bg-red-400/10";
            case "HOLD":
                return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
            case "WATCH":
                return "text-neon-blue border-neon-blue/30 bg-neon-blue/10";
            default:
                return "text-white/60 border-white/10 bg-white/5";
        }
    };

    const verdictExplanation = VERDICT_EXPLANATIONS[userRole]?.[verdict?.toUpperCase() || ""]
        || VERDICT_EXPLANATIONS["general-user"][verdict?.toUpperCase() || "WATCH"]
        || "";

    return (
        <div className="space-y-4">
            {/* Verdict Badge with Role-Specific Explanation */}
            {verdict && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Verdict Badge */}
                        <div className={`px-8 py-4 rounded-xl border-2 text-center ${getVerdictColor(verdict)}`}>
                            <div className="text-3xl font-bold tracking-widest">{verdict}</div>
                            {confidence && (
                                <div className="text-sm opacity-70 mt-1">{confidence}% confidence</div>
                            )}
                        </div>

                        {/* Role-Targeted Explanation */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-neon-blue" />
                                <span className="text-xs text-white/50 uppercase tracking-wider">What this means for you</span>
                            </div>
                            <p className="text-white/80 leading-relaxed">{verdictExplanation}</p>
                            {summary && (
                                <p className="text-white/50 text-sm mt-2 italic">{summary}</p>
                            )}
                            {hasActionItems && (
                                <button
                                    onClick={() => document.getElementById("action-items-section")?.scrollIntoView({ behavior: "smooth" })}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1 transition-colors"
                                >
                                    See your action items &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros Column */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-green-500/20 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-bold text-green-400">Why It Might Rise</span>
                        <span className="text-xs text-green-400/50 ml-auto">Bullish Signals</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {pros.length === 0 ? (
                            <p className="text-white/40 text-sm">No bullish signals identified</p>
                        ) : (
                            pros.map((pro, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.05 }}
                                    className="flex gap-3"
                                >
                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-white text-sm">{pro.title}</div>
                                        <div className="text-xs text-white/50 mt-0.5">{pro.detail}</div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-1 w-20 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full bg-green-400 rounded-full"
                                                    style={{ width: `${pro.impact}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-green-400/70">Impact: {pro.impact}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Cons Column */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="font-bold text-red-400">Why It Might Fall</span>
                        <span className="text-xs text-red-400/50 ml-auto">Bearish Signals</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {cons.length === 0 ? (
                            <p className="text-white/40 text-sm">No bearish signals identified</p>
                        ) : (
                            cons.map((con, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.05 }}
                                    className="flex gap-3"
                                >
                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-white text-sm">{con.title}</div>
                                        <div className="text-xs text-white/50 mt-0.5">{con.detail}</div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-1 w-20 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full bg-red-400 rounded-full"
                                                    style={{ width: `${con.impact}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-red-400/70">Impact: {con.impact}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Metric Terminology Note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl border border-white/5 bg-white/2"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3 h-3 text-white/30" />
                    <span className="text-xs text-white/30 uppercase tracking-wider">Understanding Our Metrics</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/40">
                    <span><strong className="text-white/60">BUY</strong> = Engage with trend</span>
                    <span><strong className="text-white/60">SELL</strong> = Avoid trend</span>
                    <span><strong className="text-white/60">HOLD</strong> = Wait for clarity</span>
                    <span><strong className="text-white/60">WATCH</strong> = Monitor closely</span>
                </div>
            </motion.div>
        </div>
    );
}
