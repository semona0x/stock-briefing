import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/marketaux";
export const revalidate = 1800; // MID_FREQ: 30 minutes

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());

  if (symbols.length === 0) {
    return NextResponse.json({ data: [], error: null, updatedAt: new Date().toISOString() });
  }

  try {
    const data = await fetchNews(symbols);
    return NextResponse.json({ data, error: null, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("News fetch failed:", error);
    return NextResponse.json(
      { data: null, error: "新闻数据暂时不可用", updatedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
