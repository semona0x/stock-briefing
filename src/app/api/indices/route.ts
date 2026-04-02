import { NextResponse } from "next/server";
import { fetchIndices } from "@/lib/yahoo-finance";
import { fetchIndicesFMP } from "@/lib/fmp";
export const revalidate = 300; // HIGH_FREQ: 5 minutes

/**
 * GET /api/indices
 * 获取 6 大指数 + VIX + 10年美债
 * Yahoo Finance 优先，超时 fallback 到 FMP
 */
export async function GET() {
  try {
    const data = await Promise.race([
      fetchIndices(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Yahoo timeout")), 5000)
      ),
    ]);

    return NextResponse.json({
      data,
      error: null,
      updatedAt: new Date().toISOString(),
    });
  } catch (yahooError) {
    console.warn("Yahoo Finance failed, falling back to FMP:", yahooError);

    try {
      const data = await fetchIndicesFMP();
      return NextResponse.json({
        data,
        error: null,
        updatedAt: new Date().toISOString(),
      });
    } catch (fmpError) {
      console.error("FMP fallback also failed:", fmpError);
      return NextResponse.json(
        {
          data: null,
          error: "指数数据暂时不可用",
          updatedAt: new Date().toISOString(),
        },
        { status: 502 }
      );
    }
  }
}
