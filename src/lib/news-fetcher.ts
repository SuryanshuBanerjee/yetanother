// News fetcher: Google News RSS + optional GNews API
// Must complete within 2s to not slow down the pipeline

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  date: string;
}

interface NewsResult {
  headlines: string[];
  articles: NewsArticle[];
  sentiment: string;
}

const NEWS_TIMEOUT = 2000; // 2 seconds max

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function parseRSSItems(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")?.trim() || "";
    const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")?.trim() || "";
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1")?.replace(/<[^>]+>/g, "")?.trim() || "";

    if (title) {
      articles.push({ title, description: description || title, source, date: pubDate });
    }
  }
  return articles;
}

async function fetchGoogleNewsRSS(keyword: string): Promise<NewsArticle[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en&gl=US&ceid=US:en`;
    const res = await fetchWithTimeout(url, NEWS_TIMEOUT);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 10);
  } catch {
    return [];
  }
}

async function fetchGNews(keyword: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&lang=en&max=5&apikey=${apiKey}`;
    const res = await fetchWithTimeout(url, NEWS_TIMEOUT);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a: { title: string; description: string; source: { name: string }; publishedAt: string }) => ({
      title: a.title,
      description: a.description || a.title,
      source: a.source?.name || "",
      date: a.publishedAt || "",
    }));
  } catch {
    return [];
  }
}

function guessSentiment(articles: NewsArticle[]): string {
  const text = articles.map(a => `${a.title} ${a.description}`).join(" ").toLowerCase();
  const positive = ["surge", "breakthrough", "record", "boom", "soar", "growth", "success", "win", "gain", "rally"];
  const negative = ["crash", "crisis", "scandal", "death", "fall", "drop", "warn", "fear", "risk", "fail", "arrest", "charged"];
  let score = 0;
  for (const w of positive) if (text.includes(w)) score++;
  for (const w of negative) if (text.includes(w)) score--;
  if (score > 1) return "positive";
  if (score < -1) return "negative";
  return "mixed";
}

export async function fetchNews(keyword: string): Promise<NewsResult> {
  try {
    // Fetch both sources in parallel, both with timeout
    const [rssArticles, gnewsArticles] = await Promise.all([
      fetchGoogleNewsRSS(keyword),
      fetchGNews(keyword),
    ]);

    // Merge: GNews enriches RSS, deduplicate by title similarity
    const seen = new Set<string>();
    const merged: NewsArticle[] = [];

    // GNews first (richer descriptions)
    for (const a of gnewsArticles) {
      const key = a.title.toLowerCase().slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(a);
      }
    }
    // Then RSS
    for (const a of rssArticles) {
      const key = a.title.toLowerCase().slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(a);
      }
    }

    const headlines = merged.slice(0, 8).map(a => a.title);
    const sentiment = guessSentiment(merged);

    return { headlines, articles: merged.slice(0, 8), sentiment };
  } catch {
    return { headlines: [], articles: [], sentiment: "unknown" };
  }
}
