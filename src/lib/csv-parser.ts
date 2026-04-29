/**
 * CSV Parser for trend data files
 * Parses CSV files from data/ folder and converts to StoredTrend format
 */

import { promises as fs } from "fs";
import path from "path";

export interface CSVTrend {
    trend: string;
    searchVolume: string;
    started: string;
    ended: string;
    breakdown: string;
    exploreLink: string;
}

export interface ParsedTrend {
    keyword: string;
    volume: string;
    volumeNum: number;
    category: string;
    started: Date | null;
    country: string;
}

/**
 * Parse search volume string like "10m+", "500k+", "200k+" to formatted string and number
 */
function parseSearchVolume(vol: string): { formatted: string; numeric: number } {
    const cleaned = vol.toLowerCase().replace(/[+,]/g, "").trim();

    if (cleaned.includes("m")) {
        const num = parseFloat(cleaned.replace("m", ""));
        return { formatted: `${num}M`, numeric: num * 1_000_000 };
    }
    if (cleaned.includes("k")) {
        const num = parseFloat(cleaned.replace("k", ""));
        return { formatted: `${num}K`, numeric: num * 1_000 };
    }

    const num = parseInt(cleaned, 10) || 0;
    return { formatted: String(num), numeric: num };
}

/**
 * Extract category from trend breakdown (first meaningful term)
 */
function extractCategory(breakdown: string, trendName: string): string {
    if (!breakdown) return "General";

    // Split by comma and find first term that's not the trend name itself
    const terms = breakdown.split(",").map(t => t.trim());
    const trendLower = trendName.toLowerCase();

    for (const term of terms) {
        if (term.toLowerCase() !== trendLower && term.length > 2) {
            // Categorize based on keywords
            const termLower = term.toLowerCase();
            if (termLower.includes("nba") || termLower.includes("nfl") || termLower.includes("football") || termLower.includes("hockey") || termLower.includes("basketball") || termLower.includes("olympics")) {
                return "Sports";
            }
            if (termLower.includes("stock") || termLower.includes("crypto") || termLower.includes("bitcoin") || termLower.includes("trade")) {
                return "Finance";
            }
            if (termLower.includes("grammy") || termLower.includes("music") || termLower.includes("album") || termLower.includes("song")) {
                return "Music";
            }
            if (termLower.includes("movie") || termLower.includes("show") || termLower.includes("netflix") || termLower.includes("disney")) {
                return "Entertainment";
            }
            if (termLower.includes("fashion") || termLower.includes("style") || termLower.includes("aesthetic")) {
                return "Fashion";
            }
            if (termLower.includes("tech") || termLower.includes("ai") || termLower.includes("app")) {
                return "Tech";
            }
            if (termLower.includes("food") || termLower.includes("restaurant") || termLower.includes("recipe")) {
                return "Food";
            }
            if (termLower.includes("politics") || termLower.includes("trump") || termLower.includes("election")) {
                return "Politics";
            }
        }
    }

    return "Trending";
}

/**
 * Parse date string like "4 February 2026 at 05:00:00 UTC+5:30"
 */
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
        // Remove "at" and clean up
        const cleaned = dateStr.replace(" at ", " ").replace(/UTC[+-]\d+:\d+/, "").trim();
        return new Date(cleaned);
    } catch {
        return null;
    }
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

/**
 * Extract country code from filename like "trending_US_7d_20260207-2355.csv"
 */
function extractCountry(filename: string): string {
    const match = filename.match(/trending_([A-Z]{2})_/);
    return match ? match[1] : "US";
}

/**
 * Parse a CSV file and return parsed trends
 */
export async function parseCSVFile(filePath: string): Promise<ParsedTrend[]> {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim());
    const country = extractCountry(path.basename(filePath));

    // Skip header
    const dataLines = lines.slice(1);
    const trends: ParsedTrend[] = [];

    for (const line of dataLines) {
        const fields = parseCSVLine(line);
        if (fields.length < 5) continue;

        const [trend, searchVol, started, , breakdown] = fields;
        if (!trend || trend.length < 2) continue;

        const { formatted, numeric } = parseSearchVolume(searchVol);
        const category = extractCategory(breakdown, trend);

        trends.push({
            keyword: trend,
            volume: formatted,
            volumeNum: numeric,
            category,
            started: parseDate(started),
            country,
        });
    }

    return trends;
}

/**
 * Parse all CSV files in the data directory
 */
export async function parseAllCSVFiles(): Promise<ParsedTrend[]> {
    const dataDir = path.join(process.cwd(), "data");

    try {
        const files = await fs.readdir(dataDir);
        const csvFiles = files.filter(f => f.endsWith(".csv") && f.startsWith("trending_"));

        const allTrends: ParsedTrend[] = [];

        for (const file of csvFiles) {
            try {
                const trends = await parseCSVFile(path.join(dataDir, file));
                allTrends.push(...trends);
            } catch (e) {
                console.error(`Error parsing ${file}:`, e);
            }
        }

        // Sort by volume (highest first) and deduplicate by keyword
        const seen = new Set<string>();
        const uniqueTrends = allTrends
            .sort((a, b) => b.volumeNum - a.volumeNum)
            .filter(t => {
                const key = t.keyword.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

        return uniqueTrends;
    } catch (e) {
        console.error("Error reading data directory:", e);
        return [];
    }
}
