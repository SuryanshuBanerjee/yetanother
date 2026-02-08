"use client";

import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  date: string;
}

interface NewsHeadlinesProps {
  headlines: string[];
  articles?: NewsArticle[];
  sentiment?: string;
}

export default function NewsHeadlines({ headlines, articles, sentiment }: NewsHeadlinesProps) {
  if (!headlines || headlines.length === 0) return null;

  const sentimentColor = sentiment === "positive" ? "text-green-400" : sentiment === "negative" ? "text-red-400" : "text-yellow-400";
  const sentimentLabel = sentiment === "positive" ? "Positive" : sentiment === "negative" ? "Negative" : "Mixed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Live News</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/40">Sentiment:</span>
          <span className={`font-mono font-medium ${sentimentColor}`}>{sentimentLabel}</span>
          <span className="text-white/30 font-mono">{headlines.length} articles</span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {(articles && articles.length > 0 ? articles : headlines.map(h => ({ title: h, description: "", source: "", date: "" }))).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <p className="text-sm text-white/90 leading-snug">{item.title}</p>
            {item.source && (
              <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                <span>{item.source}</span>
                {item.date && <span>·</span>}
                {item.date && <span>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
