import { NextRequest, NextResponse } from "next/server";

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
    url: string;
}

export async function POST(req: NextRequest) {
    try {
        const { keyword } = await req.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Clean keyword for Reddit search
        const searchTerm = keyword.replace("#", "").trim();
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchTerm)}&sort=relevance&limit=25`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "TrendDecayEngine/1.0 (Research Project)",
            },
        });

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();
        const posts: RedditPost[] = data.data.children.map((child: { data: RedditPost }) => ({
            id: child.data.id,
            title: child.data.title,
            author: child.data.author,
            subreddit: child.data.subreddit,
            score: child.data.score,
            num_comments: child.data.num_comments,
            created_utc: child.data.created_utc,
            permalink: child.data.permalink,
            selftext: child.data.selftext?.substring(0, 500) || "",
            url: child.data.url,
        }));

        // Calculate basic metrics from Reddit data
        const avgScore = posts.reduce((sum, p) => sum + p.score, 0) / posts.length || 0;
        const avgComments = posts.reduce((sum, p) => sum + p.num_comments, 0) / posts.length || 0;
        const uniqueSubreddits = new Set(posts.map(p => p.subreddit)).size;

        // Simple sentiment approximation (based on score and engagement)
        const engagement = avgScore + avgComments * 2;
        const sentiment = engagement > 500 ? 0.5 : engagement > 100 ? 0 : -0.5;

        return NextResponse.json({
            posts,
            metrics: {
                totalPosts: posts.length,
                avgScore: Math.round(avgScore),
                avgComments: Math.round(avgComments),
                uniqueSubreddits,
                sentiment,
            },
        });
    } catch (error) {
        console.error("Reddit API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch Reddit data", posts: [], metrics: null },
            { status: 500 }
        );
    }
}
