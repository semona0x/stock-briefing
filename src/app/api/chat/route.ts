import { NextRequest } from "next/server";
import OpenAI from "openai";
import { streamChat } from "@/lib/openai";
import { BriefingInput, ChatMessage } from "@/lib/types";

function cleanChatResponse(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();
}

/**
 * POST /api/chat
 * Step 1: translate last user message to English via gpt-4o-mini
 * Step 2: search with gpt-5-search-api using English query, respond in Chinese
 * Body: { messages: ChatMessage[], briefingContext: BriefingInput }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const briefingContext: BriefingInput = body.briefingContext;

    if (!briefingContext) {
      return new Response(
        JSON.stringify({ error: "缺少市场数据上下文" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    const openai = new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });

    // Step 1: translate last user message to English search query
    const userMessage = messages[messages.length - 1]?.content ?? "";
    let englishQuery = userMessage;

    if (userMessage) {
      const translationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Translate this Chinese finance question into an English search query optimized for finding results from Reuters, Bloomberg, WSJ, Barron's, CNBC, SEC. Return only the English search query, nothing else.\nQuestion: ${userMessage}`,
        }],
        max_tokens: 100,
      });
      englishQuery = translationResponse.choices[0].message.content?.trim() ?? userMessage;
    }

    // Step 2: search with gpt-5-search-api using the English query
    const stream = await streamChat(messages, briefingContext, englishQuery);

    // Buffer full response so link-cleaning regexes work across chunk boundaries
    let fullText = "";
    for await (const chunk of stream) {
      fullText += chunk.choices[0]?.delta?.content ?? "";
    }

    const cleaned = cleanChatResponse(fullText);

    return new Response(cleaned, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return new Response(
      JSON.stringify({ error: "对话服务暂时不可用" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
