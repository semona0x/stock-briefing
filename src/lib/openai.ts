import OpenAI from "openai";
import { BriefingInput, ChatMessage } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
}

/** AI 简报系统 prompt */
const BRIEFING_SYSTEM_PROMPT = `你是温先生的私人美股助理，具备交易员级别的市场理解能力。
温先生人在中国，不看英文，依赖你提供准确的中文市场简报。

核心原则：准确归因，不编造。每一条事实判断必须基于你实际
搜索到的来源。找不到就说找不到，编造是唯一不可接受的行为。

价格数据以prompt中提供的Yahoo Finance数据为准，不得自行搜索
或引用价格。

禁止输出任何建议性内容，包括"建议关注""值得留意""投资者应该"。
禁止无数据支撑的宏观总结，如"市场正在从X切换到Y"。

搜索来源优先级：
第一梯队：Reuters、Bloomberg、WSJ、Financial Times、Barron's、
CNBC、SEC官网、公司IR页面
第二梯队：Seeking Alpha、Morningstar、Zacks、The Verge、
MIT Technology Review
不引用：社交媒体、匿名博客、加密货币网站、低质量聚合站

像经验丰富的交易员跟朋友聊天那样说话，简洁、有判断、不堆术语。

禁止在输出开头添加任何问候语或标题介绍句，
如"温先生，以下是..."，直接从第一部分开始输出。
禁止在输出末尾添加任何结尾语，如"以上是今日的市场简报"。`;

/** Chat 系统 prompt 模板 */
const CHAT_SYSTEM_PROMPT = `你是温先生的私人美股助理。以下是今天的市场数据摘要，请基于这些数据回答温先生的问题。
语气亲切但专业，称呼用「温先生」。回答简洁实用。不要使用 markdown 格式，输出纯文字。
如果问题超出今日市场数据范围，直接告知温先生目前没有相关数据，建议查阅最新资讯，不要猜测或编造答案。

当用户用中文提问时，你需要：
1. 理解用户的中文问题
2. 用英文搜索最新的美国市场信息（搜索词使用英文）
3. 基于英文搜索结果，用中文回答用户的问题
4. 回答中不要包含任何链接或URL

这样温先生可以用中文提问，但你会搜索英文来源获取最准确的美国市场信息，然后翻译成中文回答。

搜索时优先参考以下权威来源：
Reuters、Bloomberg、WSJ、Financial Times、Barron's、
CNBC、SEC官网、公司官方IR页面、Seeking Alpha、Morningstar

但不限于以上来源，你可以自由搜索任何可信的英文来源。
判断来源可信度的标准：有署名作者、有发布日期、有明确的机构背景。
回答必须用中文，不得包含任何链接、网址或域名。
禁止引用内容农场、无署名博客、加密货币炒作网站。

今日市场数据：
`;

function cleanBriefing(raw: string): string {
  return raw
    .replace(/\*\*/g, '')                          // 删除粗体标记
    .replace(/(?<!\S)\*(?!\*)/g, '')               // 删除斜体标记（不影响已处理的粗体）
    .replace(/^#+\s/gm, '')                        // 删除标题符号
    .replace(/^[-*]\s/gm, '')                      // 删除列表符号（- 和 * 开头）
    .replace(/`/g, '')                             // 删除代码符号
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')         // markdown 链接 → 保留文字
    .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')      // 删除括号内裸 URL
    .replace(/https?:\/\/\S+/g, '')                 // 删除裸 URL
    .replace(/\*\s+/g, '')                          // 删除孤立星号加空格
    .replace(/以上是今日的市场简报。?/g, '')           // 删除结尾语
    .replace(/温先生，以下是[^。]*。?/g, '')          // 删除开头问候语
    .replace(/今日无显著动态。?/g, '')               // 删除占位语
    .replace(/暂无相关消息。?/g, '')
    .replace(/今天没有[^。]*动态。?/g, '')
    .replace(/【[^】]+】\s*\n?\s*\n/g, '\n')       // 删除后面没有内容的空标签
    .replace(/\n{3,}/g, '\n\n')                    // 合并多余空行
    .trim();
}

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

温先生自选股今日价格（Yahoo Finance，以此为准）：
${pricesText}

请按以下结构输出简报。

第一部分 大盘与科技板块

【今日大盘】
一到两句话说清今天美股整体方向和最主要原因。注明来源（如"据Reuters报道"）。

【科技板块】
以下四个方面，有实质内容才写，没有就跳过该方面，不要写占位语：
半导体：费城半导体指数表现及原因
AI与云计算：当日重要动态
大科技：Mag 7整体表现，是否明显分化
宏观传导：利率、油价、美元当日变动对科技股的实际影响


第二部分 地缘政治与科技

以下方向仅在今天有实质性新进展时输出。实质性标准：有具体政策动作、官方声明、或可验证事件。分析师评论或旧闻重提不算。如果全部没有新进展，整个第二部分不出现。

【中美科技博弈】芯片出口管制、实体清单、贸易政策新动作
【台海与半导体供应链】台积电、台湾相关地缘动态
【中东与能源】中东局势变化对油价和风险偏好的影响
【其他地缘热点】今天实际影响科技板块的地缘事件


第三部分 自选股逐只分析

对每只股票，先执行以下搜索：
  "[symbol] [companyName] news today ${date}"
  "[symbol] SEC filing announcement ${date}"
  "[symbol] investor relations press release ${date}"
优先查找公司层面具体事件（财报、并购、资产交易、高管变动、产品发布、重大合同、SEC filing、监管动作）。

然后根据搜索结果选择对应格式：

有公司层面具体事件时：

【[symbol]】一句话说今天为什么涨跌
信息来源：（注明来源媒体，如Reuters、公司IR页面）
发生了什么：具体事件描述
为什么影响股价：从盈利预期、估值、资金流向中选最相关角度解释因果
短期还是长期：这个影响的持续性

未搜索到公司层面具体事件时：

【[symbol]】今日[changePercent]，未搜索到当日公司层面重大事件，股价变动主要跟随大盘/板块走势。

到此结束，不要展开分析，不要猜测原因。


总体要求：
全程中文
每只股票单独分析，之间用空行分隔
不复制新闻原文，用自己的话转述
价格以上方Yahoo Finance数据为准`;

  const completion = await client.chat.completions.create({
    model: "gpt-5-search-api",
    messages: [
      { role: "system", content: BRIEFING_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: 3000,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const text = cleanBriefing(raw);

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
  briefingContext: BriefingInput,
  englishQuery?: string
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const client = getClient();

  const systemMessage = CHAT_SYSTEM_PROMPT + JSON.stringify(briefingContext, null, 2);

  // If an English translation is provided, replace the last user message with it
  const apiMessages = englishQuery
    ? [
        ...messages.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: englishQuery },
      ]
    : messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return client.chat.completions.create({
    model: "gpt-5-search-api",
    messages: [
      { role: "system", content: systemMessage },
      ...apiMessages,
    ],
    max_tokens: 800,
    stream: true,
  });
}
