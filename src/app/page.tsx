"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThinkingUI from "@/components/ThinkingUI";
import TrendReport from "@/components/TrendReport";
import { RoleProvider } from "@/components/RoleSelector";
import AppFlow, { useUserData } from "@/components/AppFlow";
import TrendTicker from "@/components/TrendTicker";
import TrendingStocks from "@/components/TrendingStocks";
import { Search, Activity } from "lucide-react";
import type { DecayAnalysis } from "@/lib/decayEngine";

// Role mapping from quiz IDs to API role keys
const ROLE_MAP: Record<string, string> = {
  creator: "content-creator",
  marketer: "marketing-team",
  analyst: "general-user",
  executive: "platform-moderator",
};

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<(DecayAnalysis & Record<string, unknown>) | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { userData } = useUserData();

  // Get the user role from onboarding data
  const quizRole = (userData?.role as string) || "analyst";
  const userRole = ROLE_MAP[quizRole] || "general-user";
  const userName = (userData?.name as string) || "User";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setData(null);
    setValidationError(null);
    setShowThinking(true);
    setLoading(true);

    try {
      const res = await fetch("/api/trends/decay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query, userRole }),
      });

      const result = await res.json();

      if (res.status === 422) {
        // Trend was rejected by validation
        setValidationError(result.validation?.reason || result.message || "This doesn't appear to be a valid trend.");
        setShowThinking(false);
        setLoading(false);
        return;
      }

      setData(result);
    } catch (error) {
      console.error("Failed to analyze trend", error);
    }
  };

  const handleStockClick = (keyword: string) => {
    setQuery(keyword);
    // Auto-search
    setData(null);
    setValidationError(null);
    setShowThinking(true);
    setLoading(true);

    fetch("/api/trends/decay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, userRole }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.error === "Invalid trend") {
          setValidationError(result.validation?.reason || result.message);
          setShowThinking(false);
          setLoading(false);
        } else {
          setData(result);
        }
      })
      .catch((error) => {
        console.error("Failed to analyze trend", error);
        setShowThinking(false);
        setLoading(false);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen relative font-sans"
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
        className={`relative z-10 w-[95vw] max-w-7xl mx-auto my-6 min-h-[calc(100vh-3rem)] rounded-2xl overflow-hidden transition-opacity duration-700 hud-container ${showThinking ? "opacity-0" : "opacity-100"}`}
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
            <span className="text-white/70">Welcome, {userName}</span>
            <span className="px-2 py-0.5 rounded border border-white/10 text-neon-blue">
              {quizRole.charAt(0).toUpperCase() + quizRole.slice(1)}
            </span>
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
              onChange={(e) => {
                setQuery(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Search any trend, hashtag, or topic..."
              className="w-full py-4 px-6 pr-32 rounded-xl text-lg text-white outline-none transition-all placeholder:text-white/30"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: validationError
                  ? "1px solid rgba(255, 42, 109, 0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => {
                if (!validationError) {
                  e.target.style.borderColor = "rgba(0, 240, 255, 0.4)";
                  e.target.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.1)";
                }
              }}
              onBlur={(e) => {
                if (!validationError) {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-6 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00f0ff, #bd00ff)",
                boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)",
              }}
            >
              <Search className="w-4 h-4 text-black" />
              <span className="text-black">Analyze</span>
            </button>
          </form>

          {/* Validation Error */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mt-3 px-4 py-3 rounded-lg border border-decay-red/30 bg-decay-red/10 text-decay-red text-sm font-mono"
            >
              {validationError}
            </motion.div>
          )}
        </div>

        {/* Ticker Tape */}
        <TrendTicker />

        {/* Dashboard Content */}
        <div className="px-8 py-6">
          {data ? (
            <TrendReport data={data as DecayAnalysis} />
          ) : (
            <TrendingStocks onStockClick={handleStockClick} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <RoleProvider>
      <AppFlow>
        <Dashboard />
      </AppFlow>
    </RoleProvider>
  );
}
