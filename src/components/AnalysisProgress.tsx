"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

export type AnalysisStep = "validate" | "metrics" | "inferences" | "verdict";

interface AnalysisProgressProps {
    currentStep: AnalysisStep | null;
    completedSteps: AnalysisStep[];
    keyword: string;
}

const STEPS: { id: AnalysisStep; label: string; description: string }[] = [
    { id: "validate", label: "Validating", description: "Checking if trend is analyzable" },
    { id: "metrics", label: "Fetching Metrics", description: "Gathering trend data from sources" },
    { id: "inferences", label: "Generating Insights", description: "AI analyzing patterns" },
    { id: "verdict", label: "Building Verdict", description: "Synthesizing final analysis" },
];

export default function AnalysisProgress({ currentStep, completedSteps, keyword }: AnalysisProgressProps) {
    const currentIdx = STEPS.findIndex((s) => s.id === currentStep);
    const progress = completedSteps.length / STEPS.length;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-white mb-2"
                >
                    Analyzing: <span className="text-neon-blue">{keyword}</span>
                </motion.h2>
                <p className="text-white/50 text-sm font-mono">Multi-model inference pipeline</p>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
                <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: "linear-gradient(90deg, #00f0ff, #bd00ff)",
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
                <div className="absolute right-0 top-4 text-xs font-mono text-white/40">
                    {Math.round(progress * 100)}%
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                {STEPS.map((step, idx) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = step.id === currentStep;
                    const isPending = !isCompleted && !isCurrent;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isCurrent
                                    ? "bg-neon-blue/10 border border-neon-blue/30"
                                    : isCompleted
                                        ? "bg-green-500/10 border border-green-500/20"
                                        : "bg-white/5 border border-white/5"
                                }`}
                        >
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {isCompleted ? (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-white/20" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div
                                    className={`font-semibold ${isCurrent ? "text-neon-blue" : isCompleted ? "text-green-400" : "text-white/40"
                                        }`}
                                >
                                    {step.label}
                                </div>
                                <div className="text-xs text-white/40">{step.description}</div>
                            </div>

                            {/* Status */}
                            <div className="flex-shrink-0 text-xs font-mono">
                                {isCompleted && <span className="text-green-400">Done</span>}
                                {isCurrent && <span className="text-neon-blue">Processing...</span>}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-xs text-white/30 font-mono"
            >
                Powered by Groq • OpenRouter • Featherless AI
            </motion.div>
        </motion.div>
    );
}
