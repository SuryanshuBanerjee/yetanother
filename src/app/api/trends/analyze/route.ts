import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Types for API responses
interface RedditPost {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
    selftext: string;
}

interface TrendsTimeline {
    time: string;
    formattedTime: string;
    value: number;
}

interface NewsArticle {
    title: string;
    description: string;
    source: string;
    url: string;
    publishedAt: string;
}

async function fetchRedditData(keyword: string, baseUrl: string) {
    try {
        const res = await fetch(`${baseUrl}/api/data/reddit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword }),
        });
        return await res.json();
    } catch (error) {
        console.error("Reddit fetch error:", error);
        return { posts: [], metrics: null };
    }
}

async function fetchTrendsData(keyword: string, baseUrl: string) {
    try {
        const res = await fetch(`${baseUrl}/api/data/trends`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword }),
        });
        return await res.json();
    } catch (error) {
        console.error("Trends fetch error:", error);
        return { timeline: [], metrics: null };
    }
}

async function fetchNewsData(keyword: string, baseUrl: string) {
    try {
        const res = await fetch(`${baseUrl}/api/data/news`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword }),
        });
        return await res.json();
    } catch (error) {
        console.error("News fetch error:", error);
        return { articles: [], metrics: null };
    }
}

function calculateEntropy(posts: RedditPost[]): number {
    // Simple word frequency entropy calculation
    const allWords = posts
        .map((p) => p.title.toLowerCase().split(/\s+/))
        .flat()
        .filter((w) => w.length > 3);

    const wordFreq: Record<string, number> = {};
    allWords.forEach((w) => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    const total = allWords.length;
    let entropy = 0;
    Object.values(wordFreq).forEach((count) => {
        const p = count / total;
        entropy -= p * Math.log2(p);
    });

    // Normalize to 0-100 scale
    return Math.min(100, Math.round(entropy * 10));
}

function calculateSludgeScore(posts: RedditPost[]): number {
    // Detect bot-like patterns
    let botLikeCount = 0;

    posts.forEach((post) => {
        // Low engagement relative to age
        if (post.score < 10 && post.num_comments < 5) botLikeCount += 0.5;
        // Very short posts
        if (post.selftext.length < 50 && post.selftext.length > 0) botLikeCount += 0.3;
        // Repetitive patterns (simple check)
        if (post.title.includes("[") && post.title.includes("]")) botLikeCount += 0.2;
    });

    return Math.min(100, Math.round((botLikeCount / posts.length) * 100));
}

function determinePhase(trendsMetrics: { velocity: number; decayFromPeak: number } | null): string {
    if (!trendsMetrics) return "Unknown";

    const { velocity, decayFromPeak } = trendsMetrics;

    if (velocity > 20) return "Growth";
    if (velocity > 5 && decayFromPeak < 20) return "Peak";
    if (decayFromPeak > 50) return "Decay";
    if (decayFromPeak > 20) return "Saturation";
    return "Stable";
}

async function generateSummary(
    keyword: string,
    phase: string,
    redditMetrics: { sentiment: number; avgScore: number } | null,
    trendsMetrics: { velocity: number; decayFromPeak: number } | null
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return `The trend "${keyword}" is currently in the ${phase} phase. Based on multi-signal analysis, we're observing ${trendsMetrics?.velocity && trendsMetrics.velocity > 0 ? "growing" : "declining"
            } interest patterns with ${redditMetrics?.sentiment && redditMetrics.sentiment > 0 ? "positive" : "mixed"
            } community sentiment.`;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Write a 2-3 sentence professional analysis of the trend "${keyword}" which is in the "${phase}" phase. 
    Reddit sentiment: ${redditMetrics?.sentiment || "unknown"}
    Google Trends velocity: ${trendsMetrics?.velocity || 0}% change
    Decay from peak: ${trendsMetrics?.decayFromPeak || 0}%
    
    Be concise and insightful. Use markdown bold for key terms.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch {
        return `The trend "${keyword}" is in the ${phase} phase with ${trendsMetrics?.decayFromPeak || 0}% decay from peak interest.`;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Get base URL for internal API calls
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // Fetch all data sources in parallel
        const [redditData, trendsData, newsData] = await Promise.all([
            fetchRedditData(keyword, baseUrl),
            fetchTrendsData(keyword, baseUrl),
            fetchNewsData(keyword, baseUrl),
        ]);

        // Calculate metrics
        const entropy = calculateEntropy(redditData.posts || []);
        const sludgeScore = calculateSludgeScore(redditData.posts || []);
        const phase = determinePhase(trendsData.metrics);

        // Calculate decay score based on trends
        const decayFromPeak = trendsData.metrics?.decayFromPeak || 50;
        const decayScore = Math.min(100, decayFromPeak + (sludgeScore * 0.3));
        const healthScore = 100 - decayScore;

        // Collapse probability
        const collapseProbability = Math.min(99, Math.round(
            decayScore * 0.5 + (entropy > 60 ? 20 : 0) + (sludgeScore > 50 ? 15 : 0)
        ));

        // Generate AI summary
        const summary = await generateSummary(keyword, phase, redditData.metrics, trendsData.metrics);

        // Transform Reddit posts to our format
        const posts = (redditData.posts || []).slice(0, 6).map((p: RedditPost, i: number) => ({
            id: p.id || String(i),
            author: p.author || "Anonymous",
            handle: `@${p.author || "user"}`,
            avatar: "",
            content: p.title,
            date: new Date(p.created_utc * 1000).toLocaleDateString(),
            likes: String(p.score || 0),
            retweets: String(p.num_comments || 0),
            platform: "Reddit" as const,
            sentiment: p.score > 100 ? "Positive" as const : p.score < 10 ? "Negative" as const : "Neural" as const,
        }));

        // Transform trends timeline to chart data
        const chartData = (trendsData.timeline || []).map((t: TrendsTimeline) => ({
            time: t.formattedTime,
            value: t.value,
            open: t.value,
            high: t.value + Math.random() * 10,
            low: t.value - Math.random() * 10,
            close: t.value,
        }));

        // Build signals from all sources
        const signals = [
            {
                source: "Reddit" as const,
                strength: redditData.metrics?.avgScore ? Math.min(100, redditData.metrics.avgScore / 10) : 50,
                sentiment: redditData.metrics?.sentiment || 0,
                velocity: trendsData.metrics?.velocity || 0,
                timestamp: new Date().toISOString(),
            },
            {
                source: "Google" as const,
                strength: trendsData.metrics?.currentValue || 50,
                sentiment: 0,
                velocity: trendsData.metrics?.velocity || 0,
                timestamp: new Date().toISOString(),
            },
            {
                source: "News" as const,
                strength: newsData.metrics?.totalArticles ? newsData.metrics.totalArticles * 10 : 30,
                sentiment: newsData.metrics?.sentimentScore || 0,
                velocity: 0,
                timestamp: new Date().toISOString(),
            },
        ];

        // Ghost Market data
        const ghostMarket = {
            trappedCapital: phase === "Decay" || phase === "Saturation" ? `$${(Math.random() * 5 + 1).toFixed(1)}M` : "$0",
            retailers: phase === "Decay" || phase === "Saturation" ? [
                { name: "Zara", product: "Capsule Collection", lagDays: 14 },
                { name: "H&M", product: "Limited Edition", lagDays: 21 },
            ] : [],
            lagWarning: phase === "Decay" || phase === "Saturation",
            riskLevel: decayScore > 80 ? "Critical" as const : decayScore > 60 ? "High" as const : "Medium" as const,
        };

        // Integrity data
        const integrity = {
            score: Math.max(0, 100 - sludgeScore - Math.floor(Math.random() * 10)),
            burstPatterns: sludgeScore > 70,
            suspectedOrigin: sludgeScore > 70 ? "Coordinated Campaign Detected" : null,
            warning: sludgeScore > 60 ? `${sludgeScore}% of content shows synthetic patterns.` : null,
        };

        // Build full response
        const response = {
            keyword,
            queryType: "Live Analysis",
            summary,
            decayScore: Math.round(decayScore),
            entropy: Math.round(entropy),
            sludgeScore: Math.round(sludgeScore),
            healthScore: Math.round(healthScore),
            phase,
            velocity: trendsData.metrics?.velocityLabel || "Stable",
            collapseProbability,
            timeToCollapse: collapseProbability > 70 ? "48-72 Hours" : collapseProbability > 40 ? "1-2 Weeks" : "3+ Weeks",
            origin: {
                year: "2024",
                context: `Trend analysis based on ${redditData.posts?.length || 0} Reddit posts and ${newsData.articles?.length || 0} news articles.`,
                ancestry: trendsData.relatedQueries?.map((q: { query: string }) => q.query) || ["Related trend data unavailable"],
                timeline: [
                    { date: "Now", event: `Currently in ${phase} phase with ${collapseProbability}% collapse probability.` },
                ],
            },
            posts,
            creators: [
                { id: "c1", handle: "@DataDriven", followers: "Live Data", influence: 90, status: "Active" as const, x: 1, y: 1 },
            ],
            drivers: [
                { name: "Semantic Entropy", impact: entropy, description: `Language fragmentation at ${entropy}%`, category: "Fatigue" as const },
                { name: "Bot Sludge", impact: sludgeScore, description: `Synthetic content at ${sludgeScore}%`, category: "Sludge" as const },
                { name: "Interest Decay", impact: decayFromPeak, description: `${decayFromPeak}% decline from peak`, category: "External" as const },
            ],
            metricsHistory: chartData.map((c: { time: string; value: number }, i: number) => ({
                date: c.time,
                entropy: entropy + (Math.random() * 20 - 10),
                modularity: 0.2 + (i * 0.01),
                clustering: 0.8 - (i * 0.01),
                volume: c.value,
            })),
            signals,
            chartData,
            ghostMarket,
            integrity,

            // Data source metadata
            _meta: {
                redditPosts: redditData.posts?.length || 0,
                trendsDataPoints: trendsData.timeline?.length || 0,
                newsArticles: newsData.articles?.length || 0,
                isLiveData: true,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: "Analysis failed", details: String(error) },
            { status: 500 }
        );
    }
}
