// Simple in-memory trend database with file persistence
// Stores searched trends for the ticker and trending stocks grid

import { promises as fs } from "fs";
import path from "path";
import { parseAllCSVFiles, type ParsedTrend } from "./csv-parser";

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
let hasSeeded = false;

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

/**
 * Seed database from CSV files if empty
 */
async function seedFromCSV(): Promise<StoredTrend[]> {
    if (hasSeeded) return [];
    hasSeeded = true;

    console.log("[trend-database] Seeding from CSV files...");
    const csvTrends = await parseAllCSVFiles();

    if (csvTrends.length === 0) {
        console.log("[trend-database] No CSV trends found");
        return [];
    }

    // Convert ParsedTrend to StoredTrend (top 50 by volume)
    const seededTrends: StoredTrend[] = csvTrends.slice(0, 50).map((t: ParsedTrend, i: number) => {
        // Calculate synthetic score based on volume (higher volume = higher score)
        const volumeRank = Math.max(0, 100 - (i * 2));
        const score = Math.min(100, Math.max(20, volumeRank + Math.random() * 20 - 10));

        // Synthetic change based on position (top trends tend to be rising)
        const change = i < 10 ? Math.round((15 + Math.random() * 20) * 10) / 10
            : i < 25 ? Math.round((Math.random() * 20 - 5) * 10) / 10
                : Math.round((Math.random() * 10 - 10) * 10) / 10;

        return {
            keyword: t.keyword,
            symbol: generateSymbol(t.keyword),
            score: Math.round(score),
            change,
            volume: t.volume,
            risk: determineRisk(score, change),
            category: t.category,
            phase: score > 70 ? "Growth" : score > 50 ? "Peak" : score > 30 ? "Saturation" : "Decay",
            lastSearched: new Date().toISOString(),
            searchCount: 0,
        };
    });

    console.log(`[trend-database] Seeded ${seededTrends.length} trends from CSV`);
    return seededTrends;
}

async function loadDB(): Promise<StoredTrend[]> {
    if (trendCache) return trendCache;

    try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        trendCache = JSON.parse(data);

        // If database is empty, seed from CSV
        if (!trendCache || trendCache.length === 0) {
            trendCache = await seedFromCSV();
            if (trendCache.length > 0) {
                await saveDB(trendCache);
            }
        }

        return trendCache!;
    } catch {
        // No database file - seed from CSV
        trendCache = await seedFromCSV();
        if (trendCache.length > 0) {
            await saveDB(trendCache);
        }
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
