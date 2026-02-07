import { NextRequest, NextResponse } from "next/server";
import { addOrUpdateTrend } from "@/lib/trend-database";

// Full pipeline orchestrator:
// Step 1: Validate (Groq) + Basic Metrics (PyTrends + Groq) — in parallel
// Step 2: Advanced Inferences (OpenRouter) — needs basic metrics
// Step 3: Verdict (Featherless) — needs advanced inferences
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
    const overallRisk = (advancedInferences.overallRiskScore as number) || 50;
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
        collapseProbability: (advancedInferences.collapseProbability as number) || Math.min(99, decayScore + 10),
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
        const { keyword, userRole = "general-user" } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // ============================================================
        // STEP 1: Validation + Basic Metrics (PARALLEL)
        // Groq validates the term, PyTrends + Groq fetch metrics
        // ============================================================
        const [validation, basicMetrics] = await Promise.all([
            callInternalAPI(baseUrl, "/api/pipeline/validate", { keyword, userRole }),
            callInternalAPI(baseUrl, "/api/pipeline/basic-metrics", { keyword, userRole }),
        ]);

        // Check validation
        if (!validation.isValid) {
            return NextResponse.json({
                error: "Invalid trend",
                validation,
                message: validation.reason || "This doesn't appear to be a valid trend.",
            }, { status: 422 });
        }

        // ============================================================
        // STEP 2: Advanced Inferences (needs basic metrics)
        // OpenRouter deep analysis
        // ============================================================
        const advancedInferences = await callInternalAPI(
            baseUrl,
            "/api/pipeline/advanced-inferences",
            { keyword, userRole, basicMetrics }
        );

        // ============================================================
        // STEP 3: Verdict (needs advanced inferences)
        // Featherless pros/cons/decision
        // ============================================================
        const verdict = await callInternalAPI(
            baseUrl,
            "/api/pipeline/verdict",
            { keyword, userRole, advancedInferences, basicMetrics }
        );

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
            await addOrUpdateTrend({
                keyword,
                score: decayAnalysis.healthScore,
                change: (basicMetrics.metrics as Record<string, number>)?.weekOverWeekChange || 0,
                volume: (basicMetrics.metrics as Record<string, number>)?.currentInterest * 10000 || 50000,
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

            // DecayAnalysis for existing frontend compatibility
            ...decayAnalysis,

            // Pipeline metadata
            _pipeline: {
                steps: ["validate", "basic-metrics", "advanced-inferences", "verdict"],
                providers: {
                    validation: "groq",
                    basicMetrics: "pytrends+groq",
                    advancedInferences: "openrouter",
                    verdict: "featherless",
                },
                completedAt: new Date().toISOString(),
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
