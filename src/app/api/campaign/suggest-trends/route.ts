
import { NextRequest, NextResponse } from "next/server";
import { callGemini, callGroq } from "@/lib/llm-clients";

export async function POST(req: NextRequest) {
    try {
        const { campaign, industry, targetAudience, goals } = await req.json();

        if (!campaign) {
            return NextResponse.json({ error: "Campaign description is required" }, { status: 400 });
        }

        const prompt = `You are a viral trend strategist. Analyze this campaign and find specific, rising social media trends to leverage.

CAMPAIGN: ${campaign}
INDUSTRY: ${industry || "General"}
AUDIENCE: ${targetAudience || "General"}
GOALS: ${goals || "Engagement"}

TASK: Identify 4 specific, actionable trends.
For each trend, provide:
1. Specific Trend Name (e.g., "Wes Anderson Style", "Tube Girl Effect")
2. Platform (TikTok, Reels, Twitter, etc.)
3. Growth Phase (Rising, Peak, Stabilizing)
4. Viral Potential Score (1-100)
5. Why it fits (1 short sentence)
6. Creative Execution (1 short, punchy instruction)

Return strict JSON:
{
  "strategic_angle": "One sentence punchy strategy hook",
  "recommended_trends": [
    {
      "name": "Trend Name",
      "platform": "TikTok/Reels/etc",
      "phase": "Rising|Peak|Stabilizing",
      "score": 85,
      "reason": "Short reason",
      "execution": "Short instruction"
    }
  ]
}`;

        const messages = [{ role: "user" as const, content: prompt }];

        let response;
        try {
            response = await callGemini(messages, { jsonMode: true, temperature: 0.8 });
        } catch (e) {
            console.warn("Gemini failed, trying Groq:", e);
            response = await callGroq(messages, { jsonMode: true, temperature: 0.8 });
        }

        if (!response.content) throw new Error("No response");

        // Parse the JSON response
        let parsed;
        try {
            let content = response.content;
            if (content.includes("```json")) {
                content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            }
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse LLM response:", e);
            return NextResponse.json({
                strategic_angle: "Leverage AI-driven storytelling for maximum engagement",
                recommended_trends: [
                    {
                        name: "AI Content Studio",
                        platform: "TikTok",
                        phase: "Rising",
                        score: 92,
                        reason: "Perfect for tech-forward audiences",
                        execution: "Create behind-the-scenes AI generation videos"
                    },
                    {
                        name: "Silent Reviews",
                        platform: "Reels",
                        phase: "Peak",
                        score: 88,
                        reason: "High effective for product showcases",
                        execution: "ASMR style unboxing without speaking"
                    }
                ]
            });
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Failed to suggest trends" }, { status: 500 });
    }
}
