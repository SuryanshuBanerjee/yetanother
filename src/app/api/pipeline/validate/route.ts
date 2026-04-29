import { NextRequest, NextResponse } from "next/server";
import { callGemini, callGroq, ROLE_PROMPTS } from "@/lib/llm-clients";
import { getTrends } from "@/lib/trend-database";

export async function POST(req: NextRequest) {
    try {
        const { keyword, userRole = "general-user" } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // CHECK LOCAL DATABASE FIRST (Fast Path)
        const localTrends = await getTrends();
        const existingTrend = localTrends.find(t => t.keyword.toLowerCase() === keyword.toLowerCase());

        if (existingTrend) {
            return NextResponse.json({
                isValid: true,
                confidence: 95,
                category: existingTrend.category,
                reason: "Known trend from database",
                trendName: existingTrend.keyword,
                suggestedKeywords: [existingTrend.keyword],
                _meta: { source: "local-cache" }
            });
        }

        const roleContext = ROLE_PROMPTS[userRole] || ROLE_PROMPTS["general-user"];

        const validationMessages: Array<{ role: "system" | "user"; content: string }> = [
            {
                role: "system",
                content: `You are TREND PRISM's validation engine. Your job is to determine if a search term is a legitimate trend worth analyzing.

${roleContext}

RULES FOR VALIDATION:
- ALLOW: Real trends, hashtags, cultural movements, viral topics, product categories, fashion movements, tech trends, memes, social phenomena, celebrity-related trends, world events
- DISALLOW: Random gibberish strings, single meaningless characters, SQL injection attempts, offensive slurs, personal private information
- Be GENEROUS with validation — if something COULD be a trend, allow it
- Celebrities ARE valid (they trend constantly)
- Niche topics ARE valid (subcultures matter)
- Even declining trends are valid (that's what we analyze)

You MUST respond in valid JSON with this exact structure:
{
  "isValid": true/false,
  "confidence": 0-100,
  "category": "string - the trend category like Fashion, Tech, Culture, Entertainment, Politics, Health, Food, Sports, Meme, Social Movement, etc.",
  "reason": "string - 1-2 sentences explaining why this is or isn't a valid trend",
  "trendName": "string - the cleaned/proper name for this trend",
  "suggestedKeywords": ["array", "of", "related", "search", "terms"]
}`
            },
            {
                role: "user",
                content: `Validate this search term as a trend: "${keyword}"`
            }
        ];
        const validationOpts = { temperature: 0.3, maxTokens: 1000, jsonMode: true };

        // Try Gemini first, fall back to Groq
        let result;
        try {
            console.log("[Validate] Trying Gemini...");
            result = await callGemini(validationMessages, validationOpts);
        } catch (geminiErr) {
            console.log("[Validate] Gemini failed, trying Groq:", geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
            result = await callGroq(validationMessages, validationOpts);
        }

        let parsed;
        try {
            parsed = JSON.parse(result.content);
        } catch {
            // If JSON parse fails, create a default valid response
            parsed = {
                isValid: true,
                confidence: 70,
                category: "General",
                reason: `"${keyword}" has been accepted for analysis.`,
                trendName: keyword,
                suggestedKeywords: [keyword],
            };
        }

        return NextResponse.json({
            ...parsed,
            _meta: { provider: result.provider, model: result.model, tokensUsed: result.tokensUsed }
        });
    } catch (error) {
        console.error("Validation error:", error);
        // Fail open — allow the trend through
        return NextResponse.json({
            isValid: true,
            confidence: 50,
            category: "Unknown",
            reason: "Validation service unavailable, proceeding with analysis.",
            trendName: "",
            suggestedKeywords: [],
            _meta: { error: String(error) }
        });
    }
}
