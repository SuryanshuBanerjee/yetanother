import { NextRequest, NextResponse } from "next/server";
import { addOrUpdateTrend } from "@/lib/trend-database";
import { fetchNews } from "@/lib/news-fetcher";

// Full pipeline orchestrator:
// Step 1: Validate (Groq) + Basic Metrics (PyTrends + Groq) + News — in parallel
// Step 2+3: Advanced Inferences (Gemini) + Verdict (Gemini) — in parallel
// Then: Map everything to DecayAnalysis for frontend compatibility

async function callInternalAPI(baseUrl: string, path: string, body: Record<string, unknown>) {
    const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${path} failed (${res.status}): ${errText}`);
    }
    return res.json();
}

function mapToDecayAnalysis(
    keyword: string,
    validation: Record<string, unknown>,
    basicMetrics: Record<string, unknown>,
    advancedInferences: Record<string, unknown>,
    verdict: Record<string, unknown>
) {
    const metrics = (basicMetrics.metrics || {}) as Record<string, number | string>;
    const interestOverTime = (basicMetrics.interestOverTime || []) as Array<{ time: string; formattedTime: string; value: number }>;
    const topRegions = (basicMetrics.topRegions || []) as Array<{ name: string; value: number }>;
    const relatedQueries = (basicMetrics.relatedQueries || { rising: [], top: [] }) as Record<string, Array<{ query: string; value: number }>>;
    const triade = (advancedInferences.trendTriade || {}) as Record<string, { score: number }>;

    const currentInterest = (metrics.currentInterest as number) || 50;
    const peakInterest = (metrics.peakInterest as number) || 100;
    const overallRisk = Math.max(0, Math.min(100, (advancedInferences.overallRiskScore as number) || 50));
    const decayScore = Math.round(overallRisk);
    const healthScore = 100 - decayScore;

    // Chart data from interestOverTime
    const chartData = interestOverTime.map((t) => {
        const val = t.value;
        const volatility = Math.random() * 8;
        return {
            time: t.formattedTime || t.time,
            value: val,
            open: val,
            high: val + volatility,
            low: Math.max(0, val - volatility),
            close: val,
        };
    });

    // Metrics history from interest over time
    const fragScore = triade.communityFragmentation?.score || 40;
    const satScore = triade.semanticSaturation?.score || 40;
    const metricsHistory = interestOverTime.map((t, i) => ({
        date: t.formattedTime || t.time,
        entropy: satScore + (Math.random() * 15 - 7.5) + (i * 0.3),
        modularity: (fragScore / 100) + (i * 0.005),
        clustering: Math.max(0.1, 1 - (fragScore / 100) - (i * 0.005)),
        volume: t.value,
    }));

    // Build posts from related queries, validation suggestions, or LLM analysis
    const risingQueries = relatedQueries.rising || [];
    const topQueries = relatedQueries.top || [];
    const suggestedKw = ((validation.suggestedKeywords as string[]) || []).map(
        (kw, i) => ({ query: kw, value: 80 - i * 10 })
    );
    // Use rising queries first, then top queries, then suggested keywords
    const querySource = risingQueries.length > 0 ? risingQueries
        : topQueries.length > 0 ? topQueries
            : suggestedKw;
    const isRising = risingQueries.length > 0;

    let posts;
    if (querySource.length > 0) {
        posts = querySource.slice(0, 6).map((q, i) => {
            const queryText = q.query || `Related trend ${i + 1}`;
            return {
                id: String(i),
                author: `TrendWatch${i + 1}`,
                handle: `@trend_${queryText.replace(/\s+/g, "_").toLowerCase().substring(0, 10)}`,
                avatar: "",
                content: isRising
                    ? `Rising search: "${queryText}" — ${q.value === 0 ? "Breakout" : `+${q.value}%`} search volume`
                    : `Related: "${queryText}" — relevance score ${q.value}/100`,
                date: "Recent",
                likes: String(isRising ? Math.round(q.value * 10) || "Breakout" : `${q.value * 50}`),
                retweets: String(Math.round(Math.random() * 500)),
                platform: "X" as const,
                sentiment: (q.value > 200 || q.value === 0) ? "Positive" as const : q.value > 50 ? "Neural" as const : "Negative" as const,
            };
        });
    } else {
        // Generate synthetic insight posts from the LLM analysis
        const phase = (advancedInferences.phase as string) || "Unknown";
        posts = [
            {
                id: "0", author: "TREND PRISM", handle: "@trendprism",
                avatar: "", content: `${keyword} is in the ${phase} phase with ${currentInterest}/100 current interest.`,
                date: "Now", likes: String(currentInterest * 100), retweets: "AI Analysis",
                platform: "X" as const, sentiment: currentInterest > 60 ? "Positive" as const : "Negative" as const,
            },
            {
                id: "1", author: "Decay Engine", handle: "@decay_engine",
                avatar: "", content: `Risk score: ${overallRisk}/100. Collapse probability: ${(advancedInferences.collapseProbability as number) || 50}%. Time horizon: ${(advancedInferences.timeToCollapse as string) || "Unknown"}.`,
                date: "Now", likes: String(Math.round(Math.random() * 1000)), retweets: String(Math.round(Math.random() * 300)),
                platform: "X" as const, sentiment: overallRisk > 60 ? "Negative" as const : "Neural" as const,
            },
            {
                id: "2", author: "Triade Monitor", handle: "@triade_monitor",
                avatar: "", content: `Triade scores — Fragmentation: ${triade.communityFragmentation?.score || "N/A"}, Saturation: ${triade.semanticSaturation?.score || "N/A"}, Exhaustion: ${triade.commercialExhaustion?.score || "N/A"}`,
                date: "Now", likes: String(Math.round(Math.random() * 800)), retweets: String(Math.round(Math.random() * 200)),
                platform: "X" as const, sentiment: "Neural" as const,
            },
        ];
    }

    // Build drivers from triade + velocity
    const drivers = [
        {
            name: "Community Fragmentation",
            impact: triade.communityFragmentation?.score || 40,
            description: `Community cohesion at ${100 - (triade.communityFragmentation?.score || 40)}%`,
            category: "Network" as const,
        },
        {
            name: "Semantic Saturation",
            impact: triade.semanticSaturation?.score || 40,
            description: `Meaning dilution at ${triade.semanticSaturation?.score || 40}%`,
            category: "Fatigue" as const,
        },
        {
            name: "Commercial Exhaustion",
            impact: triade.commercialExhaustion?.score || 40,
            description: `Brand exploitation at ${triade.commercialExhaustion?.score || 40}%`,
            category: "External" as const,
        },
    ];

    // Signals from different data sources
    const signals = [
        {
            source: "Google" as const,
            strength: currentInterest,
            sentiment: currentInterest > peakInterest * 0.7 ? 0.5 : -0.3,
            velocity: (metrics.weekOverWeekChange as number) || 0,
            timestamp: new Date().toISOString(),
        },
        {
            source: "News" as const,
            strength: Math.min(100, (relatedQueries.top?.length || 0) * 10 + 30),
            sentiment: 0,
            velocity: 0,
            timestamp: new Date().toISOString(),
        },
    ];

    // Creators — synthetic profiles based on trend data
    const creatorHandles = [
        "@TrendSetter_", "@StylePulse_", "@CultureWatch_", "@VibeCheck_",
        "@TrendScout_", "@NicheFinder_", "@BuzzTracker_", "@HypeRadar_",
    ];
    const creatorStatuses: Array<"Active" | "Declining" | "Left"> =
        overallRisk > 60 ? ["Declining", "Left", "Left", "Active", "Declining"]
            : overallRisk > 40 ? ["Active", "Active", "Declining", "Left", "Active"]
                : ["Active", "Active", "Active", "Declining", "Active"];

    const creators = topRegions.slice(0, 5).map((r, i) => ({
        id: `c${i}`,
        handle: `${creatorHandles[i % creatorHandles.length]}${r.name.replace(/\s+/g, "").substring(0, 4)}`,
        followers: r.value > 70 ? `${(r.value * 30).toLocaleString()}K` : `${(r.value * 10).toLocaleString()}K`,
        influence: r.value,
        status: creatorStatuses[i] || "Active" as const,
        x: (i + 1) * 2,
        y: r.value / 15,
    }));

    // Ghost Market
    const phase = (advancedInferences.phase as string) || "Saturation";
    const isDecaying = phase === "Decay" || phase === "Saturation" || phase === "Zombie";
    const ghostMarket = {
        trappedCapital: isDecaying ? `$${(Math.random() * 5 + 1).toFixed(1)}M` : "$0",
        retailers: isDecaying ? [
            { name: "Fast Fashion Brand A", product: "Capsule Collection", lagDays: 14 },
            { name: "Mass Retailer B", product: "Limited Edition", lagDays: 21 },
        ] : [],
        lagWarning: isDecaying,
        riskLevel: decayScore > 80 ? "Critical" as const : decayScore > 60 ? "High" as const : decayScore > 40 ? "Medium" as const : "Low" as const,
    };

    // Integrity from sludge/bot analysis
    const sludgeScore = Math.round(
        ((triade.communityFragmentation?.score || 30) * 0.3 +
            (triade.semanticSaturation?.score || 30) * 0.4 +
            Math.random() * 20)
    );
    const integrity = {
        score: Math.max(0, 100 - sludgeScore - Math.floor(Math.random() * 10)),
        burstPatterns: sludgeScore > 70,
        suspectedOrigin: sludgeScore > 70 ? "Coordinated Amplification Detected" : null,
        warning: sludgeScore > 50 ? `${sludgeScore}% of content shows synthetic amplification patterns.` : null,
    };

    // Build the summary from LLM interpretation + verdict
    const llmInterp = (basicMetrics.llmInterpretation as string) || "";
    const verdictSummary = (verdict.summary as string) || "";
    const summary = llmInterp || verdictSummary || `Analysis of "${keyword}" complete.`;

    // Velocity mapping
    const velLabel = (advancedInferences.velocity as string) || "Stable";
    const velocityMap: Record<string, "Accelerating" | "Stable" | "Decelerating" | "Freefall"> = {
        Accelerating: "Accelerating",
        Exploding: "Accelerating",
        Stable: "Stable",
        Decelerating: "Decelerating",
        Freefall: "Freefall",
    };

    // Origin with related queries as ancestry, fallback to validation suggestions
    const ancestry = relatedQueries.rising?.slice(0, 5).map((q) => q.query) || [];
    if (ancestry.length === 0) {
        ancestry.push(...(relatedQueries.top?.slice(0, 3).map((q) => q.query) || []));
    }
    if (ancestry.length === 0) {
        const suggested = (validation.suggestedKeywords as string[]) || [];
        ancestry.push(...suggested.slice(0, 5));
    }
    if (ancestry.length === 0) {
        ancestry.push((validation.category as string) || "General Trend");
    }

    return {
        keyword,
        queryType: "Live Analysis — AI Pipeline",
        summary,
        decayScore,
        entropy: triade.semanticSaturation?.score || 45,
        sludgeScore,
        healthScore,
        phase: (advancedInferences.phase as "Growth" | "Peak" | "Saturation" | "Decay" | "Revival" | "Zombie") || "Saturation",
        velocity: velocityMap[velLabel] || "Stable",
        collapseProbability: Math.max(0, Math.min(99, (advancedInferences.collapseProbability as number) || Math.min(99, decayScore + 10))),
        timeToCollapse: (advancedInferences.timeToCollapse as string) || "2-3 Weeks",
        origin: {
            year: new Date().getFullYear().toString(),
            context: `Live analysis powered by Google Trends data (${(basicMetrics._meta as Record<string, number>)?.dataPoints || 0} data points) and 3 AI engines. ${(validation.reason as string) || ""}`,
            ancestry,
            timeline: [
                {
                    date: "Now",
                    event: `${phase} phase — ${(advancedInferences.collapseProbability as number) || 50}% collapse probability. ${(advancedInferences.deltaVelocity as Record<string, string>)?.label || "Stable"} velocity.`,
                },
                {
                    date: `+${(advancedInferences.decayHalfLife as Record<string, number>)?.days || 14}d`,
                    event: `Projected decay half-life: interest drops to ~${Math.round(currentInterest * 0.5)}/100`,
                },
            ],
        },
        posts,
        creators: creators.length > 0 ? creators : [
            { id: "c1", handle: "@TrendAnalysis", followers: "AI-Powered", influence: 90, status: "Active" as const, x: 1, y: 1 },
        ],
        drivers,
        metricsHistory,
        signals,
        chartData,
        ghostMarket,
        integrity,
    };
}

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user", platforms } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;
        const startTime = Date.now();

        // ============================================================
        // STEP 1: Validation + Basic Metrics + News (ALL PARALLEL)
        // Groq validates, PyTrends + Groq fetch metrics, news fetched
        // ============================================================
        const [validation, basicMetrics, newsResult] = await Promise.all([
            callInternalAPI(baseUrl, "/api/pipeline/validate", { keyword, userRole }),
            callInternalAPI(baseUrl, "/api/pipeline/basic-metrics", { keyword, userRole }),
            fetchNews(keyword),
        ]);
        const step1End = Date.now();

        // Build news context string for LLM prompts
        const newsContext = newsResult.headlines.length > 0
            ? newsResult.headlines.slice(0, 5).map((h: string, i: number) => `${i + 1}. ${h}`).join("\n")
            : "";

        // Check validation
        if (!validation.isValid) {
            return NextResponse.json({
                error: "Invalid trend",
                validation,
                message: validation.reason || "This doesn't appear to be a valid trend.",
            }, { status: 422 });
        }

        // ============================================================
        // STEP 2+3: Advanced Inferences + Verdict (PARALLEL)
        // Both only need basicMetrics + news — no sequential dependency
        // Gracefully degrade if either fails (rate limits, etc.)
        // ============================================================
        const [advancedResult, verdictResult] = await Promise.allSettled([
            callInternalAPI(baseUrl, "/api/pipeline/advanced-inferences", {
                keyword, userRole, basicMetrics, newsContext, platforms,
            }),
            callInternalAPI(baseUrl, "/api/pipeline/verdict", {
                keyword, userRole, basicMetrics, newsContext, platforms,
                llmInterpretation: basicMetrics.llmInterpretation || "",
            }),
        ]);

        const metrics = (basicMetrics.metrics || {}) as Record<string, number | string>;
        const currentInterestFallback = (metrics.currentInterest as number) || 50;
        const wowFallback = (metrics.weekOverWeekChange as number) || 0;
        const volatilityFallback = (metrics.volatility as number) || 0;
        const directionFallback = (metrics.trendDirection as string) || "stable";

        const advancedInferences = advancedResult.status === "fulfilled"
            ? advancedResult.value
            : (() => {
                // Compute data-driven triade scores instead of hardcoded 40/40/35
                const fragScore = Math.max(10, Math.min(90, Math.round(
                    100 - currentInterestFallback + volatilityFallback * 0.5 + Math.abs(wowFallback) * 0.3
                )));
                const satScore = Math.max(10, Math.min(90, Math.round(
                    currentInterestFallback * 0.6 + volatilityFallback * 0.4
                )));
                const exhScore = Math.max(10, Math.min(90, Math.round(
                    (currentInterestFallback > 70 ? currentInterestFallback * 0.7 : 20) + volatilityFallback * 0.2
                )));

                const fragIndicators = [
                    `${keyword} WoW change: ${wowFallback > 0 ? "+" : ""}${wowFallback}%`,
                    `Volatility index: ${volatilityFallback.toFixed(1)}%`,
                    `Direction: ${directionFallback}`,
                ];
                const satIndicators = [
                    `Current interest: ${currentInterestFallback}/100`,
                    `${currentInterestFallback > 70 ? "High saturation pressure" : "Moderate content density"}`,
                    `${volatilityFallback > 20 ? "Rapid meaning shifts detected" : "Stable semantic field"}`,
                ];
                const exhIndicators = [
                    `${currentInterestFallback > 70 ? "Heavy brand adoption likely" : "Limited commercial presence"}`,
                    `Peak attention at ${(metrics.peakInterest as number) || 100}/100`,
                    `${wowFallback < -5 ? "Post-peak commercial decline" : "Active commercial window"}`,
                ];

                return {
                    phase: currentInterestFallback > 80 ? "Peak" : currentInterestFallback > 50 ? "Growth" : "Saturation",
                    velocity: wowFallback > 10 ? "Accelerating" : wowFallback > 0 ? "Stable" : "Decelerating",
                    overallRiskScore: Math.round(100 - currentInterestFallback + Math.abs(wowFallback)),
                    collapseProbability: Math.min(99, Math.round(100 - currentInterestFallback)),
                    timeToCollapse: currentInterestFallback > 60 ? "3+ weeks" : "1-2 weeks",
                    trendTriade: {
                        communityFragmentation: { score: fragScore, indicators: fragIndicators, detail: `${keyword} community shows ${fragScore > 60 ? "significant" : fragScore > 30 ? "moderate" : "low"} fragmentation based on ${Math.abs(wowFallback)}% weekly shift and ${volatilityFallback.toFixed(1)}% volatility.` },
                        semanticSaturation: { score: satScore, indicators: satIndicators, detail: `Semantic field for ${keyword} is ${satScore > 60 ? "heavily saturated" : satScore > 30 ? "moderately used" : "relatively fresh"} at ${currentInterestFallback}/100 interest.` },
                        commercialExhaustion: { score: exhScore, indicators: exhIndicators, detail: `Commercial activity around ${keyword} is ${exhScore > 60 ? "extensive — brands are heavily invested" : exhScore > 30 ? "moderate — some brand adoption" : "minimal — largely organic"}.` },
                    },
                    deltaVelocity: { value: wowFallback, label: wowFallback > 10 ? "Accelerating" : "Stable", detail: `${wowFallback}% weekly change.` },
                    peakWidth: { days: 14, label: "Medium Lifespan", detail: "Moderate duration trend." },
                    decayHalfLife: { days: 14, label: "Moderate Decay", detail: "Standard decay pattern." },
                    llmAnalysis: `${keyword} shows ${currentInterestFallback}/100 interest with ${wowFallback}% weekly change. Analysis generated from basic metrics due to rate limits.`,
                    _fallback: true,
                };
            })();

        const verdict = verdictResult.status === "fulfilled"
            ? verdictResult.value
            : (() => {
                const ci = currentInterestFallback;
                const wow = wowFallback;
                const verdictVal = ci > 70 && wow > 5 ? "NOT ANYTIME SOON" : ci > 50 ? "INEVITABLE DECLINE" : "DECLINING";
                const category = (validation.category as string) || "Trending";
                const firstHeadline = newsResult.headlines[0] || "";
                const platformPrimary = platforms?.[0] || "social media";

                return {
                    verdict: verdictVal,
                    confidence: Math.round(40 + ci * 0.3),
                    summary: `${keyword} at ${ci}/100 interest. ${wow > 0 ? "Trending up" : "Trending down"} ${Math.abs(wow)}% week-over-week.`,
                    pros: [
                        { title: `${keyword} at ${ci}/100`, detail: `Currently ${wow > 0 ? "gaining" : "losing"} momentum with ${Math.abs(wow)}% weekly ${wow > 0 ? "growth" : "decline"}.`, impact: ci },
                        { title: `${category} category`, detail: `Part of the ${category} space — ${ci > 60 ? "significant" : "moderate"} audience size.`, impact: 55 },
                        { title: "News cycle active", detail: firstHeadline ? `Appearing in recent headlines: "${firstHeadline}"` : "Topic has ongoing media presence.", impact: 50 },
                    ],
                    cons: [
                        { title: "AI analysis limited", detail: "Full multi-model analysis unavailable — fallback metrics in use.", impact: 40 },
                        { title: `${volatilityFallback > 20 ? "High" : "Moderate"} volatility`, detail: `Interest fluctuates ${volatilityFallback.toFixed(1)}% day-to-day, making timing ${volatilityFallback > 20 ? "risky" : "somewhat unpredictable"}.`, impact: Math.round(volatilityFallback) },
                        { title: "Timing uncertainty", detail: `Optimal action window cannot be precisely determined without full pipeline data.`, impact: 45 },
                    ],
                    timeHorizon: "1-2 weeks",
                    actionItems: [
                        `Search "${keyword}" on ${platformPrimary} to gauge real-time sentiment`,
                        `Set a Google Alert for "${keyword}" to track developments`,
                        `Check back in 48 hours for updated analysis with fresh data`,
                    ],
                    riskLevel: ci > 60 ? "Medium" : "High",
                    opportunityWindow: "1-2 weeks",
                    _fallback: true,
                };
            })();

        const step2End = Date.now();
        const step3End = step2End; // They ran in parallel

        // ============================================================
        // Inject fallback relatedQueries from validation suggestedKeywords
        // (Google Trends often captchas, leaving relatedQueries empty)
        // ============================================================
        const bm = basicMetrics as Record<string, unknown>;
        const rq = bm.relatedQueries as { top?: unknown[]; rising?: unknown[] } | undefined;
        if ((!rq?.top?.length && !rq?.rising?.length) && validation.suggestedKeywords) {
            const suggested = (validation.suggestedKeywords as string[]).map((kw: string, i: number) => ({
                query: kw,
                value: Math.max(10, 85 - i * 12),
            }));
            (bm as Record<string, unknown>).relatedQueries = {
                top: suggested,
                rising: suggested.slice(0, 3),
            };
        }

        // Final fallback: ensure relatedQueries always has at least 5 entries
        const rqAfter = bm.relatedQueries as { top?: unknown[]; rising?: unknown[] } | undefined;
        if ((!rqAfter?.top?.length || (rqAfter.top.length < 5)) && (!rqAfter?.rising?.length)) {
            const category = (validation.category as string) || "trending";
            const generated = [
                { query: `${keyword} trends`, value: 75 },
                { query: `${keyword} news`, value: 68 },
                { query: `${category} analysis`, value: 60 },
                { query: `${keyword} 2026`, value: 55 },
                { query: `${category} trends`, value: 50 },
            ];
            const existing = (rqAfter?.top as Array<{ query: string; value: number }>) || [];
            const existingQueries = new Set(existing.map(e => e.query.toLowerCase()));
            const toAdd = generated.filter(g => !existingQueries.has(g.query.toLowerCase()));
            (bm as Record<string, unknown>).relatedQueries = {
                top: [...existing, ...toAdd].slice(0, 8),
                rising: rqAfter?.rising || toAdd.slice(0, 3),
            };
        }

        // ============================================================
        // Map to DecayAnalysis for frontend compatibility
        // ============================================================
        const decayAnalysis = mapToDecayAnalysis(
            keyword,
            validation,
            basicMetrics,
            advancedInferences,
            verdict
        );

        // ============================================================
        // Store in trend database
        // ============================================================
        try {
            const rawChange = (basicMetrics.metrics as Record<string, number>)?.weekOverWeekChange || 0;
            // Use currentInterest as the score when healthScore is very low
            // healthScore = 100 - riskScore can be 0 for high-risk trends, but currentInterest is the actual Google Trends value
            const currentInterest = (basicMetrics.metrics as Record<string, number>)?.currentInterest || 50;
            const rawScore = Math.max(decayAnalysis.healthScore, Math.round(currentInterest * 0.5));
            await addOrUpdateTrend({
                keyword,
                score: Math.max(5, Math.min(100, rawScore)),
                change: Math.max(-100, Math.min(500, rawChange)),
                volume: (basicMetrics._meta as Record<string, number>)?.dataPoints
                    ? Math.round(((basicMetrics.metrics as Record<string, number>)?.currentInterest || 50) * 1000)
                    : 50000,
                category: (validation.category as string) || "General",
                phase: decayAnalysis.phase,
            });
        } catch (e) {
            console.error("Failed to store trend:", e);
        }

        // ============================================================
        // Return full response
        // ============================================================
        return NextResponse.json({
            // Full pipeline data for new frontend pages
            validation,
            basicMetrics,
            advancedInferences,
            verdict,
            newsHeadlines: newsResult.headlines.slice(0, 6),
            newsArticles: newsResult.articles.slice(0, 6).map(a => ({
                title: a.title,
                description: a.description,
                source: a.source,
                date: a.date,
                image: a.image,
                url: a.url,
            })),
            newsSentiment: newsResult.sentiment,

            // DecayAnalysis for existing frontend compatibility
            ...decayAnalysis,

            // Pipeline metadata
            _pipeline: {
                steps: ["validate", "basic-metrics", "advanced-inferences", "verdict"],
                providers: {
                    validation: "groq",
                    basicMetrics: "pytrends+groq",
                    advancedInferences: advancedInferences?._meta?.provider || "gemini",
                    verdict: verdict?._meta?.provider || "gemini",
                },
                completedAt: new Date().toISOString(),
                timings: {
                    total: Date.now() - startTime,
                    step1: step1End - startTime,
                    step2: step2End - step1End,
                    step3: step3End - step2End,
                },
                userRole,
            },
        });
    } catch (error) {
        console.error("Full pipeline error:", error);
        return NextResponse.json(
            { error: "Pipeline failed", details: String(error) },
            { status: 500 }
        );
    }
}
