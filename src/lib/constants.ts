/** 默认自选股列表 */
export const DEFAULT_WATCHLIST = ["INTC", "NVDA", "GOOGL"];

/** 指数 Symbol 映射（Yahoo Finance 格式） */
export const INDEX_SYMBOLS: Record<string, string> = {
  "^GSPC": "标普500",
  "^IXIC": "纳斯达克",
  "^DJI": "道琼斯",
  "^SOX": "费城半导体",
  "^VIX": "VIX恐慌指数",
  "^TNX": "10年期美债",
};

/** Chat 快捷问题 */
export const QUICK_QUESTIONS = [
  "今天市场为什么涨/跌？",
  "NVDA 今天怎么了？",
  "INTC 最近有什么风险？",
  "分析师最近怎么看这几只股？",
  "最近有什么重要财报？",
  "现在应该关注什么？",
];

/** 缓存时间（秒） */
export const REVALIDATE = {
  HIGH_FREQ: 300,       // 5分钟：股价、指数
  MID_FREQ: 1800,       // 30分钟：新闻、评级
  LOW_FREQ: 86400,      // 24小时：AI 简报、财报日历
} as const;

/** VIX 等级阈值 */
export const VIX_THRESHOLDS = {
  LOW: 15,
  NORMAL: 20,
  ELEVATED: 30,
} as const;

/** localStorage key */
export const STORAGE_KEY_WATCHLIST = "stock-briefing-watchlist";

/** sessionStorage key */
export const STORAGE_KEY_CHAT = "stock-briefing-chat";
