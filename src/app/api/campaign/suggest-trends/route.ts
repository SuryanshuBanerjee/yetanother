import { NextRequest, NextResponse } from "next/server";
import { callGemini, callGroq } from "@/lib/llm-clients";

export async function POST(req: NextRequest) {
    try {
        const { campaign, industry, targetAudience, goals, platforms } = await req.json();

        if (!campaign) {
            return NextResponse.json({ error: "Campaign description is required" }, { status: 400 });
        }

        const prompt = `You are a trend strategist for marketing campaigns. Analyze this campaign and suggest the best current social media trends and topics they should leverage.

CAMPAIGN DETAILS:
- Campaign: ${campaign}
${industry ? `- Industry: ${industry}` : ""}
${targetAudience ? `- Target Audience: ${targetAudience}` : ""}
${goals ? `- Goals: ${goals}` : ""}
${platforms?.length ? `- Platforms: ${platforms.join(", ")}` : ""}

TASK: Suggest 5 specific, actionable trends this campaign should leverage. For each trend:
1. Name the trend clearly
2. Explain WHY it fits this campaign
3. Give a specific implementation idea
4. Rate its current momentum (Rising/Peak/Stable/Declining)

Return JSON in this exact format:
{
  "suggestions": [
    {
      "trend": "trend name",
      "relevance": "why this fits the campaign",
      "implementation": "specific content/campaign idea",
      "momentum": "Rising|Peak|Stable|Declining",
      "confidence": 85
    }
  ],
  "summary": "One paragraph strategic overview of recommended approach",
  "timing": "Best time to launch based on trend cycles"
}`;

        const messages = [{ role: "user" as const, content: prompt }];

        // Try Gemini first, fallback to Groq
        let response;
        try {
            response = await callGemini(messages, { jsonMode: true, temperature: 0.7 });
        } catch (e) {
            console.warn("Gemini failed, trying Groq:", e);
            response = await callGroq(messages, { jsonMode: true, temperature: 0.7 });
        }

        if (!response.content) {
            throw new Error("No response from LLM");
        }

        // Parse the JSON response
        let parsed;
        try {
            // Handle potential markdown code blocks
            let content = response.content;
            if (content.includes("```json")) {
                content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            }
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse LLM response:", e);
            return NextResponse.json({
                suggestions: [
                    {
                        trend: "AI-Generated Content",
                        relevance: "Highly relevant for modern campaigns",
                        implementation: "Use AI tools to create personalized content at scale",
                        momentum: "Rising",
                        confidence: 80
                    }
                ],
                summary: "Based on current trends, focus on authentic, user-generated style content with AI assistance.",
                timing: "Launch within the next 2 weeks for optimal momentum"
            });
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error("Campaign suggestion error:", error);
        return NextResponse.json(
            { error: "Failed to generate trend suggestions" },
            { status: 500 }
        );
    }
}
