import { NextRequest, NextResponse } from "next/server";
import { callGemini, callFeatherless, callGroq, buildRolePrompt, repairJSON } from "@/lib/llm-clients";

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user", advancedInferences, basicMetrics, newsContext, llmInterpretation, platforms } = await req.json();

        if (!keyword) {
            return NextResponse.json(
                { error: "keyword is required" },
                { status: 400 }
            );
        }

        const roleContext = buildRolePrompt(userRole, platforms);

        const platformLine = platforms && platforms.length > 0
            ? `\nThe user is active on ${platforms.join(", ")}. Generate platform-specific pros, cons, and action items for these platforms.`
            : "";

        // Build role-specific framing (decline-prediction focus)
        const verdictFraming: Record<string, string> = {
            "content-creator": `"NOT ANYTIME SOON" = No decline signals — this trend has strong momentum. Create content now for maximum reach.
"INEVITABLE DECLINE" = Early decline signals detected — audience fatigue, content saturation building. Prepare exit strategy.
"DECLINING" = This trend is actively losing momentum — engagement dropping. Pivot to fresher topics.`,

            "general-user": `"NOT ANYTIME SOON" = No signs of slowing — strong engagement, fresh content, growing interest.
"INEVITABLE DECLINE" = Decline is on the horizon — early warning signs like audience fatigue and repetition emerging.
"DECLINING" = This trend is actively dying — engagement dropping, audience moving on.`,

            "marketing-team": `"NOT ANYTIME SOON" = No decline signals — safe to commit campaign budget, strong ROI potential.
"INEVITABLE DECLINE" = Decline approaching — audience fatigue and saturation signals emerging. Don't commit new budget.
"DECLINING" = Trend in active decline — pull campaigns to avoid wasted spend. Redirect budget now.`,

            "platform-moderator": `"NOT ANYTIME SOON" = Trend is healthy — high engagement, low risk, amplify for platform metrics.
"INEVITABLE DECLINE" = Decline signals building — influencer disengagement, content saturation. Monitor for de-ranking.
"DECLINING" = Trend collapsing — reduced engagement, potential backlash. Prepare moderation resources.`,
        };

        // Try Gemini first, then Featherless, then Groq
        const llmCall = async (msgs: Parameters<typeof callGemini>[0], opts: Parameters<typeof callGemini>[1]) => {
            try {
                console.log("[Verdict] Trying Gemini...");
                return await callGemini(msgs, opts);
            } catch (e) {
                console.log("[Verdict] Gemini failed, trying Featherless:", e instanceof Error ? e.message : String(e));
                try {
                    return await callFeatherless(msgs, opts);
                } catch (e2) {
                    console.log("[Verdict] Featherless failed, falling back to Groq:", e2 instanceof Error ? e2.message : String(e2));
                    return await callGroq(msgs, opts);
                }
            }
        };

        const result = await llmCall(
            [
                {
                    role: "system",
                    content: `You are TREND PRISM's Decline Prediction Engine — the final decision-maker that predicts when and why social media trends begin to lose momentum and collapse.

${roleContext}

VERDICT MEANINGS FOR THIS USER:
${verdictFraming[userRole] || verdictFraming["general-user"]}
${platformLine}

You MUST respond in valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "pros": [
    {
      "title": "<short punchy title, 3-6 words>",
      "detail": "<1-2 sentences with specific numbers/percentages, role-targeted>",
      "impact": <0-100, how significant this pro is>
    }
  ],
  "cons": [
    {
      "title": "<short punchy title, 3-6 words>",
      "detail": "<1-2 sentences with specific numbers/percentages, role-targeted>",
      "impact": <0-100, how significant this con is>
    }
  ],
  "verdict": "<NOT ANYTIME SOON|INEVITABLE DECLINE|DECLINING>",
  "confidence": <0-100>,
  "summary": "<3-4 sentence decline prediction. Focus on whether and why the trend will decline, what signals drive it, and recommended actions. Be decisive, specific, and directly useful.>",
  "timeHorizon": "<specific timeframe: '24-48 hours', '1-2 weeks', '2-4 weeks', '1-3 months'>",
  "actionItems": [
    "<specific action 1, role-targeted>",
    "<specific action 2, role-targeted>",
    "<specific action 3, role-targeted>"
  ],
  "riskLevel": "<Low|Medium|High|Critical>",
  "opportunityWindow": "<how long the opportunity/risk window is open>"
}

RULES:
- Always give 3-5 pros and 3-5 cons
- Frame pros as RESILIENCE signals (why the trend may sustain) and cons as DECLINE signals (why it's losing momentum)
- Generate pros/cons that are SPECIFIC to this trend — reference real entities, events, or data. Do NOT say generic things like "has search interest". Instead reference specific engagement metrics, influencer activity, content saturation levels, or audience fatigue indicators.
- Each action item must be concrete and platform-specific. Instead of "Monitor keyword daily", say "Track engagement rate on top ${keyword} posts over the next 48 hours for decline signals".
- Be DECISIVE — don't hedge. Pick a verdict and commit to it
- Make every sentence useful for the user's specific role
- Focus on DECLINE PREDICTION: identify early decline signals including reduced engagement, influencer disengagement, algorithmic shifts, content saturation, and audience fatigue
- CRITICAL: If current interest is 80+/100 AND week-over-week growth is strongly positive (>10%), lean toward "NOT ANYTIME SOON" unless there are severe saturation/fatigue signals
- If the trend shows dropping engagement, high content saturation, or influencer exit, lean toward "DECLINING"
- If early warning signs are present but momentum hasn't broken yet, use "INEVITABLE DECLINE"
- Use the news headlines and trend background to identify real-world decline drivers — context matters more than abstract risk scores`
                },
                {
                    role: "user",
                    content: `Give me the final verdict on "${keyword}":

TREND BACKGROUND:
${llmInterpretation || "No background available — use your own knowledge."}

RECENT NEWS HEADLINES:
${newsContext || "No news data available — use your own knowledge about current events."}

BASIC METRICS:
- Current Interest: ${basicMetrics?.metrics?.currentInterest ?? "N/A"}/100
- Peak Interest: ${basicMetrics?.metrics?.peakInterest ?? "N/A"}/100
- Week-over-Week Change: ${basicMetrics?.metrics?.weekOverWeekChange ?? 0}%
- Month-over-Month Change: ${basicMetrics?.metrics?.monthOverMonthChange ?? 0}%
- Direction: ${basicMetrics?.metrics?.trendDirection ?? "unknown"}
${advancedInferences ? `
ADVANCED INFERENCES:
- Delta Velocity: ${advancedInferences.deltaVelocity?.value ?? 0} (${advancedInferences.deltaVelocity?.label ?? "Unknown"})
- Peak Width: ${advancedInferences.peakWidth?.days ?? 0} days (${advancedInferences.peakWidth?.label ?? "Unknown"})
- Decay Half-Life: ${advancedInferences.decayHalfLife?.days ?? 0} days (${advancedInferences.decayHalfLife?.label ?? "Unknown"})
- Overall Risk Score: ${advancedInferences.overallRiskScore ?? 50}/100
- Phase: ${advancedInferences.phase ?? "Unknown"}
- Velocity: ${advancedInferences.velocity ?? "Unknown"}
- Collapse Probability: ${advancedInferences.collapseProbability ?? 50}%
- Time to Collapse: ${advancedInferences.timeToCollapse ?? "Unknown"}

TREND TRIADE (Collapse Indicators):
- Community Fragmentation: ${advancedInferences.trendTriade?.communityFragmentation?.score ?? 50}/100
- Semantic Saturation: ${advancedInferences.trendTriade?.semanticSaturation?.score ?? 50}/100
- Commercial Exhaustion: ${advancedInferences.trendTriade?.commercialExhaustion?.score ?? 50}/100

Regional Skew: ${advancedInferences.regionalSkew?.dominantRegion ?? "Unknown"} (${advancedInferences.regionalSkew?.concentration ?? 50}% concentrated)` : "No advanced inferences available — base verdict on basic metrics and news."}

Now give the final VERDICT. Be decisive.`
                }
            ],
            { temperature: 0.7, maxTokens: 8192, jsonMode: true }
        );

        let parsed;
        try {
            parsed = JSON.parse(result.content);
            console.log(`[Verdict] Parsed OK (provider: ${result.provider})`);
        } catch {
            // Try JSON repair (Gemini thinking tokens can truncate output)
            console.log("[Verdict] Direct parse failed, trying repair. Content length:", result.content?.length, "starts with:", result.content?.substring(0, 150));
            try {
                parsed = JSON.parse(repairJSON(result.content));
                console.log("[Verdict] JSON repair succeeded");
            } catch {
                console.log("[Verdict] Repair failed, using fallback");
                parsed = buildFallbackVerdict(keyword, advancedInferences || {}, userRole);
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
        console.error("Verdict error:", error);
        // Return a fallback verdict
        return NextResponse.json({
            ...buildFallbackVerdict(
                req.body ? "trend" : "trend",
                {},
                "general-user"
            ),
            _meta: { error: String(error) },
        });
    }
}

function buildFallbackVerdict(
    keyword: string,
    inferences: Record<string, unknown>,
    userRole: string
) {
    const risk = (inferences.overallRiskScore as number) || 50;
    const phase = (inferences.phase as string) || "Unknown";

    let verdict: string;
    if (risk < 30) verdict = "NOT ANYTIME SOON";
    else if (risk < 60) verdict = "INEVITABLE DECLINE";
    else verdict = "DECLINING";

    return {
        pros: [
            { title: "Active search volume", detail: `"${keyword}" still maintains search interest, suggesting audience hasn't fully moved on.`, impact: 60 },
            { title: "Cultural recognition", detail: "The trend has established recognition — not yet in audience fatigue territory.", impact: 50 },
            { title: "Niche resilience", detail: "Smaller communities may sustain engagement even as mainstream interest fades.", impact: 40 },
        ],
        cons: [
            { title: "Decline risk elevated", detail: `Overall decline risk at ${risk}/100 — early signs of momentum loss.`, impact: risk },
            { title: `${phase} phase signals`, detail: `Currently in ${phase} phase — ${risk > 50 ? "content saturation and audience fatigue likely" : "watch for engagement drops"}.`, impact: 55 },
            { title: "Window narrowing", detail: "Optimal engagement window may be closing as the trend lifecycle progresses.", impact: 50 },
        ],
        verdict,
        confidence: Math.round(100 - risk * 0.3),
        summary: `"${keyword}" shows a ${verdict.toLowerCase()} decline prediction with ${Math.round(100 - risk * 0.3)}% confidence. ${risk > 50 ? "Early decline signals detected — reduced engagement and content saturation are building." : "No strong decline signals yet, but monitoring recommended."}`,
        timeHorizon: risk > 60 ? "24-48 hours" : "1-2 weeks",
        actionItems: [
            `Track engagement rate on ${keyword} content for decline signals`,
            "Monitor influencer activity — disengagement is an early collapse indicator",
            "Watch for content saturation and audience fatigue patterns",
        ],
        riskLevel: risk > 70 ? "Critical" : risk > 50 ? "High" : risk > 30 ? "Medium" : "Low",
        opportunityWindow: risk > 60 ? "Closing rapidly" : "1-2 weeks",
    };
}
