import OpenAI from "openai";
import { BriefingInput, ChatMessage } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
}

/** AI 简报系统 prompt */
const BRIEFING_SYSTEM_PROMPT = `你是温先生的私人美股投资助理，具备交易员级别的市场理解能力。
温先生不看英文，你需要基于最新搜索结果，用中文解释今天最重要的市场变化。

优先使用以下权威来源：
Reuters、Bloomberg、Barron's、WSJ、Financial Times、CNBC、
SEC官网(sec.gov)、公司官方投资者关系页面、
Seeking Alpha、Morningstar、Zacks、
The Verge、Wired、MIT Technology Review（半导体/AI相关）

避免引用：社交媒体、加密货币网站、匿名博客、低质量媒体。

禁止：
- 做市场风格或趋势的总结性判断（如"市场正在从X切换到Y"）
- 在没有充分数据支撑的情况下做宏观结论
- 输出任何带有建议性质的内容，包括隐性建议
- 使用emoji或符号，保持纯文字输出
- 自行搜索或引用股票价格，价格数据以prompt中提供的为准`;

/** Chat 系统 prompt 模板 */
const CHAT_SYSTEM_PROMPT = `你是温先生的私人美股助理。以下是今天的市场数据摘要，请基于这些数据回答温先生的问题。
语气亲切但专业，称呼用「温先生」。回答简洁实用。不要使用 markdown 格式，输出纯文字。
如果问题超出今日市场数据范围，直接告知温先生目前没有相关数据，建议查阅最新资讯，不要猜测或编造答案。

今日市场数据：
`;

/**
 * 生成 AI 每日简报
 * @param input 结构化市场数据（用于上下文）
 * @param pricesText 自选股今日价格字符串，如 "- INTC：$50.38，今日涨跌：+4.89%"
 * @param date 今日日期，如 "2026-04-02"
 * 返回 { headline, analysis }
 */
export async function generateBriefing(
  input: BriefingInput,
  pricesText: string,
  date: string
): Promise<{ headline: string; analysis: string }> {
  const client = getClient();

  const userMessage = `今天日期：${date}

温先生的自选股今日价格（来源：Yahoo Finance，请以此为准，不要自行搜索价格）：
${pricesText}

请按以下顺序输出：

第一部分：大盘与科技板块全景

【今日大盘】一句话说今天整体市场方向和主因

【科技板块动态】分四个方面简述：
- 半导体：费城半导体指数表现及原因
- AI与云计算：相关板块有无重要动态
- 大科技公司：Mag 7整体表现，有无明显分化
- 宏观影响：利率/油价/美元今天对科技股的影响

第二部分：地缘政治与科技的关系

重点关注以下方向，有动态则说，没有则略过：

【中美科技博弈】芯片出口管制、实体清单、贸易政策
有无新进展，对半导体供应链的影响

【台海与半导体供应链】台积电、台湾相关地缘动态，
对全球芯片供应的潜在影响

【中东与能源】中东局势、油价变动对美股整体
风险偏好的影响

【其他地缘热点】任何今天影响到科技板块或
市场情绪的重要地缘政治事件

第三部分：自选股逐只分析

对每只自选股单独分析：

Step 1：识别最重要的「单一核心驱动」
（如果有多个只选最重要的）

Step 2：解释这个驱动如何影响：
- 盈利预期
- 估值
- 资金流向

Step 3：判断驱动类型：
基本面驱动 / 事件驱动 / 宏观驱动 / 情绪驱动

Step 4：用普通人能理解的语言解释

输出格式（每只股票单独一段）：
【一句话总结】今天为什么涨/跌
【发生了什么】最重要事件
【为什么影响股价】用因果逻辑解释
【市场在想什么】资金行为
【短期还是长期】这个影响的持续性

总体要求：
- 全程中文，像人说话，不堆砌术语
- 不直接复制新闻原文
- 每只股票单独分析，不要混在一起
- 每个部分简洁，重点突出
- 如果某个方向今天没有重要动态，直接跳过不要凑字数
- 价格数据以上方提供的Yahoo Finance数据为准，不要自行搜索`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-search-preview",
    messages: [
      { role: "system", content: BRIEFING_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: 3000,
  });

  const text = completion.choices[0]?.message?.content ?? "";

  // 第一段作为导语，其余作为正文
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
    model: "gpt-4o-search-preview",
    messages: [
      { role: "system", content: systemMessage },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 800,
    stream: true,
  });
}
