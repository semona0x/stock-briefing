import { BriefingInput, IndexData, StockQuote, AnalystRating, NewsItem, EarningsEvent, VixData } from "./types";
import { SessionState } from "./types";

/**
 * 将各数据源的原始数据整理成结构化 BriefingInput
 * 不直接把 API 响应喂给 GPT，先在此处编辑整理
 */
export function assembleBriefingInput(params: {
  date: string;
  sessionState: SessionState;
  indices: IndexData[];
  vix: VixData;
  treasury10y: number;
  quotes: StockQuote[];
  analysts: AnalystRating[];
  news: NewsItem[];
  earnings: EarningsEvent[];
}): BriefingInput {
  const { date, sessionState, indices, vix, treasury10y, quotes, analysts, news, earnings } = params;

  // 构建分析师评级映射
  const analystMap = new Map(analysts.map((a) => [a.symbol, a]));

  return {
    market_summary: {
      date,
      session_state: sessionState,
      indices: indices.map((idx) => ({
        name: idx.name,
        value: idx.value,
        change_pct: idx.changePct,
      })),
      vix: { value: vix.value, level: vix.level },
      treasury_10y: treasury10y,
    },
    watchlist: quotes.map((q) => {
      const analyst = analystMap.get(q.symbol);
      return {
        symbol: q.symbol,
        price: q.price,
        change_pct: q.changePct,
        analyst_consensus: analyst?.consensus ?? "N/A",
        analyst_count: analyst?.analystCount ?? 0,
        price_target: analyst?.targetPrice ?? 0,
      };
    }),
    top_news: news.slice(0, 10).map((n) => ({
      title: n.title,
      source: n.source,
      sentiment: n.sentiment,
      related_symbols: n.relatedSymbols,
      published_at: n.publishedAt,
    })),
    analyst_changes: analysts.map((a) => ({
      symbol: a.symbol,
      consensus: a.consensus,
      target_price: a.targetPrice,
      analyst_count: a.analystCount,
    })),
    earnings_upcoming: earnings.map((e) => ({
      symbol: e.symbol,
      date: e.date,
      days_until: e.daysUntil,
    })),
  };
}
