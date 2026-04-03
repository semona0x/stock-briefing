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
 * 缓存简报生成结果，以 symbols key 为缓存键，12小时过期。
 * 函数体执行时打印日志（缓存命中时不执行）。
 */
const getCachedBriefing = unstable_cache(
  async (symbolsKey: string) => {
    console.log(`[Briefing] FRESH generation for: ${symbolsKey}`);

    const symbols = symbolsKey.split(",");

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
  },
  ["briefing-v1"], // 缓存命名空间
  { revalidate: 43200 } // 12小时
);

/**
 * GET /api/briefing?symbols=INTC,NVDA,GOOGL
 */
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());

  if (symbols.length === 0) {
    return NextResponse.json({
      data: null,
      error: "请提供自选股列表",
      updatedAt: new Date().toISOString(),
    });
  }

  // 对 symbols 排序，保证 [INTC,NVDA] 和 [NVDA,INTC] 命中同一缓存键
  const symbolsKey = [...symbols].sort().join(",");

  try {
    const data = await getCachedBriefing(symbolsKey);
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
