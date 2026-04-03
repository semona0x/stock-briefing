import { NextRequest } from "next/server";
import { getCachedBriefing } from "@/app/api/briefing/route";
import { DEFAULT_WATCHLIST } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/briefing
 * Vercel Cron: weekdays at 16:30 ET (收盘后预热缓存)
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const symbolsKey = `${today}:${[...DEFAULT_WATCHLIST].sort().join(",")}`;

  try {
    console.log(`[Cron] Pre-warming briefing cache for ${symbolsKey}`);
    const data = await getCachedBriefing(symbolsKey);
    console.log(`[Cron] Done — generated at ${data.generatedAt}`);
    return Response.json({ ok: true, generatedAt: data.generatedAt });
  } catch (error) {
    console.error("[Cron] Briefing generation failed:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
