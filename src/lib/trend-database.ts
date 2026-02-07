// Simple in-memory trend database with file persistence
// Stores searched trends for the ticker and trending stocks grid

import { promises as fs } from "fs";
import path from "path";

export interface StoredTrend {
    keyword: string;
    symbol: string;
    score: number;       // Health score 0-100
    change: number;      // Week-over-week % change
    volume: string;      // Search volume formatted
    risk: "low" | "medium" | "high" | "critical";
    category: string;
    phase: string;
    lastSearched: string; // ISO timestamp
    searchCount: number;
}

const DB_PATH = path.join(process.cwd(), "trend-database.json");

// In-memory cache
let trendCache: StoredTrend[] | null = null;

function generateSymbol(keyword: string): string {
    const words = keyword.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/);
    if (words.length === 1) {
        return "#" + words[0].substring(0, 5).toUpperCase();
    }
    return "#" + words.map(w => w[0]).join("").toUpperCase().substring(0, 5);
}

function determineRisk(score: number, change: number): StoredTrend["risk"] {
    if (score < 30 || change < -15) return "critical";
    if (score < 50 || change < -5) return "high";
    if (score < 70) return "medium";
    return "low";
}

async function loadDB(): Promise<StoredTrend[]> {
    if (trendCache) return trendCache;

    try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        trendCache = JSON.parse(data);
        return trendCache!;
    } catch {
        trendCache = [];
        return trendCache;
    }
}

async function saveDB(trends: StoredTrend[]): Promise<void> {
    trendCache = trends;
    await fs.writeFile(DB_PATH, JSON.stringify(trends, null, 2));
}

export async function getTrends(): Promise<StoredTrend[]> {
    const trends = await loadDB();
    // Sort by lastSearched descending (newest first)
    return trends.sort((a, b) => new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime());
}

export async function addOrUpdateTrend(data: {
    keyword: string;
    score: number;
    change: number;
    volume: number;
    category: string;
    phase: string;
}): Promise<StoredTrend> {
    const trends = await loadDB();

    const existing = trends.findIndex(
        t => t.keyword.toLowerCase() === data.keyword.toLowerCase()
    );

    const volumeStr = data.volume >= 1000000
        ? `${(data.volume / 1000000).toFixed(1)}M`
        : data.volume >= 1000
            ? `${(data.volume / 1000).toFixed(1)}K`
            : String(data.volume);

    const trend: StoredTrend = {
        keyword: data.keyword,
        symbol: generateSymbol(data.keyword),
        score: Math.round(data.score),
        change: Math.round(data.change * 10) / 10,
        volume: volumeStr,
        risk: determineRisk(data.score, data.change),
        category: data.category,
        phase: data.phase,
        lastSearched: new Date().toISOString(),
        searchCount: existing >= 0 ? (trends[existing].searchCount || 0) + 1 : 1,
    };

    if (existing >= 0) {
        trends[existing] = trend;
    } else {
        trends.unshift(trend);
    }

    // Keep max 50 trends
    if (trends.length > 50) trends.length = 50;

    await saveDB(trends);
    return trend;
}

export async function getTickerData(): Promise<Array<{
    name: string;
    symbol: string;
    change: number;
    isUp: boolean;
}>> {
    const trends = await getTrends();
    return trends.slice(0, 15).map(t => ({
        name: t.keyword,
        symbol: t.symbol,
        change: t.change,
        isUp: t.change >= 0,
    }));
}
