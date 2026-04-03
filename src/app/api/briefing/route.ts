import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchIndices } from "@/lib/yahoo-finance";
import { fetchIndicesFMP } from "@/lib/fmp";
import { fetchQuotes } from "@/lib/yahoo-finance";
import { fetchQuotesFMP } from "@/lib/fmp";
import { fetchAnalystRatings } from "@/lib/fmp";
import { fetchNews } from "@/lib/marketaux";
import { fetchEarningsCalendar } from "@/lib/finnhub";
import { getMarketStatus } from "@/lib/market-status";
import { assembleBriefingInput } from "@/lib/briefing-pipeline";
import { generateBriefing } from "@/lib/openai";

// NOTE: export const revalidate 在读取 request.searchParams 的动态路由上无效。
// 改用 unstable_cache 在数据层缓存，绕过该限制。

/**
 * 核心生成逻辑（无缓存）。
 * symbolsKey 格式：YYYY-MM-DD:SYM1,SYM2,SYM3（已排序）
 */
async function runGeneration(symbolsKey: string) {
  console.log(`[Briefing] FRESH generation for: ${symbolsKey}`);

  // key 格式: "2026-04-02:GOOGL,INTC,NVDA"
  const colonIdx = symbolsKey.indexOf(":");
  const symbols = symbolsKey.slice(colonIdx + 1).split(",");

  const [indicesResult, quotesResult, analysts, news, earnings] = await Promise.all([
    fetchIndices().catch(() => fetchIndicesFMP().catch(() => null)),
    fetchQuotes(symbols).catch(() => fetchQuotesFMP(symbols).catch(() => [])),
    fetchAnalystRatings(symbols).catch(() => []),
    fetchNews(symbols).catch(() => []),
    fetchEarningsCalendar(symbols).catch(() => []),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const sessionState = getMarketStatus();

  const briefingInput = assembleBriefingInput({
    date: today,
    sessionState,
    indices: indicesResult?.indices ?? [],
    vix: indicesResult?.vix ?? { value: 0, level: "normal" },
    treasury10y: indicesResult?.treasury10y ?? 0,
    quotes: quotesResult ?? [],
    analysts,
    news,
    earnings,
  });

  const pricesText = (quotesResult ?? [])
    .map((q) => `- ${q.symbol}：$${q.price.toFixed(2)}，今日涨跌：${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`)
    .join("\n");

  const briefing = await generateBriefing(briefingInput, pricesText, today);
  const generatedAt = new Date().toISOString();

  console.log(`[Briefing] Done — generated at ${generatedAt}`);

  return { ...briefing, generatedAt, briefingInput };
}

/**
 * 缓存简报生成结果。缓存键包含日期，每天自动失效。
 * 导出供 cron 路由预热缓存使用。
 */
export const getCachedBriefing = unstable_cache(
  runGeneration,
  ["briefing-v2"],
  { revalidate: 43200 } // 12小时兜底
);

/**
 * GET /api/briefing?symbols=INTC,NVDA,GOOGL[&force=true]
 */
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());
  const force = request.nextUrl.searchParams.get("force") === "true";

  if (symbols.length === 0) {
    return NextResponse.json({
      data: null,
      error: "请提供自选股列表",
      updatedAt: new Date().toISOString(),
    });
  }

  const today = new Date().toISOString().split("T")[0];
  // 包含日期的缓存键，保证每天自动失效
  const symbolsKey = `${today}:${[...symbols].sort().join(",")}`;

  try {
    const data = force ? await runGeneration(symbolsKey) : await getCachedBriefing(symbolsKey);
    console.log(`[Briefing] Serving for ${symbolsKey}, generated at ${data.generatedAt}`);

    return NextResponse.json({
      data,
      error: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Briefing] Failed:", error);
    return NextResponse.json(
      { data: null, error: "简报生成失败，请稍后重试", updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
