import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter, callGroq, ROLE_PROMPTS } from "@/lib/llm-clients";

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user", basicMetrics } = await req.json();

        if (!keyword || !basicMetrics) {
            return NextResponse.json(
                { error: "keyword and basicMetrics are required" },
                { status: 400 }
            );
        }

        const roleContext = ROLE_PROMPTS[userRole] || ROLE_PROMPTS["general-user"];

        // Try OpenRouter first, fall back to Groq if rate-limited
        const llmCall = async (messages: Parameters<typeof callOpenRouter>[0], opts: Parameters<typeof callOpenRouter>[1]) => {
            try {
                return await callOpenRouter(messages, opts);
            } catch (e) {
                console.log("OpenRouter failed, falling back to Groq:", e);
                return await callGroq(messages, opts);
            }
        };

        const result = await llmCall(
            [
                {
                    role: "system",
                    content: `You are TREND PRISM's Advanced Inference Engine — the most sophisticated trend analysis AI.

${roleContext}

Your job is to take raw Google Trends metrics and produce DEEP, QUANTIFIED INFERENCES that go beyond what the raw data shows. You think like a quant analyst meets cultural anthropologist.

You MUST respond in valid JSON with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "deltaVelocity": {
    "value": <number, rate of change in interest per week, can be negative>,
    "label": "<Accelerating|Stable|Decelerating|Freefall|Exploding>",
    "detail": "<1-2 sentences, role-targeted, with specific percentages>"
  },
  "peakWidth": {
    "days": <number, how many days the trend stayed above 70% of its peak>,
    "label": "<Flash Spike|Short Burst|Medium Lifespan|Long Wave|Evergreen>",
    "detail": "<1-2 sentences>"
  },
  "decayHalfLife": {
    "days": <number, estimated days for interest to drop to 50% of peak>,
    "label": "<Rapid Decay|Fast Decay|Moderate Decay|Slow Decay|Resilient>",
    "detail": "<1-2 sentences>"
  },
  "regionalSkew": {
    "dominantRegion": "<country or region name>",
    "concentration": <0-100, how concentrated in one region>,
    "isGlobal": <true/false>,
    "detail": "<1-2 sentences about geographic implications>"
  },
  "trendTriade": {
    "communityFragmentation": {
      "score": <0-100, how much the community around this trend is splitting>,
      "indicators": ["<specific indicator 1>", "<specific indicator 2>", "<specific indicator 3>"],
      "detail": "<1-2 sentences>"
    },
    "semanticSaturation": {
      "score": <0-100, how diluted/overused the trend's meaning has become>,
      "indicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
      "detail": "<1-2 sentences>"
    },
    "commercialExhaustion": {
      "score": <0-100, how much brands have exploited this trend>,
      "indicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
      "detail": "<1-2 sentences>"
    }
  },
  "overallRiskScore": <0-100>,
  "phase": "<Growth|Peak|Saturation|Decay|Revival|Zombie>",
  "velocity": "<Accelerating|Stable|Decelerating|Freefall>",
  "timeToCollapse": "<specific timeframe like '2-3 weeks' or '48-72 hours' or '1-2 months'>",
  "collapseProbability": <0-99>,
  "llmAnalysis": "<3-5 sentence deep analysis, role-targeted, with specific numbers and percentages. Sound like a brilliant analyst who speaks plainly. Include actionable intelligence.>"
}`
                },
                {
                    role: "user",
                    content: `Analyze this trend deeply: "${keyword}"

RAW METRICS FROM GOOGLE TRENDS:
- Current Interest Level: ${basicMetrics.metrics?.currentInterest ?? "N/A"}/100
- Peak Interest Level: ${basicMetrics.metrics?.peakInterest ?? "N/A"}/100
- Average Interest: ${basicMetrics.metrics?.averageInterest ?? "N/A"}/100
- Trend Direction: ${basicMetrics.metrics?.trendDirection ?? "unknown"}
- Week-over-Week Change: ${basicMetrics.metrics?.weekOverWeekChange ?? 0}%
- Month-over-Month Change: ${basicMetrics.metrics?.monthOverMonthChange ?? 0}%
- Volatility: ${basicMetrics.metrics?.volatility ?? 0}%
- Days Since Peak: ${basicMetrics.metrics?.daysFromPeak ?? 0}
- Consistency Score: ${basicMetrics.metrics?.consistencyScore ?? 0}/100

TOP REGIONS: ${JSON.stringify(basicMetrics.topRegions?.slice(0, 10) || [])}

RELATED RISING QUERIES: ${JSON.stringify(basicMetrics.relatedQueries?.rising?.slice(0, 8) || [])}
RELATED TOP QUERIES: ${JSON.stringify(basicMetrics.relatedQueries?.top?.slice(0, 8) || [])}

DATA POINTS AVAILABLE: ${basicMetrics._meta?.dataPoints ?? 0} days of data

CRITICAL INSTRUCTION:
If the provided metrics are sparse (e.g. flat charts, no regional data), DO NOT generate generic "insufficient data" responses.
Instead, USE YOUR INTERNAL KNOWLEDGE about the trend ("${keyword}") to generate high-quality, likely inferences.
You know who/what "${keyword}" is. Use that context to estimate the phase, audience, and risks.

Generate deep inferences NOW. Be specific with numbers.`
                }
            ],
            { temperature: 0.6, maxTokens: 2500, jsonMode: true }
        );

        let parsed;
        try {
            parsed = JSON.parse(result.content);
        } catch {
            // Try to extract JSON from the response
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch {
                    parsed = buildFallbackInferences(keyword, basicMetrics);
                }
            } else {
                parsed = buildFallbackInferences(keyword, basicMetrics);
            }
        }

        return NextResponse.json({
            ...parsed,
            _meta: {
                provider: result.provider,
                model: result.model,
                tokensUsed: result.tokensUsed,
            },
        });
    } catch (error) {
        console.error("Advanced inferences error:", error);
        return NextResponse.json(
            { error: "Failed to generate advanced inferences", details: String(error) },
            { status: 500 }
        );
    }
}

function buildFallbackInferences(keyword: string, basicMetrics: Record<string, unknown>) {
    const metrics = (basicMetrics.metrics || {}) as Record<string, number | string>;
    const wow = (metrics.weekOverWeekChange as number) || 0;
    const current = (metrics.currentInterest as number) || 50;
    const peak = (metrics.peakInterest as number) || 100;
    const daysFromPeak = (metrics.daysFromPeak as number) || 0;

    return {
        deltaVelocity: {
            value: wow,
            label: wow > 10 ? "Accelerating" : wow > 0 ? "Stable" : wow > -10 ? "Decelerating" : "Freefall",
            detail: `Interest is changing at ${wow}% per week.`,
        },
        peakWidth: {
            days: Math.max(7, 90 - daysFromPeak),
            label: "Medium Lifespan",
            detail: `The trend maintained high interest for approximately ${Math.max(7, 90 - daysFromPeak)} days.`,
        },
        decayHalfLife: {
            days: Math.max(7, Math.round(daysFromPeak * 0.7)),
            label: current > 60 ? "Slow Decay" : "Fast Decay",
            detail: `Estimated ${Math.max(7, Math.round(daysFromPeak * 0.7))} days to reach 50% of peak interest.`,
        },
        regionalSkew: {
            dominantRegion: "United States",
            concentration: 65,
            isGlobal: false,
            detail: "Data suggests moderate regional concentration.",
        },
        trendTriade: {
            communityFragmentation: { score: 50, indicators: ["Moderate discussion diversity"], detail: "Community shows moderate fragmentation." },
            semanticSaturation: { score: 45, indicators: ["Increasing usage variety"], detail: "Meaning is beginning to dilute." },
            commercialExhaustion: { score: 40, indicators: ["Some brand adoption"], detail: "Commercial adoption is moderate." },
        },
        overallRiskScore: Math.round(100 - current + Math.abs(wow)),
        phase: current > 80 ? "Peak" : current > 60 ? "Growth" : current > 40 ? "Saturation" : "Decay",
        velocity: wow > 10 ? "Accelerating" : wow > 0 ? "Stable" : wow > -10 ? "Decelerating" : "Freefall",
        timeToCollapse: current > 60 ? "3+ weeks" : current > 40 ? "1-2 weeks" : "48-72 hours",
        collapseProbability: Math.min(99, Math.round(100 - current + Math.abs(wow) * 0.5)),
        llmAnalysis: `${keyword} is at ${current}/100 interest, ${wow > 0 ? "up" : "down"} ${Math.abs(wow)}% week-over-week. Peak was ${peak}/100, ${daysFromPeak} days ago.`,
    };
}
