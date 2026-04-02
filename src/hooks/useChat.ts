"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatMessage, BriefingInput } from "@/lib/types";
import { STORAGE_KEY_CHAT } from "@/lib/constants";

export function useChat(briefingContext: BriefingInput | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_CHAT);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch {
      // 忽略
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch {
      // 忽略
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!briefingContext || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            briefingContext,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          assistantContent += decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，对话服务暂时不可用，请稍后再试。" },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, briefingContext, isStreaming]
  );

  return { messages, isStreaming, sendMessage };
}
