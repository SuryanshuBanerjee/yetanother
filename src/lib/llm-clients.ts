// LLM Client wrappers for Groq, Gemini, OpenRouter, and Featherless
// All use OpenAI-compatible chat completions API

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface LLMResponse {
    content: string;
    model: string;
    provider: string;
    tokensUsed?: number;
}

// ============================================================
// GROQ - Ultra-fast inference (Validation + Basic Interpretation)
// ============================================================
export async function callGroq(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<LLMResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not set");

    const body: Record<string, unknown> = {
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
        content: data.choices[0]?.message?.content || "",
        model: data.model,
        provider: "groq",
        tokensUsed: data.usage?.total_tokens,
    };
}

// ============================================================
// GEMINI - Google's Gemini via OpenAI-compatible endpoint
// Primary model for heavy analysis (advanced inferences + verdict)
// ============================================================
export async function callGemini(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<LLMResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Gemini 2.5 Flash uses internal "thinking tokens" (~2000-3000) that count toward
    // max_tokens. Set high default so actual JSON output doesn't get truncated.
    const body: Record<string, unknown> = {
        model: "gemini-2.5-flash",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 8192,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Gemini API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return {
            content: data.choices[0]?.message?.content || "",
            model: data.model || "gemini-2.5-flash",
            provider: "gemini",
            tokensUsed: data.usage?.total_tokens,
        };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Attempt to repair truncated JSON (missing closing braces/brackets).
 * Gemini 2.5 Flash sometimes returns JSON cut short due to thinking token budget.
 */
export function repairJSON(raw: string): string {
    // Strip markdown code fences if present
    let s = raw.trim();
    if (s.startsWith("```json")) s = s.slice(7);
    else if (s.startsWith("```")) s = s.slice(3);
    if (s.endsWith("```")) s = s.slice(0, -3);
    s = s.trim();

    // Try parsing as-is first
    try { JSON.parse(s); return s; } catch { /* continue */ }

    // Truncate at last complete value (find last comma or colon-value boundary)
    // Then close all open braces/brackets
    // First, remove any trailing incomplete string value
    s = s.replace(/,\s*"[^"]*$/, "");      // trailing incomplete key
    s = s.replace(/:\s*"[^"]*$/, ': ""');   // trailing incomplete string value
    s = s.replace(/,\s*$/, "");              // trailing comma

    // Count open/close braces and brackets
    let braces = 0, brackets = 0;
    let inString = false, escape = false;
    for (const ch of s) {
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") braces++;
        if (ch === "}") braces--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
    }

    // Append missing closers
    while (brackets > 0) { s += "]"; brackets--; }
    while (braces > 0) { s += "}"; braces--; }

    return s;
}

// ============================================================
// OPENROUTER - Fallback for Advanced Inferences
// Tries multiple free models with retry on rate-limit
// ============================================================
const OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
];

export async function callOpenRouter(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<LLMResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    let lastError = "";

    for (const model of OPENROUTER_MODELS) {
        try {
            const body: Record<string, unknown> = {
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 3000,
            };

            if (options.jsonMode) {
                body.response_format = { type: "json_object" };
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15000); // 15s per model

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://trendprism.app",
                    "X-Title": "TREND PRISM",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.status === 429) {
                lastError = `Rate limited on ${model}`;
                console.log(`OpenRouter rate limited on ${model}, trying next model...`);
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }

            if (!res.ok) {
                lastError = await res.text();
                console.log(`OpenRouter error on ${model}: ${lastError}`);
                continue;
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content || "";

            if (!content) {
                console.log(`OpenRouter empty response from ${model}, trying next...`);
                continue;
            }

            return {
                content,
                model: data.model || model,
                provider: "openrouter",
                tokensUsed: data.usage?.total_tokens,
            };
        } catch (e) {
            lastError = String(e);
            console.log(`OpenRouter error on ${model}: ${e}`);
            continue;
        }
    }

    throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
}

// ============================================================
// FEATHERLESS - Verdict fallback
// ============================================================
const FEATHERLESS_TIMEOUT = 12000; // 12 seconds max

export async function callFeatherless(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<LLMResponse> {
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) throw new Error("FEATHERLESS_API_KEY not set");

    const body: Record<string, unknown> = {
        model: "moonshotai/Kimi-K2.5",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 3000,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEATHERLESS_TIMEOUT);

    try {
        const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Featherless API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return {
            content: data.choices[0]?.message?.content || "",
            model: data.model,
            provider: "featherless",
            tokensUsed: data.usage?.total_tokens,
        };
    } finally {
        clearTimeout(timer);
    }
}

// ============================================================
// ROLE DESCRIPTIONS - Used in all LLM prompts
// ============================================================
export const ROLE_PROMPTS: Record<string, string> = {
    "content-creator": `You are advising a CONTENT CREATOR — someone who makes videos, posts, and content on social platforms.
They need to know: Should I make content about this trend? Will it get views? Is it too late? What angle should I take?
Use language like: "engagement potential", "content window", "creator saturation", "audience fatigue", "viral coefficient".
Frame everything as: Will creating content about this trend RIGHT NOW get them reach, followers, and engagement?
Give specific percentages, timeframes, and actionable creator advice.`,

    "general-user": `You are advising a GENERAL USER — someone who is simply curious about trends and wants to understand them.
They need to know: What is this trend? Is it growing or dying? What's the cultural significance? Should I pay attention?
Use accessible language, avoid heavy jargon. Explain things like you're talking to a smart friend.
Frame everything as: What does this trend mean, where is it going, and why should anyone care?
Give clear percentages and simple timeframes anyone can understand.`,

    "marketing-team": `You are advising a MARKETING PROFESSIONAL — someone deciding whether to build campaigns around this trend.
They need to know: Is there still ROI in this trend? What's the risk of launching a campaign now? Will it resonate or backfire?
Use language like: "campaign viability", "brand safety", "audience sentiment", "market saturation", "conversion window".
Frame everything as: Should we invest marketing budget into this trend, and what's the risk-reward ratio?
Give specific ROI estimates, risk percentages, and campaign timing recommendations.`,

    "platform-moderator": `You are advising a PLATFORM PROMOTER / MODERATOR — someone who manages content feeds and decides which trends to amplify or suppress.
They need to know: Should we boost this trend for engagement? Is it safe? Will it cause backlash? What's the engagement ceiling?
Use language like: "engagement ceiling", "platform risk", "content velocity", "moderation load", "amplification ROI".
Frame everything as: Should the platform promote this trend, throttle it, or let it run organically?
Give specific engagement metrics, safety scores, and platform-level recommendations.`,
};

// Build a role prompt with platform-specific context appended
export function buildRolePrompt(userRole: string, platforms?: string[]): string {
    const base = ROLE_PROMPTS[userRole] || ROLE_PROMPTS["general-user"];
    if (!platforms || platforms.length === 0) return base;

    const platformAdvice: Record<string, string> = {
        tiktok: "short-form video strategy, trending sounds, duets, and hashtag challenges for TikTok",
        instagram: "visual storytelling, Reels, carousel posts, and Stories engagement for Instagram",
        youtube: "long-form video SEO, Shorts strategy, thumbnail optimization, and watch time for YouTube",
        twitter: "real-time commentary, threads, quote tweets, and trending hashtag participation for X/Twitter",
        x: "real-time commentary, threads, quote tweets, and trending hashtag participation for X/Twitter",
        reddit: "community engagement, subreddit targeting, and authentic discussion for Reddit",
        linkedin: "professional thought leadership, industry insights, and B2B content for LinkedIn",
        facebook: "community groups, shareable content, and broad-audience engagement for Facebook",
        snapchat: "ephemeral content, AR lenses, and Gen-Z engagement for Snapchat",
        pinterest: "visual search optimization, pin strategy, and evergreen content for Pinterest",
    };

    const platformContext = platforms
        .map(p => platformAdvice[p.toLowerCase()] || `platform-specific strategy for ${p}`)
        .join("; ");

    return `${base}

PLATFORM CONTEXT: The user is active on ${platforms.join(", ")}. Tailor your advice to these platforms — mention ${platformContext}.`;
}

// Map onboarding quiz roles to our role keys
export function mapQuizRole(quizRole: string): string {
    const mapping: Record<string, string> = {
        creator: "content-creator",
        marketer: "marketing-team",
        analyst: "general-user",
        executive: "platform-moderator",
    };
    return mapping[quizRole] || quizRole || "general-user";
}
