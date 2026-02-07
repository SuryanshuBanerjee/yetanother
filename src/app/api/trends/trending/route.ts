import { NextResponse } from "next/server";
import googleTrends from "google-trends-api";
import { getTickerData, getTrends } from "@/lib/trend-database";

// Fetches trending data from multiple sources:
// 1. Our database (previously searched trends)
// 2. Google Trends autocomplete/related for popular seed terms
// 3. Hardcoded trending defaults as final fallback

export async function GET() {
    try {
        // Fetch database trends and Google trends in parallel
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

        // If we don't have enough, add defaults
        if (ticker.length < 5) {
            const defaults = getDefaultTicker();
            for (const d of defaults) {
                if (!ticker.some((t) => t.name.toLowerCase() === d.name.toLowerCase())) {
                    ticker.push(d);
                }
            }
        }

        // Build stocks from database + Google
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
        });
    } catch (error) {
        console.error("Trending fetch error:", error);
        return NextResponse.json({
            ticker: getDefaultTicker(),
            stocks: [],
            lastUpdated: new Date().toISOString(),
            _fallback: true,
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

function getDefaultTicker() {
    return [
        { name: "AI Trends", symbol: "#AI", change: 15.2, isUp: true },
        { name: "Sustainability", symbol: "#SUST", change: 8.4, isUp: true },
        { name: "Remote Work", symbol: "#RW", change: -2.1, isUp: false },
        { name: "Crypto", symbol: "#CRYP", change: 22.7, isUp: true },
        { name: "Mental Health", symbol: "#MH", change: 5.3, isUp: true },
        { name: "Clean Girl Aesthetic", symbol: "#CGA", change: 11.3, isUp: true },
        { name: "Cottagecore", symbol: "#CTGCR", change: -3.7, isUp: false },
        { name: "Quiet Luxury", symbol: "#QLUX", change: 4.2, isUp: true },
        { name: "Mob Wife", symbol: "#MOBWF", change: 18.9, isUp: true },
        { name: "De-influencing", symbol: "#DEINFL", change: -5.4, isUp: false },
    ];
}
