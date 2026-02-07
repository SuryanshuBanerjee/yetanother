import { NextRequest, NextResponse } from "next/server";
import { callGroq, ROLE_PROMPTS } from "@/lib/llm-clients";
import googleTrends from "google-trends-api";

interface TimelinePoint {
    time: string;
    formattedTime: string;
    value: number[];
    formattedValue: string[];
}

interface RegionData {
    geoCode: string;
    geoName: string;
    value: number[];
    formattedValue: string[];
    maxValueIndex: number;
}

interface RelatedItem {
    query?: string;
    topic?: { title: string; type: string };
    value: number;
    formattedValue: string;
    link: string;
}

async function fetchInterestOverTime(keyword: string) {
    try {
        const data = await googleTrends.interestOverTime({
            keyword,
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
            endTime: new Date(),
            geo: "",
        });
        const parsed = JSON.parse(data);
        return parsed.default?.timelineData || [];
    } catch (e) {
        console.error("interestOverTime error:", e);
        return [];
    }
}

async function fetchInterestByRegion(keyword: string) {
    try {
        const data = await googleTrends.interestByRegion({
            keyword,
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endTime: new Date(),
            geo: "",
            resolution: "COUNTRY",
        });
        const parsed = JSON.parse(data);
        return parsed.default?.geoMapData || [];
    } catch (e) {
        console.error("interestByRegion error:", e);
        return [];
    }
}

async function fetchRelatedQueries(keyword: string) {
    try {
        const data = await googleTrends.relatedQueries({ keyword });
        const parsed = JSON.parse(data);
        const top = parsed.default?.rankedList?.[0]?.rankedKeyword || [];
        const rising = parsed.default?.rankedList?.[1]?.rankedKeyword || [];
        return { top: top.slice(0, 10), rising: rising.slice(0, 10) };
    } catch (e) {
        console.error("relatedQueries error:", e);
        return { top: [], rising: [] };
    }
}

async function fetchRelatedTopics(keyword: string) {
    try {
        const data = await googleTrends.relatedTopics({ keyword });
        const parsed = JSON.parse(data);
        const top = parsed.default?.rankedList?.[0]?.rankedKeyword || [];
        const rising = parsed.default?.rankedList?.[1]?.rankedKeyword || [];
        return { top: top.slice(0, 10), rising: rising.slice(0, 10) };
    } catch (e) {
        console.error("relatedTopics error:", e);
        return { top: [], rising: [] };
    }
}

function computeMetrics(timeline: TimelinePoint[]) {
    if (!timeline.length) {
        return {
            currentInterest: 0,
            peakInterest: 0,
            averageInterest: 0,
            trendDirection: "unknown" as const,
            weekOverWeekChange: 0,
            monthOverMonthChange: 0,
            volatility: 0,
            daysFromPeak: 0,
            consistencyScore: 0,
        };
    }

    const values = timeline.map((t: TimelinePoint) => t.value[0]);
    const current = values[values.length - 1] || 0;
    const peak = Math.max(...values);
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;

    // Week-over-week
    const recent7 = values.slice(-7);
    const prev7 = values.slice(-14, -7);
    const recentAvg = recent7.reduce((a: number, b: number) => a + b, 0) / (recent7.length || 1);
    const prevAvg = prev7.reduce((a: number, b: number) => a + b, 0) / (prev7.length || 1);
    const wow = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

    // Month-over-month
    const recent30 = values.slice(-30);
    const prev30 = values.slice(-60, -30);
    const recent30Avg = recent30.reduce((a: number, b: number) => a + b, 0) / (recent30.length || 1);
    const prev30Avg = prev30.reduce((a: number, b: number) => a + b, 0) / (prev30.length || 1);
    const mom = prev30Avg > 0 ? ((recent30Avg - prev30Avg) / prev30Avg) * 100 : 0;

    // Volatility (standard deviation / mean)
    const variance = values.reduce((sum: number, v: number) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const volatility = avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 0;

    // Days from peak
    const peakIndex = values.indexOf(peak);
    const daysFromPeak = values.length - 1 - peakIndex;

    // Consistency (how many days above 50% of peak)
    const threshold = peak * 0.5;
    const aboveThreshold = values.filter((v: number) => v >= threshold).length;
    const consistencyScore = Math.round((aboveThreshold / values.length) * 100);

    // Direction
    let trendDirection: "rising" | "falling" | "stable" | "volatile" | "unknown";
    if (wow > 10) trendDirection = "rising";
    else if (wow < -10) trendDirection = "falling";
    else if (volatility > 40) trendDirection = "volatile";
    else trendDirection = "stable";

    return {
        currentInterest: Math.round(current),
        peakInterest: Math.round(peak),
        averageInterest: Math.round(avg),
        trendDirection,
        weekOverWeekChange: Math.round(wow * 10) / 10,
        monthOverMonthChange: Math.round(mom * 10) / 10,
        volatility: Math.round(volatility * 10) / 10,
        daysFromPeak,
        consistencyScore,
    };
}

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user" } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        const searchTerm = keyword.replace("#", "").trim();

        // Fetch all PyTrends data in parallel
        const [timeline, regions, relatedQueries, relatedTopics] = await Promise.all([
            fetchInterestOverTime(searchTerm),
            fetchInterestByRegion(searchTerm),
            fetchRelatedQueries(searchTerm),
            fetchRelatedTopics(searchTerm),
        ]);

        // Compute numerical metrics
        const metrics = computeMetrics(timeline);

        // Format data for response
        const interestOverTime = timeline.map((t: TimelinePoint) => ({
            time: t.time,
            formattedTime: t.formattedTime,
            value: t.value[0],
        }));

        const topRegions = (regions as RegionData[])
            .filter((r: RegionData) => r.value[0] > 0)
            .sort((a: RegionData, b: RegionData) => b.value[0] - a.value[0])
            .slice(0, 15)
            .map((r: RegionData) => ({ name: r.geoName, code: r.geoCode, value: r.value[0] }));

        // Get LLM interpretation of the basic metrics
        const roleContext = ROLE_PROMPTS[userRole] || ROLE_PROMPTS["general-user"];

        let llmInterpretation = "";
        try {
            const llmResult = await callGroq(
                [
                    {
                        role: "system",
                        content: `You are TREND PRISM's metrics interpreter.

${roleContext}

Given raw Google Trends data, provide a sharp, data-driven interpretation.
Include specific numbers (percentages, timeframes).
Keep it to 3-4 sentences. Be direct and actionable.
Sound intelligent but speak simply — no fluff, no hedging.`
                    },
                    {
                        role: "user",
                        content: `Interpret these Google Trends metrics for "${keyword}":

Current Interest Level: ${metrics.currentInterest}/100
Peak Interest: ${metrics.peakInterest}/100
Average Interest: ${metrics.averageInterest}/100
Direction: ${metrics.trendDirection}
Week-over-Week Change: ${metrics.weekOverWeekChange}%
Month-over-Month Change: ${metrics.monthOverMonthChange}%
Volatility: ${metrics.volatility}%
Days Since Peak: ${metrics.daysFromPeak}
Consistency Score: ${metrics.consistencyScore}/100
Top Regions: ${topRegions.slice(0, 5).map((r: { name: string; value: number }) => `${r.name} (${r.value})`).join(", ")}
Related Rising Queries: ${relatedQueries.rising.slice(0, 5).map((q: RelatedItem) => q.query).join(", ") || "none"}`
                    }
                ],
                { temperature: 0.6, maxTokens: 400 }
            );
            llmInterpretation = llmResult.content;
        } catch (e) {
            console.error("LLM interpretation error:", e);
            llmInterpretation = `${keyword} shows ${metrics.trendDirection} interest at ${metrics.currentInterest}/100, with ${metrics.weekOverWeekChange}% week-over-week change.`;
        }

        const response = {
            keyword,
            searchTerm,
            interestOverTime,
            topRegions,
            relatedQueries: {
                top: relatedQueries.top.map((q: RelatedItem) => ({ query: q.query, value: q.value })),
                rising: relatedQueries.rising.map((q: RelatedItem) => ({ query: q.query, value: q.value })),
            },
            relatedTopics: {
                top: relatedTopics.top.map((t: RelatedItem) => ({
                    title: t.topic?.title || t.query,
                    type: t.topic?.type || "query",
                    value: t.value,
                })),
                rising: relatedTopics.rising.map((t: RelatedItem) => ({
                    title: t.topic?.title || t.query,
                    type: t.topic?.type || "query",
                    value: t.value,
                })),
            },
            metrics,
            llmInterpretation,
            _meta: {
                dataPoints: interestOverTime.length,
                regionsFound: topRegions.length,
                relatedQueriesFound: relatedQueries.top.length + relatedQueries.rising.length,
                fetchedAt: new Date().toISOString(),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Basic metrics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch basic metrics", details: String(error) },
            { status: 500 }
        );
    }
}
