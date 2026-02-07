import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";
import { getTickerData, getTrends } from "@/lib/trend-database";

// Fetches trending data from multiple sources:
// 1. Our database (seeded from CSV files on startup)
// 2. Google Trends autocomplete/related for popular seed terms

export async function GET() {
    try {
        // Fetch database trends (auto-seeded from CSV) and Google trends in parallel
        const [dbTicker, dbStocks, googleTrending] = await Promise.all([
            getTickerData(),
            getTrends(),
            fetchTrendingFromGoogle(),
        ]);

        // Merge: database trends first (most relevant), then Google trending
        const ticker = [
            ...dbTicker,
            ...googleTrending.filter(
                (g) => !dbTicker.some((d) => d.name.toLowerCase() === g.name.toLowerCase())
            ),
        ];

        // Build stocks from database (CSV-seeded)
        const stocks = dbStocks.slice(0, 12).map((t, i) => ({
            id: String(i),
            name: t.keyword,
            symbol: t.symbol,
            score: t.score,
            change: t.change,
            volume: t.volume,
            risk: t.risk,
            category: t.category,
        }));

        return NextResponse.json({
            ticker: ticker.slice(0, 20),
            stocks,
            lastUpdated: new Date().toISOString(),
            _seededFromCSV: dbStocks.length > 0,
        });
    } catch (error) {
        console.error("Trending fetch error:", error);
        return NextResponse.json({
            ticker: [],
            stocks: [],
            lastUpdated: new Date().toISOString(),
            _error: true,
        });
    }
}

// Use Google Trends relatedQueries on popular seed terms to find what's trending
async function fetchTrendingFromGoogle(): Promise<
    Array<{ name: string; symbol: string; change: number; isUp: boolean }>
> {
    const seeds = ["trend", "viral", "TikTok trend"];
    const allResults: Array<{ name: string; symbol: string; change: number; isUp: boolean }> = [];

    for (const seed of seeds) {
        try {
            const data = await googleTrends.relatedQueries({ keyword: seed });
            const parsed = JSON.parse(data);
            const rising = parsed.default?.rankedList?.[1]?.rankedKeyword || [];

            for (const item of rising.slice(0, 5)) {
                const name = item.query;
                if (!name || allResults.some(r => r.name.toLowerCase() === name.toLowerCase())) continue;

                const words = name.split(/\s+/);
                const symbol = "#" + (words.length > 1
                    ? words.map((w: string) => w[0]).join("").toUpperCase().substring(0, 5)
                    : name.substring(0, 5).toUpperCase());

                allResults.push({
                    name,
                    symbol,
                    change: Math.round((item.value > 1000 ? 25 : item.value > 100 ? 15 : 5) * (0.5 + Math.random()) * 10) / 10,
                    isUp: true,
                });
            }

            // Only fetch from first successful seed to avoid rate limits
            if (allResults.length > 3) break;
        } catch (e) {
            console.log(`Related queries for "${seed}" failed:`, e);
        }
    }

    return allResults;
}

