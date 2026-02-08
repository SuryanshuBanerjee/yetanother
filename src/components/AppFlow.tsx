"use client";

import { useState, createContext, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./LandingPage";
import OnboardingQuiz from "./OnboardingQuiz";

type AppState = "landing" | "quiz" | "dashboard";

// Context to share user data and navigation with the dashboard
interface UserDataContextType {
    userData: Record<string, string | string[]> | null;
    goToLanding: () => void;
}

const UserDataContext = createContext<UserDataContextType>({
    userData: null,
    goToLanding: () => { },
});

export function useUserData() {
    return useContext(UserDataContext);
}

interface AppFlowProps {
    children: React.ReactNode;
}

export default function AppFlow({ children }: AppFlowProps) {
    const [appState, setAppState] = useState<AppState>("landing");
    const [userData, setUserData] = useState<Record<string, string | string[]> | null>(null);

    const handleStartQuiz = () => {
        setAppState("quiz");
    };

    const handleQuizComplete = (data: Record<string, string | string[]>) => {
        setUserData(data);
        console.log("Quiz completed with data:", data);
        setAppState("dashboard");
    };

    const handleBack = () => {
        setAppState("landing");
    };

    const goToLanding = () => {
        setAppState("landing");
        setUserData(null);
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {appState === "landing" && (
                    <LandingPage key="landing" onStart={handleStartQuiz} />
                )}
                {appState === "quiz" && (
                    <OnboardingQuiz key="quiz" onComplete={handleQuizComplete} onBack={handleBack} />
                )}
            </AnimatePresence>

            {/* Dashboard - rendered when appState is "dashboard" */}
            {appState === "dashboard" && (
                <UserDataContext.Provider value={{ userData, goToLanding }}>
                    {children}
                </UserDataContext.Provider>
            )}
        </>
    );
}
