import { StockQuote, IndexData, AnalystRating } from "./types";
import { INDEX_SYMBOLS, VIX_THRESHOLDS } from "./constants";
import { VixData } from "./types";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

function fmpUrl(path: string, params: Record<string, string> = {}): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error("FMP_API_KEY is not set");
  const searchParams = new URLSearchParams({ ...params, apikey: apiKey });
  return `${FMP_BASE}${path}?${searchParams}`;
}

/**
 * FMP Fallback：获取个股行情
 * 当 Yahoo Finance 超时时使用
 */
export async function fetchQuotesFMP(symbols: string[]): Promise<StockQuote[]> {
  if (symbols.length === 0) return [];

  const url = fmpUrl(`/quote/${symbols.join(",")}`);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FMP quote failed: ${res.status}`);

  const data = await res.json();
  return (data as any[]).map((item) => ({
    symbol: item.symbol,
    price: item.price ?? 0,
    change: item.change ?? 0,
    changePct: item.changesPercentage ?? 0,
  }));
}

/**
 * FMP Fallback：获取指数数据
 */
export async function fetchIndicesFMP(): Promise<{
  indices: IndexData[];
  vix: VixData;
  treasury10y: number;
}> {
  const fmpIndexMap: Record<string, string> = {
    "^GSPC": "^GSPC",
    "^IXIC": "^IXIC",
    "^DJI": "^DJI",
    "^SOX": "^SOX",
  };

  const allSymbols = [...Object.keys(fmpIndexMap), "^VIX", "^TNX"];
  const url = fmpUrl(`/quote/${allSymbols.join(",")}`);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FMP indices failed: ${res.status}`);

  const data: any[] = await res.json();
  const indices: IndexData[] = [];
  let vix: VixData = { value: 0, level: "normal" };
  let treasury10y = 0;

  for (const item of data) {
    if (item.symbol === "^VIX") {
      const val = item.price ?? 0;
      vix = {
        value: val,
        level:
          val < VIX_THRESHOLDS.LOW ? "low" :
          val < VIX_THRESHOLDS.NORMAL ? "normal" :
          val < VIX_THRESHOLDS.ELEVATED ? "elevated" : "high",
      };
    } else if (item.symbol === "^TNX") {
      treasury10y = item.price ?? 0;
    } else if (INDEX_SYMBOLS[item.symbol]) {
      indices.push({
        symbol: item.symbol,
        name: INDEX_SYMBOLS[item.symbol],
        value: item.price ?? 0,
        change: item.change ?? 0,
        changePct: item.changesPercentage ?? 0,
      });
    }
  }

  return { indices, vix, treasury10y };
}

/**
 * 获取分析师共识评级和目标价
 */
export async function fetchAnalystRatings(symbols: string[]): Promise<AnalystRating[]> {
  const ratings: AnalystRating[] = [];

  for (const symbol of symbols) {
    try {
      const url = fmpUrl(`/grade/${symbol}`, { limit: "30" });
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) continue;

      const data: any[] = await res.json();
      if (!data.length) continue;

      const gradeMap: Record<string, number> = {};
      for (const g of data) {
        const grade = g.newGrade || g.grade || "";
        gradeMap[grade] = (gradeMap[grade] || 0) + 1;
      }

      const sorted = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]);
      const consensus = sorted[0]?.[0] || "N/A";

      // 获取目标价共识
      let targetPrice = 0;
      const ptcUrl = fmpUrl(`/price-target-consensus/${symbol}`);
      const ptcRes = await fetch(ptcUrl, { next: { revalidate: 0 } });
      if (ptcRes.ok) {
        const ptcData: any[] = await ptcRes.json();
        if (ptcData.length > 0) {
          targetPrice = ptcData[0].targetConsensus ?? 0;
        }
      }

      ratings.push({
        symbol,
        consensus,
        targetPrice,
        analystCount: data.length,
      });
    } catch {
      continue;
    }
  }

  return ratings;
}
