// ===== 市场数据类型 =====

/** 市场交易状态 */
export type SessionState = "pre_market" | "open" | "after_hours" | "closed" | "weekend";

/** VIX 恐慌等级 */
export type VixLevel = "low" | "normal" | "elevated" | "high";

/** 新闻情绪 */
export type Sentiment = "positive" | "negative" | "neutral";

/** 指数数据 */
export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
}

/** VIX 数据 */
export interface VixData {
  value: number;
  level: VixLevel;
}

/** 自选股行情 */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

/** 分析师评级 */
export interface AnalystRating {
  symbol: string;
  consensus: string;
  targetPrice: number;
  analystCount: number;
}

/** 新闻条目 */
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  sentiment: Sentiment;
  relatedSymbols: string[];
  publishedAt: string;
}

/** 财报日历条目 */
export interface EarningsEvent {
  symbol: string;
  date: string;
  hour: "bmo" | "amc" | "dmh" | "";
  estimate: number | null;
  daysUntil: number;
}

/** AI 简报结构 */
export interface BriefingData {
  headline: string;
  analysis: string;
  generatedAt: string;
}

/** 市场摘要（传给 AI 的结构化对象） */
export interface MarketSummary {
  date: string;
  sessionState: SessionState;
  indices: IndexData[];
  vix: VixData;
  treasury10y: number;
}

/** 自选股摘要（传给 AI 的结构化对象） */
export interface WatchlistItem {
  symbol: string;
  price: number;
  changePct: number;
  analystConsensus: string;
  analystCount: number;
  priceTarget: number;
}

/** 完整 Briefing 输入对象（传给 GPT 的结构化数据） */
export interface BriefingInput {
  market_summary: {
    date: string;
    session_state: SessionState;
    indices: { name: string; value: number; change_pct: number }[];
    vix: { value: number; level: VixLevel };
    treasury_10y: number;
  };
  watchlist: {
    symbol: string;
    price: number;
    change_pct: number;
    analyst_consensus: string;
    analyst_count: number;
    price_target: number;
  }[];
  top_news: {
    title: string;
    source: string;
    sentiment: Sentiment;
    related_symbols: string[];
    published_at: string;
  }[];
  analyst_changes: {
    symbol: string;
    consensus: string;
    target_price: number;
    analyst_count: number;
  }[];
  earnings_upcoming: {
    symbol: string;
    date: string;
    days_until: number;
  }[];
}

/** Chat 消息 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** API 响应包装 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  updatedAt: string;
}
