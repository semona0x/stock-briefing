import { NewsItem } from "./types";

const MARKETAUX_BASE = "https://api.marketaux.com/v1";

/**
 * 从 Marketaux 获取自选股相关新闻
 * 包含情绪分析标签
 */
export async function fetchNews(symbols: string[]): Promise<NewsItem[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) throw new Error("MARKETAUX_API_KEY is not set");

  if (symbols.length === 0) return [];

  const params = new URLSearchParams({
    api_token: apiKey,
    symbols: symbols.join(","),
    filter_entities: "true",
    language: "en",
    limit: "20",
  });

  const res = await fetch(`${MARKETAUX_BASE}/news/all?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Marketaux API failed: ${res.status}`);
  }

  const json = await res.json();
  const articles: any[] = json.data ?? [];

  return articles.map((article) => {
    const entities = article.entities ?? [];
    const sentimentScores = entities
      .filter((e: any) => symbols.includes(e.symbol))
      .map((e: any) => e.sentiment_score ?? 0);

    const avgSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length
        : 0;

    const sentiment =
      avgSentiment > 0.15 ? "positive" :
      avgSentiment < -0.15 ? "negative" : "neutral";

    const relatedSymbols = entities
      .map((e: any) => e.symbol)
      .filter((s: string | undefined): s is string => !!s && symbols.includes(s));

    return {
      title: article.title ?? "",
      url: article.url ?? "",
      source: article.source ?? "",
      sentiment: sentiment as "positive" | "negative" | "neutral",
      relatedSymbols: [...new Set<string>(relatedSymbols)],
      publishedAt: article.published_at ?? "",
    };
  });
}
