"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Clock, Sparkles } from "lucide-react";

interface Suggestion {
    keyword: string;
    symbol: string;
    category: string;
    volume: string;
    score: number;
}

interface SearchWithSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (keyword: string) => void;
    loading: boolean;
    validationError: string | null;
}

export default function SearchWithSuggestions({
    value,
    onChange,
    onSearch,
    loading,
    validationError,
}: SearchWithSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [allTrends, setAllTrends] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch all trends on mount for local filtering
    useEffect(() => {
        fetch("/api/trends/database")
            .then((r) => r.json())
            .then((data) => {
                const stocks = data.stocks || [];
                setAllTrends(
                    stocks.map((s: Record<string, unknown>) => ({
                        keyword: s.keyword || s.name,
                        symbol: s.symbol,
                        category: s.category,
                        volume: s.volume,
                        score: s.score,
                    }))
                );
            })
            .catch(() => setAllTrends([]));
    }, []);

    // Filter suggestions based on input
    useEffect(() => {
        if (value.length < 1) {
            setSuggestions([]);
            return;
        }

        const query = value.toLowerCase();
        const filtered = allTrends
            .filter(
                (t) =>
                    t.keyword.toLowerCase().includes(query) ||
                    t.category.toLowerCase().includes(query)
            )
            .slice(0, 8);

        setSuggestions(filtered);
        setSelectedIndex(-1);
    }, [value, allTrends]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            onSearch(suggestions[selectedIndex].keyword);
        } else if (value.trim()) {
            onSearch(value.trim());
        }
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (keyword: string) => {
        onChange(keyword);
        onSearch(keyword);
        setShowSuggestions(false);
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search any trend, hashtag, or topic..."
                        className="w-full py-4 px-6 pr-32 rounded-xl text-lg text-white outline-none transition-all placeholder:text-white/30"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: validationError
                                ? "1px solid rgba(255, 42, 109, 0.5)"
                                : showSuggestions && suggestions.length > 0
                                    ? "1px solid rgba(0, 240, 255, 0.4)"
                                    : "1px solid rgba(255,255,255,0.1)",
                            boxShadow:
                                showSuggestions && suggestions.length > 0
                                    ? "0 0 20px rgba(0, 240, 255, 0.1)"
                                    : "none",
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
                </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden"
                        style={{
                            background: "rgba(10, 10, 15, 0.98)",
                            border: "1px solid rgba(0, 240, 255, 0.2)",
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-neon-blue" />
                            <span className="text-xs font-mono text-white/40">
                                {suggestions.length} matching trends
                            </span>
                        </div>

                        {suggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.keyword}
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion.keyword)}
                                className={`w-full px-4 py-3 flex items-center gap-4 text-left transition-colors ${index === selectedIndex
                                        ? "bg-neon-blue/10"
                                        : "hover:bg-white/5"
                                    }`}
                                whileHover={{ x: 4 }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-neon-blue/20 to-purple-500/20 border border-white/10">
                                    <TrendingUp className="w-5 h-5 text-neon-blue" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium truncate">
                                            {suggestion.keyword}
                                        </span>
                                        <span className="text-xs font-mono text-neon-blue/60">
                                            {suggestion.symbol}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                        <span>{suggestion.category}</span>
                                        <span>•</span>
                                        <span>{suggestion.volume} searches</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <div className="text-lg font-bold text-white">{suggestion.score}</div>
                                    <div className="text-[10px] text-white/30 font-mono">SCORE</div>
                                </div>
                            </motion.button>
                        ))}

                        {value.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    onSearch(value);
                                    setShowSuggestions(false);
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 text-left border-t border-white/5 hover:bg-white/5 transition-colors"
                            >
                                <Clock className="w-4 h-4 text-purple-400" />
                                <span className="text-white/60">
                                    Search for &ldquo;<span className="text-white">{value}</span>&rdquo;
                                </span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Validation Error */}
            {validationError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 px-4 py-3 rounded-lg border border-decay-red/30 bg-decay-red/10 text-decay-red text-sm font-mono"
                >
                    {validationError}
                </motion.div>
            )}
        </div>
    );
}
