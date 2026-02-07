import { NextRequest, NextResponse } from "next/server";
import googleTrends from "google-trends-api";

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Clean keyword
        const searchTerm = keyword.replace("#", "").trim();

        // Get interest over time (last 30 days)
        const interestData = await googleTrends.interestOverTime({
            keyword: searchTerm,
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endTime: new Date(),
            geo: "", // Worldwide
        });

        const parsedInterest = JSON.parse(interestData);
        const timeline = parsedInterest.default?.timelineData || [];

        // Calculate trend velocity
        const values = timeline.map((t: { value: number[] }) => t.value[0]);
        const recentValues = values.slice(-7);
        const olderValues = values.slice(-14, -7);

        const recentAvg = recentValues.reduce((a: number, b: number) => a + b, 0) / recentValues.length || 0;
        const olderAvg = olderValues.reduce((a: number, b: number) => a + b, 0) / olderValues.length || 0;

        const velocity = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
        const peakValue = Math.max(...values, 0);
        const currentValue = values[values.length - 1] || 0;

        // Get related queries
        let relatedQueries: { query: string; value: number }[] = [];
        try {
            const relatedData = await googleTrends.relatedQueries({ keyword: searchTerm });
            const parsedRelated = JSON.parse(relatedData);
            const rising = parsedRelated.default?.rankedList?.[1]?.rankedKeyword || [];
            relatedQueries = rising.slice(0, 5).map((q: { query: string; value: number }) => ({
                query: q.query,
                value: q.value,
            }));
        } catch {
            // Related queries may fail, continue without
        }

        return NextResponse.json({
            timeline: timeline.map((t: { time: string; formattedTime: string; value: number[] }) => ({
                time: t.time,
                formattedTime: t.formattedTime,
                value: t.value[0],
            })),
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
        console.error("Google Trends API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch Google Trends data", timeline: [], metrics: null },
            { status: 500 }
        );
    }
}
