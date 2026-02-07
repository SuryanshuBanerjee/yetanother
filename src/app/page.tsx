"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThinkingUI from "@/components/ThinkingUI";
import TrendReport from "@/components/TrendReport";
import { RoleProvider } from "@/components/RoleSelector";
import AppFlow from "@/components/AppFlow";
import TrendTicker from "@/components/TrendTicker";
import TrendingStocks from "@/components/TrendingStocks";
import { Search, Activity } from "lucide-react";
import type { DecayAnalysis } from "@/lib/decayEngine";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<DecayAnalysis | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setData(null);
    setShowThinking(true);
    setLoading(true);

    try {
      const res = await fetch("/api/trends/decay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      });
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to analyze trend", error);
    }
  };

  return (
    <RoleProvider>
      <AppFlow>
        {/* Dashboard with HUD design */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen relative"
          style={{
            background: `linear-gradient(135deg, 
              rgba(0, 240, 255, 0.12) 0%, 
              rgba(5, 5, 5, 1) 35%,
              rgba(5, 5, 5, 1) 65%,
              rgba(189, 0, 255, 0.12) 100%
            )`,
          }}
        >
          {/* Grain Overlay */}
          <div className="grain-overlay fixed inset-0 pointer-events-none z-50" />

          {/* ThinkingUI Overlay */}
          <AnimatePresence mode="wait">
            {showThinking && (
              <ThinkingUI
                onComplete={() => {
                  setShowThinking(false);
                  setLoading(false);
                }}
              />
            )}
          </AnimatePresence>

          {/* Main HUD Container */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`relative z-10 w-[95vw] max-w-7xl mx-auto my-6 min-h-[calc(100vh-3rem)] rounded-2xl overflow-hidden transition-opacity duration-700 ${showThinking ? "opacity-0" : "opacity-100"}`}
            style={{
              background: "linear-gradient(135deg, rgba(0, 0, 0, 0.75), rgba(15, 15, 25, 0.5))",
              backdropFilter: "blur(20px)",
              border: "1px solid transparent",
              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.75), rgba(15, 15, 25, 0.5)), 
                                linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(189, 0, 255, 0.3))`,
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-purple-500/50 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-purple-500/50 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-400/50 rounded-br-2xl" />

            {/* Header Bar */}
            <header className="flex justify-between items-center px-8 py-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-white">TREND</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 ml-1">PRISM</span>
                </h1>
              </div>
              <div className="flex gap-6 text-xs font-mono text-white/50">
                <span className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">LIVE</span>
                </span>
                <span>V 2.0.0</span>
              </div>
            </header>

            {/* Search Bar */}
            <div className="px-8 py-6">
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any trend, hashtag, or topic..."
                  className="w-full py-4 px-6 pr-32 rounded-xl text-lg text-white outline-none transition-all placeholder:text-white/30"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0, 240, 255, 0.4)";
                    e.target.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-lg font-bold flex items-center gap-2 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #00f0ff, #bd00ff)",
                    boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)",
                  }}
                >
                  <Search className="w-4 h-4 text-black" />
                  <span className="text-black">Analyze</span>
                </button>
              </form>
            </div>

            {/* Ticker Tape */}
            <TrendTicker />

            {/* Dashboard Content */}
            <div className="px-8 py-6">
              {data ? (
                <TrendReport data={data} />
              ) : (
                <TrendingStocks />
              )}
            </div>
          </motion.div>
        </motion.div>
      </AppFlow>
    </RoleProvider>
  );
}
