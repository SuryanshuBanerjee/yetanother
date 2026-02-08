"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import RainbowCorners from "./RainbowCorners";

interface QuizStep {
    id: string;
    title: string;
    subtitle: string;
    type: "text" | "select" | "multi-select";
    placeholder?: string;
    options?: Array<{ id: string; title: string; desc?: string; color?: string }>;
}

const steps: QuizStep[] = [
    {
        id: "name",
        title: "What should we call you?",
        subtitle: "Enter your name to personalize your experience",
        placeholder: "Your name",
        type: "text",
    },
    {
        id: "role",
        title: "What's your role?",
        subtitle: "This helps us tailor insights to your needs",
        type: "select",
        options: [
            { id: "creator", title: "Content Creator", desc: "Optimize your content strategy" },
            { id: "marketer", title: "Marketer", desc: "Data-driven campaign decisions" },
            { id: "analyst", title: "Trend Analyst", desc: "Deep dive into trend patterns" },
            { id: "executive", title: "Executive", desc: "Strategic overview and signals" },
        ],
    },
    {
        id: "platforms",
        title: "Which platforms?",
        subtitle: "Select all that apply",
        type: "multi-select",
        options: [
            { id: "tiktok", title: "TikTok", color: "#ffffff" },
            { id: "instagram", title: "Instagram", color: "#ffffff" },
            { id: "twitter", title: "X", color: "#ffffff" },
            { id: "youtube", title: "YouTube", color: "#ffffff" },
            { id: "linkedin", title: "LinkedIn", color: "#ffffff" },
        ],
    },
    {
        id: "alerts",
        title: "How often should we notify you?",
        subtitle: "When trends show decay signals",
        type: "select",
        options: [
            { id: "realtime", title: "Real-time", desc: "Instant notifications" },
            { id: "daily", title: "Daily digest", desc: "Summary every 24 hours" },
            { id: "weekly", title: "Weekly report", desc: "Comprehensive weekly analysis" },
            { id: "none", title: "None", desc: "I'll check manually" },
        ],
    },
    {
        id: "experience",
        title: "Your experience level?",
        subtitle: "This helps us tailor the complexity of insights",
        type: "select",
        options: [
            { id: "beginner", title: "Beginner", desc: "New to trend analysis" },
            { id: "intermediate", title: "Intermediate", desc: "Some experience" },
            { id: "advanced", title: "Advanced", desc: "Experienced analyst" },
            { id: "expert", title: "Expert", desc: "Professional level" },
        ],
    },
];

// Dark gradient backgrounds that shift per step
const STEP_GRADIENTS = [
    "radial-gradient(ellipse 120% 80% at 20% 80%, hsla(260, 60%, 15%, 0.8) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 80% 20%, hsla(200, 50%, 12%, 0.6) 0%, transparent 50%)",
    "radial-gradient(ellipse 120% 80% at 80% 80%, hsla(320, 50%, 14%, 0.8) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 20% 20%, hsla(260, 50%, 12%, 0.6) 0%, transparent 50%)",
    "radial-gradient(ellipse 120% 80% at 50% 90%, hsla(200, 60%, 14%, 0.8) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 50% 10%, hsla(160, 40%, 10%, 0.6) 0%, transparent 50%)",
    "radial-gradient(ellipse 120% 80% at 30% 70%, hsla(160, 50%, 12%, 0.8) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 70% 30%, hsla(260, 50%, 14%, 0.6) 0%, transparent 50%)",
    "radial-gradient(ellipse 120% 80% at 70% 80%, hsla(280, 55%, 15%, 0.8) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 30% 20%, hsla(200, 55%, 12%, 0.6) 0%, transparent 50%)",
];

const BUTTON_COLORS = [
    "hsla(260, 55%, 45%, 1)",
    "hsla(320, 45%, 40%, 1)",
    "hsla(200, 55%, 40%, 1)",
    "hsla(160, 45%, 35%, 1)",
    "hsla(280, 50%, 42%, 1)",
];

interface OnboardingQuizProps {
    onComplete: (data: Record<string, string | string[]>) => void;
    onBack: () => void;
}

export default function OnboardingQuiz({ onComplete, onBack }: OnboardingQuizProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, string | string[]>>({
        name: "",
        role: "",
        platforms: [],
        alerts: "",
        experience: "",
    });

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    const isValid = () => {
        const value = formData[step.id];
        if (step.type === "text") return (value as string).trim().length > 0;
        if (step.type === "select") return (value as string).length > 0;
        if (step.type === "multi-select") return (value as string[]).length > 0;
        return false;
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            onComplete(formData);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        } else {
            onBack();
        }
    };

    const handleSelect = (id: string) => {
        if (step.type === "select") {
            setFormData((prev) => ({ ...prev, [step.id]: id }));
        } else if (step.type === "multi-select") {
            const current = formData[step.id] as string[];
            if (current.includes(id)) {
                setFormData((prev) => ({ ...prev, [step.id]: current.filter((x) => x !== id) }));
            } else {
                setFormData((prev) => ({ ...prev, [step.id]: [...current, id] }));
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
            {/* Animated gradient background that shifts per step */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ background: STEP_GRADIENTS[currentStep] }}
                />
            </AnimatePresence>

            {/* HUD Container */}
            <motion.div
                className="relative w-[92vw] h-[88vh] rounded-2xl overflow-hidden"
                style={{
                    background: "rgba(10, 10, 10, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
            >
                <RainbowCorners />

                {/* Header with Progress */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 border-b border-white/10">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">{currentStep === 0 ? "Exit" : "Back"}</span>
                    </button>

                    <div className="flex flex-col items-center gap-1">
                        <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${progress}%`,
                                    backgroundColor: BUTTON_COLORS[currentStep],
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">
                            {currentStep + 1} of {steps.length}
                        </span>
                    </div>

                    <div className="w-20" /> {/* Spacer */}
                </div>

                {/* Quiz Content */}
                <div className="absolute inset-0 flex items-center justify-center pt-16">
                    <div className="w-full max-w-xl px-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center text-center"
                            >
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                    {step.title}
                                </h2>
                                <p className="text-lg text-white/50 mb-10 max-w-md">{step.subtitle}</p>

                                {/* Text Input */}
                                {step.type === "text" && (
                                    <input
                                        type="text"
                                        value={formData[step.id] as string}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, [step.id]: e.target.value }))}
                                        placeholder={step.placeholder}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && isValid()) {
                                                handleNext();
                                            }
                                        }}
                                        className="w-full bg-transparent border-b-2 border-white/30 py-3 text-2xl text-white text-center outline-none transition-colors placeholder:text-white/20 focus:border-white/60"
                                    />
                                )}

                                {/* Select Options */}
                                {step.type === "select" && (
                                    <div className="w-full flex flex-col gap-3">
                                        {step.options?.map((opt) => {
                                            const isSelected = formData[step.id] === opt.id;
                                            return (
                                                <motion.button
                                                    key={opt.id}
                                                    onClick={() => handleSelect(opt.id)}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${isSelected
                                                            ? "border-white/40"
                                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                                        }`}
                                                    style={isSelected ? { background: `${BUTTON_COLORS[currentStep]}33` } : undefined}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-semibold text-white">{opt.title}</div>
                                                            {opt.desc && <div className="text-sm text-white/50">{opt.desc}</div>}
                                                        </div>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                                style={{ background: BUTTON_COLORS[currentStep] }}
                                                            >
                                                                <Check className="w-4 h-4 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Multi-Select Pills */}
                                {step.type === "multi-select" && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {step.options?.map((opt) => {
                                            const isSelected = (formData[step.id] as string[]).includes(opt.id);
                                            return (
                                                <motion.button
                                                    key={opt.id}
                                                    onClick={() => handleSelect(opt.id)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200 border ${isSelected
                                                            ? "border-white/40"
                                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                                        }`}
                                                    style={isSelected ? { background: `${BUTTON_COLORS[currentStep]}33` } : undefined}
                                                >
                                                    <span className="text-white font-medium">{opt.title}</span>
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Continue Button */}
                                <motion.button
                                    onClick={handleNext}
                                    disabled={!isValid()}
                                    whileHover={{ scale: isValid() ? 1.02 : 1 }}
                                    whileTap={{ scale: isValid() ? 0.98 : 1 }}
                                    className={`mt-10 px-10 py-4 rounded-xl font-semibold transition-all duration-300 ${isValid()
                                            ? "text-white"
                                            : "bg-white/10 text-white/30 cursor-not-allowed"
                                        }`}
                                    style={isValid() ? { background: BUTTON_COLORS[currentStep] } : undefined}
                                >
                                    {currentStep === steps.length - 1 ? "Complete" : "Continue"}
                                </motion.button>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
