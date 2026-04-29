"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { User, Megaphone, Shield, Users } from "lucide-react";

export type UserRole = "content-creator" | "general-user" | "marketing-team" | "platform-moderator";

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function useRole() {
    const context = useContext(RoleContext);
    if (!context) throw new Error("useRole must be used within RoleProvider");
    return context;
}

export function RoleProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>("general-user");
    return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

const roles: { id: UserRole; label: string; icon: typeof User }[] = [
    { id: "content-creator", label: "Creator", icon: User },
    { id: "general-user", label: "User", icon: Users },
    { id: "marketing-team", label: "Marketing", icon: Megaphone },
    { id: "platform-moderator", label: "Moderator", icon: Shield },
];

export default function RoleSelector() {
    const { role, setRole } = useRole();

    return (
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest px-2">View As:</span>
            {roles.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                    <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${isActive
                                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Icon className="w-3 h-3" />
                        {r.label}
                    </button>
                );
            })}
        </div>
    );
}
