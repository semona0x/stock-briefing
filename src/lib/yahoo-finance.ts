import YahooFinance from "yahoo-finance2";
import { IndexData, StockQuote } from "./types";
import { INDEX_SYMBOLS, VIX_THRESHOLDS } from "./constants";
import { VixData } from "./types";

const yahooFinance = new YahooFinance();

/**
 * 从 Yahoo Finance 批量获取指数数据
 * 返回 6 个指数 + VIX + 10年美债收益率
 */
export async function fetchIndices(): Promise<{
  indices: IndexData[];
  vix: VixData;
  treasury10y: number;
}> {
  const symbols = Object.keys(INDEX_SYMBOLS);

  const results = await yahooFinance.quote(symbols);
  const resultArray = Array.isArray(results) ? results : [results];

  const indices: IndexData[] = [];
  let vix: VixData = { value: 0, level: "normal" };
  let treasury10y = 0;

  for (const quote of resultArray) {
    if (!quote || !quote.symbol) continue;

    const price = quote.regularMarketPrice ?? 0;
    const change = quote.regularMarketChange ?? 0;
    const changePct = quote.regularMarketChangePercent ?? 0;

    if (quote.symbol === "^VIX") {
      vix = {
        value: price,
        level:
          price < VIX_THRESHOLDS.LOW ? "low" :
          price < VIX_THRESHOLDS.NORMAL ? "normal" :
          price < VIX_THRESHOLDS.ELEVATED ? "elevated" : "high",
      };
    } else if (quote.symbol === "^TNX") {
      treasury10y = price;
    } else {
      indices.push({
        symbol: quote.symbol,
        name: INDEX_SYMBOLS[quote.symbol] ?? quote.symbol,
        value: price,
        change,
        changePct,
      });
    }
  }

  return { indices, vix, treasury10y };
}

/**
 * 从 Yahoo Finance 获取个股行情
 */
export async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
  if (symbols.length === 0) return [];

  const results = await yahooFinance.quote(symbols);
  const resultArray = Array.isArray(results) ? results : [results];

  return resultArray
    .filter((q) => q && q.symbol)
    .map((q) => ({
      symbol: q.symbol!,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
    }));
}
