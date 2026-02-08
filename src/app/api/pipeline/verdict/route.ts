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

        // Build role-specific framing
        const verdictFraming: Record<string, string> = {
            "content-creator": `"BUY" = Yes, create content about this NOW — high engagement potential.
"HOLD" = Wait and watch — not the right moment yet but could be soon.
"SELL" = Stop making content about this — you'll lose audience trust or get no reach.
"WATCH" = Keep monitoring — could go either way in the next few days.`,

            "general-user": `"BUY" = This trend is worth your attention — it's going somewhere interesting.
"HOLD" = Interesting but uncertain — keep an eye on it.
"SELL" = This trend is dying or problematic — move on to something new.
"WATCH" = Developing situation — check back in a few days.`,

            "marketing-team": `"BUY" = Green light for campaigns — strong ROI potential if you act NOW.
"HOLD" = Don't commit budget yet — wait for the trend to stabilize or confirm direction.
"SELL" = Pull any active campaigns — risk of negative association or wasted spend.
"WATCH" = Reserve budget but don't deploy — monitor for the next 1-2 weeks.`,

            "platform-moderator": `"BUY" = Amplify this trend — high engagement, low risk, will drive platform metrics.
"HOLD" = Don't actively promote but don't suppress — let it run organically.
"SELL" = Consider suppressing or de-ranking — could cause moderation issues or backlash.
"WATCH" = Flag for monitoring — potential for viral surge or controversy.`,
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
                    content: `You are TREND PRISM's Verdict Engine — the final decision-maker that tells users whether to "buy" or "sell" a trend.

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
  "verdict": "<BUY|SELL|HOLD|WATCH>",
  "confidence": <0-100>,
  "summary": "<3-4 sentence final verdict. Be decisive, specific, and directly useful. Include a specific recommended action and timeframe. Sound like a brilliant advisor who doesn't waste words.>",
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
- Generate pros/cons that are SPECIFIC to this trend — reference real entities, events, or data. Do NOT say generic things like "has search interest" or "topic recognition". Instead say things like "TikTok engagement on #keyword averaging 2M views" or "Associated with [real event], driving news cycle".
- Each action item must be concrete and platform-specific. Instead of "Monitor keyword daily", say "Create a TikTok duet with the top viral video about [keyword] within 24 hours".
- Be DECISIVE — don't hedge. Pick a verdict and commit to it
- Make every sentence useful for the user's specific role
- The summary should feel like advice from the smartest person in the room
- CRITICAL: If current interest is 80+/100 AND week-over-week growth is strongly positive (>10%), lean toward BUY unless there are severe safety/brand risks
- If the trend is a major news story with high search volume, it is almost always a BUY for content creators and a WATCH/BUY for others
- Use the news headlines and trend background below to inform your verdict — real-world context matters more than abstract risk scores`
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
    if (risk < 30) verdict = "BUY";
    else if (risk < 50) verdict = "HOLD";
    else if (risk < 70) verdict = "WATCH";
    else verdict = "SELL";

    return {
        pros: [
            { title: "Still has search interest", detail: `"${keyword}" maintains active search volume.`, impact: 60 },
            { title: "Topic recognition", detail: "The trend has established cultural recognition.", impact: 50 },
            { title: "Niche potential remains", detail: "Smaller communities may still find value.", impact: 40 },
        ],
        cons: [
            { title: "Risk score elevated", detail: `Overall risk at ${risk}/100 suggests caution.`, impact: risk },
            { title: "Phase uncertainty", detail: `Currently in ${phase} phase.`, impact: 55 },
            { title: "Market timing risk", detail: "Optimal window may have passed.", impact: 50 },
        ],
        verdict,
        confidence: Math.round(100 - risk * 0.3),
        summary: `Based on available data, "${keyword}" receives a ${verdict} rating with ${Math.round(100 - risk * 0.3)}% confidence.`,
        timeHorizon: risk > 60 ? "24-48 hours" : "1-2 weeks",
        actionItems: [
            `Monitor ${keyword} trends daily`,
            "Watch for sentiment shifts",
            "Prepare contingency strategies",
        ],
        riskLevel: risk > 70 ? "Critical" : risk > 50 ? "High" : risk > 30 ? "Medium" : "Low",
        opportunityWindow: risk > 60 ? "Closing rapidly" : "1-2 weeks",
    };
}
