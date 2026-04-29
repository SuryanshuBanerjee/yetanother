import { NextRequest, NextResponse } from "next/server";

interface NewsArticle {
    title: string;
    description: string;
    source: { name: string };
    url: string;
    publishedAt: string;
    image: string | null;
}

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        const apiKey = process.env.GNEWS_API_KEY;

        // If no API key, return mock data
        if (!apiKey) {
            console.log("No GNEWS_API_KEY found, returning mock news data");
            return NextResponse.json({
                articles: [
                    {
                        title: `The Rise and Fall of ${keyword}: A Cultural Analysis`,
                        description: "Industry experts weigh in on the trend's trajectory.",
                        source: { name: "Mock News" },
                        url: "#",
                        publishedAt: new Date().toISOString(),
                        image: null,
                    },
                    {
                        title: `${keyword} Reaches Saturation Point, Analysts Say`,
                        description: "Market researchers predict a downturn in engagement.",
                        source: { name: "Mock Business" },
                        url: "#",
                        publishedAt: new Date(Date.now() - 86400000).toISOString(),
                        image: null,
                    },
                ],
                isMock: true,
            });
        }

        // Clean keyword for search
        const searchTerm = keyword.replace("#", "").trim();
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchTerm)}&lang=en&max=10&apikey=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`GNews API error: ${response.status}`);
        }

        const data = await response.json();
        const articles: NewsArticle[] = data.articles || [];

        // Calculate news sentiment (simple heuristic based on titles)
        const negativeWords = ["fall", "crash", "dead", "dying", "end", "fail", "crisis", "decline"];
        const positiveWords = ["rise", "boom", "surge", "growth", "trending", "viral", "popular"];

        let sentimentScore = 0;
        articles.forEach((article: NewsArticle) => {
            const titleLower = article.title.toLowerCase();
            negativeWords.forEach((word) => {
                if (titleLower.includes(word)) sentimentScore -= 1;
            });
            positiveWords.forEach((word) => {
                if (titleLower.includes(word)) sentimentScore += 1;
            });
        });

        return NextResponse.json({
            articles: articles.map((a: NewsArticle) => ({
                title: a.title,
                description: a.description,
                source: a.source.name,
                url: a.url,
                publishedAt: a.publishedAt,
                image: a.image,
            })),
            metrics: {
                totalArticles: articles.length,
                sentiment: sentimentScore > 0 ? "Positive" : sentimentScore < 0 ? "Negative" : "Neutral",
                sentimentScore,
            },
            isMock: false,
        });
    } catch (error) {
        console.error("News API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch news data", articles: [], metrics: null },
            { status: 500 }
        );
    }
}
