// LLM Client wrappers for Groq, OpenRouter, and Featherless
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
// OPENROUTER - Advanced Inferences (Deep pattern analysis)
// Tries multiple free models with retry on rate-limit
// ============================================================
const OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-r1:free",
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

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://trendprism.app",
                    "X-Title": "TREND PRISM",
                },
                body: JSON.stringify(body),
            });

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
// FEATHERLESS - Verdict & Pros/Cons Generation
// ============================================================
export async function callFeatherless(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<LLMResponse> {
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) throw new Error("FEATHERLESS_API_KEY not set");

    const body: Record<string, unknown> = {
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 3000,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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
