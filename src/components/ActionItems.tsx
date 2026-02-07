"use client";

import { motion } from "framer-motion";
import { Lightbulb, Target, Compass, Shield } from "lucide-react";

interface ActionItemsProps {
  actionItems: string[];
  timeHorizon?: string;
  opportunityWindow?: string;
  userRole?: string;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  "content-creator": Lightbulb,
  "marketing-team": Target,
  "general-user": Compass,
  "platform-moderator": Shield,
};

const ROLE_TAGLINES: Record<string, string> = {
  "content-creator": "Tailored for your content strategy",
  "marketing-team": "Optimized for campaign execution",
  "general-user": "Personalized insights for your exploration",
  "platform-moderator": "Risk-adjusted actions for platform health",
};

function urgencyColor(urgency: string): string {
  const lower = urgency.toLowerCase();
  if (lower.includes("hour") || lower.includes("immediate") || lower.includes("urgent"))
    return "bg-red-500/20 text-red-400 animate-pulse";
  if (lower.includes("day") || lower.includes("week") || lower.includes("short"))
    return "bg-yellow-500/20 text-yellow-400";
  return "bg-green-500/20 text-green-400";
}

export default function ActionItems({ actionItems, timeHorizon, opportunityWindow, userRole = "general-user" }: ActionItemsProps) {
  if (!actionItems || actionItems.length === 0) return null;

  const Icon = ROLE_ICONS[userRole] || Compass;
  const tagline = ROLE_TAGLINES[userRole] || ROLE_TAGLINES["general-user"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Action Items</h3>
          <p className="text-xs text-white/40">What to do next</p>
        </div>
      </div>

      {/* Urgency Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {timeHorizon && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColor(timeHorizon)}`}>
            Horizon: {timeHorizon}
          </span>
        )}
        {opportunityWindow && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColor(opportunityWindow)}`}>
            Window: {opportunityWindow}
          </span>
        )}
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {actionItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex gap-3 pl-3 border-l-2 border-cyan-400/60"
          >
            <span className="text-cyan-400 font-mono font-bold text-sm flex-shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-sm text-white/80 leading-relaxed">{item}</p>
          </motion.div>
        ))}
      </div>

      {/* Role tagline */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
        <Icon className="w-3 h-3 text-white/30" />
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{tagline}</span>
      </div>
    </motion.div>
  );
}
