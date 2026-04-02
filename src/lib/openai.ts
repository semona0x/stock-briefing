import OpenAI from "openai";
import { BriefingInput, ChatMessage } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

/** AI 简报系统 prompt */
const BRIEFING_SYSTEM_PROMPT = `你是温先生的私人美股助理。请根据以下今日市场数据，用中文生成一份简报。
第一段是总览导语（2-3句），直接说今天市场发生了什么、温先生的自选股整体怎么样。
第二段展开分析：大盘原因、自选股具体情况、值得关注的新闻和风险。
语气亲切但专业，称呼用「温先生」。不要使用 markdown 格式，输出纯文字。`;

/** Chat 系统 prompt 模板 */
const CHAT_SYSTEM_PROMPT = `你是温先生的私人美股助理。以下是今天的市场数据摘要，请基于这些数据回答温先生的问题。
语气亲切但专业，称呼用「温先生」。回答简洁实用。不要使用 markdown 格式，输出纯文字。

今日市场数据：
`;

/**
 * 生成 AI 每日简报
 * 返回 { headline, analysis }
 */
export async function generateBriefing(
  input: BriefingInput
): Promise<{ headline: string; analysis: string }> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: BRIEFING_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(input, null, 2) },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const text = completion.choices[0]?.message?.content ?? "";

  // 将输出分为导语（第一段）和分析（其余段落）
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");
  const headline = paragraphs[0] ?? "";
  const analysis = paragraphs.slice(1).join("\n\n");

  return { headline, analysis: analysis || headline };
}

/**
 * 流式 Chat 响应
 * 返回 AsyncIterable
 */
export async function streamChat(
  messages: ChatMessage[],
  briefingContext: BriefingInput
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const client = getClient();

  const systemMessage = CHAT_SYSTEM_PROMPT + JSON.stringify(briefingContext, null, 2);

  return client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMessage },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 800,
    stream: true,
  });
}
