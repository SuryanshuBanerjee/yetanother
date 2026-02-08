"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrendDashboard from "@/components/TrendDashboard";
import { RoleProvider } from "@/components/RoleSelector";
import AppFlow, { useUserData } from "@/components/AppFlow";
import TrendTicker from "@/components/TrendTicker";
import TrendingStocks from "@/components/TrendingStocks";
import AnalysisProgress, { AnalysisStep } from "@/components/AnalysisProgress";
import { Activity } from "lucide-react";
import SearchWithSuggestions from "@/components/SearchWithSuggestions";
import TrendComparison from "@/components/TrendComparison";
import DecayLeaderboard from "@/components/DecayLeaderboard";
import { GitCompare } from "lucide-react";


// Role mapping from quiz IDs to API role keys
const ROLE_MAP: Record<string, string> = {
  creator: "content-creator",
  marketer: "marketing-team",
  analyst: "general-user",
  executive: "platform-moderator",
};

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchingKeyword, setSearchingKeyword] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { userData, goToLanding } = useUserData();

  // Progress tracking
  const [currentStep, setCurrentStep] = useState<AnalysisStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<AnalysisStep[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);

  const quizRole = (userData?.role as string) || "analyst";
  const userRole = ROLE_MAP[quizRole] || "general-user";
  const userName = (userData?.name as string) || "User";
  const platforms = (userData?.platforms as string[]) || [];

  // Scroll to top when dashboard data loads
  useEffect(() => {
    if (data) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [data]);

  const simulateProgress = () => {
    // Simulate pipeline progress matching actual timing:
    // validate (~0.5s) → metrics (~2s) → inferences+verdict parallel (~5-12s)
    const timers: ReturnType<typeof setTimeout>[] = [];

    setCurrentStep("validate");
    setCompletedSteps([]);

    // Step 1: validate completes fast
    timers.push(setTimeout(() => {
      setCompletedSteps(["validate"]);
      setCurrentStep("metrics");
    }, 800));

    // Step 2: metrics takes ~2-3s
    timers.push(setTimeout(() => {
      setCompletedSteps(["validate", "metrics"]);
      setCurrentStep("inferences");
    }, 3500));

    // Step 3: inferences + verdict run in parallel, show inferences first
    timers.push(setTimeout(() => {
      setCompletedSteps(["validate", "metrics", "inferences"]);
      setCurrentStep("verdict");
    }, 8000));

    return () => timers.forEach(t => clearTimeout(t));
  };

  const analyzeKeyword = async (keyword: string) => {
    if (!keyword) return;

    // Reset state
    setData(null);
    setValidationError(null);
    setLoading(true);
    setSearchingKeyword(keyword);
    setQuery(keyword);

    // Start progress simulation
    const cleanup = simulateProgress();

    try {
      const res = await fetch("/api/trends/decay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, userRole, platforms }),
      });

      const result = await res.json();

      // Complete all steps
      setCompletedSteps(["validate", "metrics", "inferences", "verdict"]);
      setCurrentStep(null);

      if (res.status === 422) {
        setValidationError(result.validation?.reason || result.message || "This doesn't appear to be a valid trend.");
        setLoading(false);
        cleanup();
        return;
      }

      // Small delay for visual completion
      setTimeout(() => {
        setData(result);
        setLoading(false);
      }, 500);

      cleanup();
    } catch (error) {
      console.error("Failed to analyze trend", error);
      setValidationError("Analysis failed. Please try again.");
      setLoading(false);
      cleanup();
    }
  };

  const handleStockClick = (keyword: string) => {
    analyzeKeyword(keyword);
  };

  const handleBackToStocks = () => {
    setData(null);
    setSearchingKeyword("");
    setCompletedSteps([]);
    setCurrentStep(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen relative font-sans bg-black"
    >
      {/* Grain Overlay */}
      <div className="grain-overlay fixed inset-0 pointer-events-none z-50" />

      {/* Main HUD Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 w-[95vw] max-w-7xl mx-auto my-6 min-h-[calc(100vh-3rem)] rounded-2xl overflow-hidden hud-container"
      >
        {/* Corner Accents - Monochrome */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-white/20 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-white/20 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-white/20 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-white/20 rounded-br-2xl" />

        {/* Header Bar */}
        <header className="flex justify-between items-center px-8 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={goToLanding}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full bg-white/80" />
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-white">TREND</span>
                <span className="text-white/50 ml-1">PRISM</span>
              </h1>
            </button>
            {data && (
              <button
                onClick={handleBackToStocks}
                className="ml-4 text-xs text-white/50 hover:text-white transition-colors"
              >
                ← Back to Trends
              </button>
            )}
          </div>
          <div className="flex gap-6 text-xs font-mono text-white/50">
            <span className="text-white/70">Welcome, {userName}</span>
            <span className="px-2 py-0.5 rounded border border-white/20 text-white/70">
              {quizRole.charAt(0).toUpperCase() + quizRole.slice(1)}
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-green-400">LIVE</span>
            </span>
            <span>V 2.0.0</span>
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:border-white/40 transition-all"
            >
              <GitCompare className="w-3 h-3" />
              <span>Compare</span>
            </button>
          </div>
        </header>

        {/* Search Bar with Suggestions */}
        <div className="px-8 py-6">
          <SearchWithSuggestions
            value={query}
            onChange={(value) => {
              setQuery(value);
              if (validationError) setValidationError(null);
            }}
            onSearch={analyzeKeyword}
            loading={loading}
            validationError={validationError}
          />
        </div>

        {/* Ticker Tape */}
        <TrendTicker />

        {/* Dashboard Content */}
        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            {loading && searchingKeyword ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-12"
              >
                <AnalysisProgress
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  keyword={searchingKeyword}
                />
              </motion.div>
            ) : data ? (
              <motion.div
                ref={dashboardRef}
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TrendDashboard data={data as { keyword: string } & Record<string, unknown>} userRole={userRole} onRelatedTrendClick={handleStockClick} />
              </motion.div>
            ) : (
              <motion.div
                key="stocks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2">
                  <TrendingStocks onStockClick={handleStockClick} />
                </div>
                <div>
                  <DecayLeaderboard onTrendClick={handleStockClick} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <TrendComparison
            onClose={() => setShowComparison(false)}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
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
