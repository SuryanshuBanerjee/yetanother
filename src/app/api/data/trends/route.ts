import { NextRequest, NextResponse } from "next/server";

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_BASE = "https://serpapi.com/search.json";

async function serpTrends(params: Record<string, string>): Promise<unknown> {
    if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY not set");
    const url = new URL(SERPAPI_BASE);
    url.searchParams.set("engine", "google_trends");
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("hl", "en");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
    return res.json();
}

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();
        if (!keyword) return NextResponse.json({ error: "Keyword required" }, { status: 400 });

        const searchTerm = keyword.replace("#", "").trim();

        const [timelineData, relatedData] = await Promise.all([
            serpTrends({ q: searchTerm, data_type: "TIMESERIES", date: "today 1-m" }) as Promise<{
                interest_over_time?: { timeline_data: Array<{ timestamp: string; date: string; values: Array<{ extracted_value: number }> }> };
            }>,
            serpTrends({ q: searchTerm, data_type: "RELATED_QUERIES", date: "today 1-m" }).catch(() => null) as Promise<{
                related_queries?: { rising?: Array<{ query: string; extracted_value: number }> };
            } | null>,
        ]);

        const timeline = (timelineData.interest_over_time?.timeline_data ?? []).map((t) => ({
            time: t.timestamp,
            formattedTime: t.date.split("–")[0].trim(),
            value: t.values[0]?.extracted_value ?? 0,
        }));

        const values = timeline.map((t) => t.value);
        const recentValues = values.slice(-7);
        const olderValues = values.slice(-14, -7);
        const recentAvg = recentValues.reduce((a, b) => a + b, 0) / (recentValues.length || 1);
        const olderAvg = olderValues.reduce((a, b) => a + b, 0) / (olderValues.length || 1);
        const velocity = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
        const peakValue = Math.max(...values, 0);
        const currentValue = values[values.length - 1] ?? 0;

        const relatedQueries = (relatedData?.related_queries?.rising ?? []).slice(0, 5).map((q) => ({
            query: q.query,
            value: q.extracted_value,
        }));

        return NextResponse.json({
            timeline,
            metrics: {
                velocity: Math.round(velocity),
                velocityLabel: velocity > 10 ? "Rising" : velocity < -10 ? "Falling" : "Stable",
                peakValue,
                currentValue,
                decayFromPeak: peakValue > 0 ? Math.round((1 - currentValue / peakValue) * 100) : 0,
            },
            relatedQueries,
        });
    } catch (error) {
        console.error("Trends API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch trends data", timeline: [], metrics: null },
            { status: 500 }
        );
    }
}
