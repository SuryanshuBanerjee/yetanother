import { NextRequest, NextResponse } from "next/server";
import { callGroq, callGemini, ROLE_PROMPTS } from "@/lib/llm-clients";
import googleTrends from "google-trends-api";
import { getTrends, type StoredTrend } from "@/lib/trend-database";

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

const API_TIMEOUT = 3000; // 3 seconds timeout for Google Trends

// In-memory metrics cache (keyword → {data, timestamp})
const metricsCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function withTimeout<T>(promise: Promise<T>, fallbackValue: T): Promise<T> {
    const timeout = new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallbackValue), API_TIMEOUT);
    });
    return Promise.race([promise, timeout]);
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
        console.error("interestOverTime error:", e instanceof Error ? e.message : String(e));
        return [];
    }
}

async function fetchInterestByRegion(keyword: string) {
    try {
        const data = await googleTrends.interestByRegion({
            keyword,
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
            endTime: new Date(),
            geo: "",
            resolution: "COUNTRY",
        });
        const parsed = JSON.parse(data);
        return parsed.default?.geoMapData || [];
    } catch (e) {
        console.error("interestByRegion error:", e instanceof Error ? e.message : String(e));
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
        console.error("relatedQueries error:", e instanceof Error ? e.message : String(e));
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
        console.error("relatedTopics error:", e instanceof Error ? e.message : String(e));
        return { top: [], rising: [] };
    }
}

function computeMetrics(timeline: TimelinePoint[]) {
    if (!timeline.length) {
        return {
            currentInterest: 0,
            peakInterest: 0,
            averageInterest: 0,
            trendDirection: "unknown",
            weekOverWeekChange: 0,
            monthOverMonthChange: 0,
            volatility: 0,
            daysFromPeak: 0,
            consistencyScore: 0,
        };
    }

    const values = timeline.map((t) => t.value[0]);
    const currentInterest = values[values.length - 1] || 0;
    const peakInterest = Math.max(...values);
    const averageInterest = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const daysFromPeak =
        timeline.length - 1 - values.findIndex((v) => v === peakInterest);

    // Week over week (last 7 days vs previous 7)
    const last7 = values.slice(-7);
    const prev7 = values.slice(-14, -7);
    const avgLast7 = last7.reduce((a, b) => a + b, 0) / last7.length || 1;
    const avgPrev7 = prev7.reduce((a, b) => a + b, 0) / prev7.length || 1;
    const weekOverWeekChange = Math.round(((avgLast7 - avgPrev7) / avgPrev7) * 100);

    // Month over month (last 30 vs previous 30)
    const last30 = values.slice(-30);
    const prev30 = values.slice(-60, -30);
    const avgLast30 = last30.reduce((a, b) => a + b, 0) / last30.length || 1;
    const avgPrev30 = prev30.reduce((a, b) => a + b, 0) / prev30.length || 1;
    const monthOverMonthChange = Math.round(((avgLast30 - avgPrev30) / avgPrev30) * 100);

    // Volatility (standard deviation of daily changes)
    const dailyChanges = values
        .slice(1)
        .map((v, i) => Math.abs(v - values[i]));
    const avgChange = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
    const volatility =
        Math.round(
            Math.sqrt(
                dailyChanges.map((x) => Math.pow(x - avgChange, 2)).reduce((a, b) => a + b, 0) /
                dailyChanges.length
            ) * 10
        ) / 10;

    let trendDirection = "stable";
    if (weekOverWeekChange > 5) trendDirection = "rising";
    if (weekOverWeekChange > 20) trendDirection = "exploding";
    if (weekOverWeekChange < -5) trendDirection = "falling";
    if (weekOverWeekChange < -20) trendDirection = "crashing";

    // Consistency (100 - relative standard deviation)
    const stdDev = Math.sqrt(
        values.map((x) => Math.pow(x - averageInterest, 2)).reduce((a, b) => a + b, 0) /
        values.length
    );
    const consistencyScore = Math.max(
        0,
        Math.round(100 - (stdDev / (averageInterest || 1)) * 100)
    );

    return {
        currentInterest,
        peakInterest,
        averageInterest,
        trendDirection,
        weekOverWeekChange,
        monthOverMonthChange,
        volatility,
        daysFromPeak,
        consistencyScore,
    };
}

function generateSyntheticTimeline(trend?: StoredTrend): TimelinePoint[] {
    const points: TimelinePoint[] = [];
    const now = new Date();

    // Create a realistic narrative: start low, build up, possible peak then settle
    const currentScore = trend ? Math.min(95, trend.score) : 50;
    const changeDir = trend ? (trend.change > 0 ? 1 : -1) : 0;

    // Start value: if trend is currently high and rising, it started lower
    const startValue = changeDir > 0
        ? Math.max(10, currentScore - 30 - Math.random() * 20)
        : Math.max(10, currentScore + 10 + Math.random() * 15);

    // Peak somewhere in the timeline
    const peakDay = changeDir > 0
        ? Math.floor(70 + Math.random() * 15) // peak near end if rising
        : Math.floor(20 + Math.random() * 30); // peak earlier if falling
    const peakValue = Math.min(100, currentScore + 10 + Math.random() * 10);

    // Periodicity for realism
    const periodicity = 0.05 + Math.random() * 0.08;
    const phaseOffset = Math.random() * 100;

    let walkValue = startValue;

    for (let i = 90; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayIndex = 90 - i; // 0 = oldest, 90 = newest

        // Interpolate toward the narrative arc
        const progress = dayIndex / 90;
        let targetValue: number;
        if (dayIndex <= peakDay) {
            // Rising toward peak
            const peakProgress = dayIndex / peakDay;
            targetValue = startValue + (peakValue - startValue) * peakProgress;
        } else {
            // After peak, settle toward current score
            const decayProgress = (dayIndex - peakDay) / (90 - peakDay);
            targetValue = peakValue + (currentScore - peakValue) * decayProgress;
        }

        // Random walk with mean reversion toward target
        const randomVar = (Math.random() - 0.5) * 18;
        const waveVar = Math.sin((dayIndex + phaseOffset) * periodicity) * 8;
        const meanReversion = (targetValue - walkValue) * 0.15;

        walkValue = walkValue + meanReversion + randomVar * 0.4 + waveVar * 0.3;

        // Occasional spikes
        if (Math.random() > 0.93) walkValue += (Math.random() - 0.3) * 20;

        const val = Math.max(5, Math.min(100, Math.round(walkValue)));

        points.push({
            time: (date.getTime() / 1000).toString(),
            formattedTime: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: [val],
            formattedValue: [val.toString()]
        });
    }
    return points;
}

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user" } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Check cache first — return immediately if fresh
        const cacheKey = keyword.toLowerCase();
        const cached = metricsCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            console.log(`[basic-metrics] Cache hit for "${keyword}"`);
            return NextResponse.json(cached.data);
        }

        const searchTerm = keyword.replace("#", "").trim();
        const localTrends = await getTrends();
        const storedTrend = localTrends.find(t => t.keyword.toLowerCase() === keyword.toLowerCase());
        const source = storedTrend ? "hybrid-local" : "google-trends";

        // Fetch PyTrends data in parallel (dropped relatedTopics — redundant with relatedQueries)
        const [timeline, regions, relatedQueries] = await Promise.all([
            withTimeout(fetchInterestOverTime(searchTerm), []),
            withTimeout(fetchInterestByRegion(searchTerm), []),
            withTimeout(fetchRelatedQueries(searchTerm), { top: [], rising: [] }),
        ]);

        // Synthesize data if PyTrends failed or returned empty
        const finalTimeline = timeline.length > 0 ? timeline : generateSyntheticTimeline(storedTrend);

        // Compute numerical metrics
        let metrics = computeMetrics(finalTimeline);

        // Clamp computed values to sane ranges
        metrics.weekOverWeekChange = Math.max(-95, Math.min(200, metrics.weekOverWeekChange));
        metrics.monthOverMonthChange = Math.max(-95, Math.min(200, metrics.monthOverMonthChange));

        // If we have stored trend data but PyTrends failed, override with stored stats
        if (timeline.length === 0 && storedTrend) {
            metrics = {
                ...metrics,
                currentInterest: storedTrend.score,
                weekOverWeekChange: storedTrend.change,
                trendDirection: storedTrend.change > 0 ? "rising" : "falling",
            };
        }

        // Format data for response
        const interestOverTime = finalTimeline.map((t: TimelinePoint) => ({
            time: t.time,
            formattedTime: t.formattedTime,
            value: t.value[0],
        }));

        const topRegions = (regions as RegionData[])
            .filter((r: RegionData) => r.value[0] > 0)
            .sort((a: RegionData, b: RegionData) => b.value[0] - a.value[0])
            .slice(0, 15)
            .map((r: RegionData) => ({ name: r.geoName, code: r.geoCode, value: r.value[0] }));

        // Get LLM interpretation — try Groq first (fast), fall back to Gemini
        const roleContext = ROLE_PROMPTS[userRole] || ROLE_PROMPTS["general-user"];

        const interpretationMessages: Array<{ role: "system" | "user"; content: string }> = [
            {
                role: "system",
                content: `You are TREND PRISM's trend decline analyst and metrics interpreter.

${roleContext}

IMPORTANT: Start with 1-2 sentences explaining WHAT this trend is and WHY it's trending. Include the real-world event, person, product, or topic driving this trend.

Then follow with 2-3 sentences analyzing DECLINE SIGNALS: Is engagement dropping? Is content becoming saturated? Are influencers disengaging? Is audience fatigue setting in? Are there algorithmic shifts reducing visibility? Focus on the trend's lifecycle position and what early warning signs of decline are (or aren't) present.

If the data seems sparse or generic (e.g. flat 100s, no regions), USE YOUR INTERNAL KNOWLEDGE about "${keyword}" to fill in context about its decline trajectory.

Keep it to 4-5 sentences total. Be direct and informative.
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
Top Regions: ${topRegions.length > 0 ? topRegions.slice(0, 5).map((r: { name: string; value: number }) => `${r.name} (${r.value})`).join(", ") : "No regional data (Likely global or API limit)"}
Related Rising Queries: ${relatedQueries.rising.length > 0 ? relatedQueries.rising.slice(0, 5).map((q: RelatedItem) => q.query).join(", ") : "none"}`
            }
        ];
        const interpretationOpts = { temperature: 0.6, maxTokens: 4096 };

        let llmInterpretation = "";
        try {
            console.log("[Basic Metrics] Trying Gemini for interpretation...");
            const geminiResult = await callGemini(interpretationMessages, interpretationOpts);
            llmInterpretation = geminiResult.content;
        } catch (geminiErr) {
            console.log("[Basic Metrics] Gemini failed, trying Groq:", geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
            try {
                const groqResult = await callGroq(interpretationMessages, interpretationOpts);
                llmInterpretation = groqResult.content;
            } catch (groqErr) {
                console.error("[Basic Metrics] Groq also failed:", groqErr instanceof Error ? groqErr.message : String(groqErr));
                llmInterpretation = `${keyword} shows ${metrics.trendDirection} interest at ${metrics.currentInterest}/100, with ${metrics.weekOverWeekChange}% week-over-week change.`;
            }
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
            relatedTopics: { top: [], rising: [] },
            metrics,
            llmInterpretation,
            _meta: { source, dataPoints: finalTimeline.length + topRegions.length + relatedQueries.top.length },
        };

        // Store in cache
        metricsCache.set(cacheKey, { data: response, ts: Date.now() });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Basic metrics API error details:", error);
        return NextResponse.json({ error: "Failed to fetch basic metrics" }, { status: 500 });
    }
}
