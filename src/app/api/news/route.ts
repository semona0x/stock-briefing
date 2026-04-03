import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/marketaux";
import OpenAI from "openai";
export const revalidate = 1800; // MID_FREQ: 30 minutes

/** 批量将英文标题翻译为中文，失败时返回原文 */
async function translateTitles(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return titles;

  try {
    const client = new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content:
            "Translate the following news headlines to Chinese. Return ONLY a JSON array of translated strings, in the same order as the input. No explanation, no markdown, just the raw JSON array.\n\n" +
            JSON.stringify(titles),
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed: unknown = JSON.parse(raw.trim());
    if (
      Array.isArray(parsed) &&
      parsed.length === titles.length &&
      parsed.every((t) => typeof t === "string")
    ) {
      return parsed as string[];
    }
    return titles;
  } catch {
    // 翻译失败，静默回退到原文
    return titles;
  }
}

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").filter(Boolean).map((s) => s.trim().toUpperCase());

  if (symbols.length === 0) {
    return NextResponse.json({ data: [], error: null, updatedAt: new Date().toISOString() });
  }

  try {
    const articles = await fetchNews(symbols);

    // 批量翻译标题
    const originalTitles = articles.map((a) => a.title);
    const chineseTitles = await translateTitles(originalTitles);
    const data = articles.map((article, i) => ({
      ...article,
      title: chineseTitles[i] ?? article.title,
    }));

    return NextResponse.json({ data, error: null, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("News fetch failed:", error);
    return NextResponse.json(
      { data: null, error: "新闻数据暂时不可用", updatedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
