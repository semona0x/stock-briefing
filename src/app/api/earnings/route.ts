import { NextRequest, NextResponse } from "next/server";
import { fetchEarningsCalendar } from "@/lib/finnhub";
import { REVALIDATE } from "@/lib/constants";

export const revalidate = REVALIDATE.LOW_FREQ;

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());

  if (symbols.length === 0) {
    return NextResponse.json({ data: [], error: null, updatedAt: new Date().toISOString() });
  }

  try {
    const data = await fetchEarningsCalendar(symbols);
    return NextResponse.json({ data, error: null, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Earnings fetch failed:", error);
    return NextResponse.json(
      { data: null, error: "财报日历暂时不可用", updatedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
