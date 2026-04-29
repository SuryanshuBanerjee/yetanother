import { NextResponse } from "next/server";
import { getTrends } from "@/lib/trend-database";

// GET: Return all stored trends (most recent first)
// Used by TrendingStocks component to show search history as "stocks"

export async function GET() {
    try {
        const trends = await getTrends();

        // Map to the format TrendingStocks expects
        const stocks = trends.map((t, i) => ({
            id: String(i),
            name: t.keyword,
            symbol: t.symbol,
            score: t.score,
            change: t.change,
            volume: t.volume,
            risk: t.risk,
            category: t.category,
            phase: t.phase,
            lastSearched: t.lastSearched,
            searchCount: t.searchCount,
        }));

        return NextResponse.json({
            stocks,
            total: stocks.length,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Database fetch error:", error);
        return NextResponse.json({ stocks: [], total: 0, error: String(error) });
    }
}
