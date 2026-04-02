import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/yahoo-finance";
import { fetchQuotesFMP } from "@/lib/fmp";
export const revalidate = 300; // HIGH_FREQ: 5 minutes

/**
 * GET /api/quotes?symbols=INTC,NVDA,GOOGL
 * Yahoo Finance 优先，超时 fallback 到 FMP
 */
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());

  if (symbols.length === 0) {
    return NextResponse.json({
      data: [],
      error: null,
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const data = await Promise.race([
      fetchQuotes(symbols),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Yahoo timeout")), 5000)
      ),
    ]);

    return NextResponse.json({
      data,
      error: null,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    console.warn("Yahoo Finance quotes failed, falling back to FMP");

    try {
      const data = await fetchQuotesFMP(symbols);
      return NextResponse.json({
        data,
        error: null,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: "行情数据暂时不可用",
          updatedAt: new Date().toISOString(),
        },
        { status: 502 }
      );
    }
  }
}
