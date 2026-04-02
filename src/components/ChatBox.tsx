"use client";

import { useState, useRef, useEffect } from "react";
import { BriefingInput } from "@/lib/types";
import { QUICK_QUESTIONS } from "@/lib/constants";
import { useChat } from "@/hooks/useChat";

interface ChatBoxProps {
  briefingContext: BriefingInput | null;
}

export default function ChatBox({ briefingContext }: ChatBoxProps) {
  const { messages, isStreaming, sendMessage } = useChat(briefingContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  };

  const handleQuickQuestion = (q: string) => {
    if (isStreaming) return;
    sendMessage(q);
  };

  return (
    <div className="border border-divider rounded-lg bg-white flex flex-col h-[500px]">
      <div className="px-4 py-3 border-b border-divider">
        <h3 className="font-serif-cn font-bold">智能问答</h3>
      </div>

      {messages.length === 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-divider">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              disabled={!briefingContext}
              className="text-xs px-3 py-1.5 rounded-full border border-divider text-ink-light hover:bg-paper-dark transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 chat-messages space-y-3">
        {!briefingContext && messages.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-8">
            等待简报数据加载后即可开始对话...
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-ink text-white"
                  : "bg-paper-dark text-ink"
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
              {msg.role === "assistant" && isStreaming && idx === messages.length - 1 && (
                <span className="inline-block w-1.5 h-4 bg-ink-muted animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-divider">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="问温先生的助理..."
            disabled={!briefingContext || isStreaming}
            className="flex-1 border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !briefingContext || isStreaming}
            className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-ink-light transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
