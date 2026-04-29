// News fetcher: Google News RSS + GNews API + OG image extraction
// Must complete within 2s to not slow down the pipeline

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  date: string;
  image?: string;
  url?: string;
}

interface NewsResult {
  headlines: string[];
  articles: NewsArticle[];
  sentiment: string;
}

const NEWS_TIMEOUT = 2000; // 2 seconds max
const OG_TIMEOUT = 1500;   // 1.5s per article for OG image

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch the og:image from an article URL */
async function fetchOGImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OG_TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendPrism/2.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    // Only read first 50KB to find the meta tag quickly
    const reader = res.body?.getReader();
    if (!reader) return undefined;
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    // Extract og:image
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] || undefined;
  } catch {
    return undefined;
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
    const url = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";

    if (title) {
      articles.push({ title, description: description || title, source, date: pubDate, url: url || undefined });
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
    return (data.articles || []).map((a: { title: string; description: string; source: { name: string }; publishedAt: string; image?: string; url?: string }) => ({
      title: a.title,
      description: a.description || a.title,
      source: a.source?.name || "",
      date: a.publishedAt || "",
      image: a.image || undefined,
      url: a.url || undefined,
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

    // GNews first (richer descriptions + images)
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

    const final = merged.slice(0, 8);

    // Fetch OG images for articles that don't have one (in parallel, non-blocking)
    const needsImage = final.filter(a => !a.image && a.url);
    if (needsImage.length > 0) {
      const imageResults = await Promise.allSettled(
        needsImage.map(a => fetchOGImage(a.url!))
      );
      needsImage.forEach((a, i) => {
        const result = imageResults[i];
        if (result.status === "fulfilled" && result.value) {
          a.image = result.value;
        }
      });
    }

    const headlines = final.map(a => a.title);
    const sentiment = guessSentiment(final);

    return { headlines, articles: final, sentiment };
  } catch {
    return { headlines: [], articles: [], sentiment: "unknown" };
  }
}
