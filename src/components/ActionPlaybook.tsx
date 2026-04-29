"use client";

import { useRole, UserRole } from "./RoleSelector";
import { DecayAnalysis } from "@/lib/decayEngine";
import { Lightbulb, AlertTriangle, TrendingUp, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Action {
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    icon: typeof Lightbulb;
}

type ActionGenerator = (data: DecayAnalysis) => Action[];

const ROLE_ACTIONS: Record<UserRole, ActionGenerator> = {
    "content-creator": (data) => {
        const actions: Action[] = [];

        if (data.decayScore > 60) {
            actions.push({
                title: "Pivot to a Sub-Niche",
                description: "This trend is saturated. Differentiate NOW by finding a unique angle or adjacent topic before your content becomes invisible.",
                priority: "High",
                icon: AlertTriangle
            });
        } else if (data.decayScore < 30) {
            actions.push({
                title: "Double Down on Content",
                description: "This trend is still growing. Increase your posting frequency to build authority while competition is low.",
                priority: "High",
                icon: TrendingUp
            });
        }

        if (data.sludgeScore > 50) {
            actions.push({
                title: "Humanize Your Content",
                description: "Bot content is flooding this trend. Stand out by adding personal stories, behind-the-scenes, and authentic engagement in comments.",
                priority: "High",
                icon: Lightbulb
            });
        }

        if (data.entropy > 60) {
            actions.push({
                title: "Define the Narrative",
                description: "The conversation is fragmented. Be the voice that clarifies what this trend *really* means. You can become the authority.",
                priority: "Medium",
                icon: Zap
            });
        }

        if (data.collapseProbability > 70) {
            actions.push({
                title: "Archive and Move On",
                description: "High collapse probability. Start transitioning your content to adjacent trends now. Don't get caught in the crash.",
                priority: "High",
                icon: AlertTriangle
            });
        }

        if (actions.length === 0) {
            actions.push({
                title: "Stay the Course",
                description: "Metrics look stable. Continue your current content strategy and monitor for changes weekly.",
                priority: "Low",
                icon: CheckCircle
            });
        }

        return actions;
    },

    "general-user": (data) => {
        const actions: Action[] = [];

        if (data.decayScore > 60) {
            actions.push({
                title: "Enjoy While It Lasts",
                description: "This trend is fading. Enjoy the memes now, but don't be surprised when it becomes 'cringe' in a few weeks.",
                priority: "Low",
                icon: Lightbulb
            });
        }

        if (data.sludgeScore > 50) {
            actions.push({
                title: "Be Skeptical of Viral Posts",
                description: "Many posts in this trend are bot-generated. The engagement you're seeing might not reflect real human interest.",
                priority: "Medium",
                icon: AlertTriangle
            });
        }

        if (data.entropy > 70) {
            actions.push({
                title: "The Trend is Losing Meaning",
                description: "What this trend 'means' is now unclear. Engagement is increasingly just noise. Take online takes with a grain of salt.",
                priority: "Low",
                icon: Zap
            });
        }

        if (actions.length === 0) {
            actions.push({
                title: "All Clear",
                description: "This trend appears healthy and organic. Engage freely!",
                priority: "Low",
                icon: CheckCircle
            });
        }

        return actions;
    },

    "marketing-team": (data) => {
        const actions: Action[] = [];

        if (data.collapseProbability > 50) {
            actions.push({
                title: "DO NOT Launch a Campaign",
                description: "High risk of negative ROI. The trend may collapse mid-campaign, wasting budget and potentially associating your brand with a 'dead' meme.",
                priority: "High",
                icon: AlertTriangle
            });
        } else if (data.healthScore > 70) {
            actions.push({
                title: "Green Light for Activation",
                description: "Trend is healthy with strong organic engagement. Safe to invest in influencer partnerships or branded content.",
                priority: "High",
                icon: TrendingUp
            });
        }

        if (data.sludgeScore > 60) {
            actions.push({
                title: "Avoid Paid Influencers Here",
                description: "Authenticity is suspect. Any branded content will struggle to stand out from the bot noise and may seem inauthentic.",
                priority: "High",
                icon: AlertTriangle
            });
        }

        if (data.entropy > 65) {
            actions.push({
                title: "Define a Clear Brand Angle",
                description: "The trend's narrative is fragmenting. If you MUST engage, create a very specific, ownable interpretation. Don't 'just participate'.",
                priority: "Medium",
                icon: Lightbulb
            });
        }

        if (data.phase === "Growth") {
            actions.push({
                title: "First-Mover Advantage",
                description: "Trend is early-stage. Getting in now could position you as an authentic early adopter rather than a 'brand jumping on the bandwagon'.",
                priority: "Medium",
                icon: TrendingUp
            });
        }

        return actions;
    },

    "platform-moderator": (data) => {
        const actions: Action[] = [];

        if (data.sludgeScore > 60) {
            actions.push({
                title: "Increase Spam Moderation",
                description: "High bot activity detected. Flag accounts posting repetitive/templated content at high frequency for review.",
                priority: "High",
                icon: AlertTriangle
            });
        }

        if (data.entropy > 70) {
            actions.push({
                title: "Prepare for Culture Wars",
                description: "Narrative is fragmenting into conflicting interpretations. Expect increased reports and heated arguments. May need to clarify community guidelines.",
                priority: "Medium",
                icon: Zap
            });
        }

        if (data.decayScore > 70) {
            actions.push({
                title: "Expect Low-Quality Content Surge",
                description: "Dying trends often see a final wave of low-effort 'last chance' content. May need to temporarily increase removal thresholds.",
                priority: "Medium",
                icon: Lightbulb
            });
        }

        if (actions.length === 0) {
            actions.push({
                title: "Normal Operations",
                description: "No unusual moderation signals detected. Standard protocols are sufficient.",
                priority: "Low",
                icon: CheckCircle
            });
        }

        return actions;
    }
};

const priorityColors = {
    High: "border-decay-red/50 bg-decay-red/10 text-decay-red",
    Medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
    Low: "border-neon-green/50 bg-neon-green/10 text-neon-green"
};

export default function ActionPlaybook({ data }: { data: DecayAnalysis }) {
    const { role } = useRole();
    const actions = ROLE_ACTIONS[role](data);

    return (
        <div className="bg-surface-1/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-neon-blue" />
                        Action Playbook
                    </h2>
                    <p className="text-xs text-white/40 font-mono mt-1">
                        Recommendations tailored for: <span className="text-neon-blue capitalize">{role.replace("-", " ")}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {actions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-4 rounded-lg border ${priorityColors[action.priority]} bg-black/30`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-white text-sm">{action.title}</h3>
                                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${priorityColors[action.priority]}`}>
                                            {action.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed">{action.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
