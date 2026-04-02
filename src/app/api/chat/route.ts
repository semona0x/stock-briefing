import { NextRequest } from "next/server";
import { streamChat } from "@/lib/openai";
import { BriefingInput, ChatMessage } from "@/lib/types";

/**
 * POST /api/chat
 * 流式 AI 对话
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

    const stream = await streamChat(messages, briefingContext);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return new Response(
      JSON.stringify({ error: "对话服务暂时不可用" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
