import { EarningsEvent } from "./types";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

/**
 * 获取未来 7 天的财报日历
 * 筛选自选股相关的财报事件
 */
export async function fetchEarningsCalendar(symbols: string[]): Promise<EarningsEvent[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

  if (symbols.length === 0) return [];

  const today = new Date();
  const from = formatDate(today);
  const to = formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    from,
    to,
    token: apiKey,
  });

  const res = await fetch(`${FINNHUB_BASE}/calendar/earnings?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Finnhub API failed: ${res.status}`);
  }

  const json = await res.json();
  const earnings: any[] = json.earningsCalendar ?? [];

  const symbolSet = new Set(symbols.map((s) => s.toUpperCase()));

  return earnings
    .filter((e) => symbolSet.has(e.symbol?.toUpperCase()))
    .map((e) => {
      const eventDate = new Date(e.date);
      const diffTime = eventDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        symbol: e.symbol,
        date: e.date,
        hour: e.hour ?? "",
        estimate: e.epsEstimate ?? null,
        daysUntil,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
