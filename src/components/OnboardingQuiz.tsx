"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

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
            { id: "tiktok", title: "TikTok", color: "#00f2ea" },
            { id: "instagram", title: "Instagram", color: "#e1306c" },
            { id: "twitter", title: "X", color: "#1da1f2" },
            { id: "youtube", title: "YouTube", color: "#ff0000" },
            { id: "linkedin", title: "LinkedIn", color: "#0077b5" },
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

    // Color evolution based on progress (Restored Vibe)
    const gradientColors = useMemo(() => {
        const hueShift = (currentStep / (steps.length - 1)) * 60; // 0 to 60 degree shift
        return {
            primary: `hsl(${180 + hueShift}, 100%, 50%)`, // Cyan to Purple
            secondary: `hsl(${280 - hueShift}, 100%, 50%)`, // Purple to Blue
        };
    }, [currentStep]);

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
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                background: `linear-gradient(135deg, 
          ${gradientColors.primary}20 0%, 
          rgba(5, 5, 5, 1) 35%,
          rgba(5, 5, 5, 1) 65%,
          ${gradientColors.secondary}20 100%
        )`,
                transition: "background 0.5s ease",
            }}
        >
            {/* Grain Overlay */}
            <div className="grain-overlay fixed inset-0 pointer-events-none z-[100]" />

            {/* HUD Container */}
            <motion.div
                className="relative w-[92vw] h-[88vh] rounded-2xl overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(15, 15, 25, 0.5))",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${gradientColors.primary}40`,
                    boxShadow: `0 0 60px ${gradientColors.primary}10, 0 0 120px ${gradientColors.secondary}05`,
                    transition: "border-color 0.5s, box-shadow 0.5s",
                }}
            >
                {/* Corner Accents - Colors evolve */}
                <div
                    className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 rounded-tl-2xl transition-colors duration-500"
                    style={{ borderColor: gradientColors.primary }}
                />
                <div
                    className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 rounded-tr-2xl transition-colors duration-500"
                    style={{ borderColor: gradientColors.secondary }}
                />
                <div
                    className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 rounded-bl-2xl transition-colors duration-500"
                    style={{ borderColor: gradientColors.secondary }}
                />
                <div
                    className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 rounded-br-2xl transition-colors duration-500"
                    style={{ borderColor: gradientColors.primary }}
                />

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
                                style={{ background: `linear-gradient(90deg, ${gradientColors.primary}, ${gradientColors.secondary})` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
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
                                        className="w-full bg-transparent border-b-2 py-3 text-2xl text-white text-center outline-none transition-colors placeholder:text-white/20"
                                        style={{ borderColor: `${gradientColors.primary}60` }}
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
                                                    className="w-full p-4 rounded-xl text-left transition-all duration-200 border"
                                                    style={{
                                                        background: isSelected ? `${gradientColors.primary}15` : "rgba(255,255,255,0.03)",
                                                        borderColor: isSelected ? gradientColors.primary : "rgba(255,255,255,0.08)",
                                                    }}
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
                                                                style={{ background: gradientColors.primary }}
                                                            >
                                                                <Check className="w-4 h-4 text-black" />
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
                                                    className="flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200 border"
                                                    style={{
                                                        background: isSelected ? `${opt.color}20` : "rgba(255,255,255,0.03)",
                                                        borderColor: isSelected ? opt.color : "rgba(255,255,255,0.08)",
                                                    }}
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: opt.color }}
                                                    />
                                                    <span className="text-white font-medium">{opt.title}</span>
                                                    {isSelected && <Check className="w-4 h-4" style={{ color: opt.color }} />}
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
                                    className="mt-10 px-10 py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{
                                        background: isValid()
                                            ? `linear-gradient(135deg, ${gradientColors.primary}, ${gradientColors.secondary})`
                                            : "rgba(255,255,255,0.1)",
                                        boxShadow: isValid() ? `0 0 30px ${gradientColors.primary}40` : "none",
                                    }}
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
