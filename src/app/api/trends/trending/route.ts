import { NextResponse } from "next/server";
import { getTickerData, getTrends } from "@/lib/trend-database";

const SERPAPI_KEY = process.env.SERPAPI_KEY;

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

async function fetchTrendingFromGoogle(): Promise<
    Array<{ name: string; symbol: string; change: number; isUp: boolean }>
> {
    if (!SERPAPI_KEY) return [];
    try {
        const url = new URL("https://serpapi.com/search.json");
        url.searchParams.set("engine", "google_trends");
        url.searchParams.set("api_key", SERPAPI_KEY);
        url.searchParams.set("q", "viral");
        url.searchParams.set("data_type", "RELATED_QUERIES");
        url.searchParams.set("date", "today 1-m");
        url.searchParams.set("hl", "en");

        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const data = await res.json() as {
            related_queries?: { rising?: Array<{ query: string; extracted_value: number }> };
        };

        return (data.related_queries?.rising ?? []).slice(0, 8).map((item) => {
            const words = item.query.split(/\s+/);
            const symbol = "#" + (words.length > 1
                ? words.map((w: string) => w[0]).join("").toUpperCase().substring(0, 5)
                : item.query.substring(0, 5).toUpperCase());
            return {
                name: item.query,
                symbol,
                change: Math.round((item.extracted_value > 1000 ? 25 : item.extracted_value > 100 ? 15 : 5) * (0.5 + Math.random()) * 10) / 10,
                isUp: true,
            };
        });
    } catch (e) {
        console.log("fetchTrendingFromGoogle failed:", e);
        return [];
    }
}

