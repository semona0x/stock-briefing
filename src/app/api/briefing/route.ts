import { NextRequest, NextResponse } from "next/server";
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
import { REVALIDATE } from "@/lib/constants";

export const revalidate = REVALIDATE.LOW_FREQ;

/**
 * GET /api/briefing?symbols=INTC,NVDA,GOOGL
 * 1. 并行获取所有数据源
 * 2. 组装结构化 BriefingInput
 * 3. 调用 GPT 生成中文简报
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

  try {
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

    const briefing = await generateBriefing(briefingInput);

    return NextResponse.json({
      data: {
        ...briefing,
        generatedAt: new Date().toISOString(),
        briefingInput,
      },
      error: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Briefing generation failed:", error);
    return NextResponse.json(
      { data: null, error: "简报生成失败，请稍后重试", updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
