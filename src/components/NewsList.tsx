"use client";

import { useEffect, useState } from "react";
import { NewsItem, ApiResponse } from "@/lib/types";

interface NewsListProps {
  symbols: string[];
}

const sentimentStyles = {
  positive: { label: "利好", className: "bg-red-50 text-stock-up" },
  negative: { label: "利空", className: "bg-green-50 text-stock-down" },
  neutral: { label: "中性", className: "bg-gray-50 text-ink-muted" },
};

export default function NewsList({ symbols }: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/news?symbols=${symbols.join(",")}`)
      .then((r) => r.json())
      .then((json: ApiResponse<NewsItem[]>) => {
        if (json.data) {
          const sorted = [...json.data].sort(
            (a, b) => b.relatedSymbols.length - a.relatedSymbols.length
          );
          setNews(sorted);
        }
        setUpdatedAt(json.updatedAt);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbols]);

  return (
    <section className="mt-8">
      <h2 className="font-serif-cn text-xl font-bold mb-4">重要新闻</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-paper-dark rounded-lg p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-ink-muted text-sm">暂无相关新闻</p>
      ) : (
        <div className="space-y-3">
          {news.slice(0, 10).map((item, idx) => {
            const sentiment = sentimentStyles[item.sentiment];
            return (
              <div
                key={idx}
                className="border border-divider rounded-lg p-4 bg-white hover:bg-paper-dark transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-wrap gap-1.5 shrink-0 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sentiment.className}`}>
                      {sentiment.label}
                    </span>
                    {item.relatedSymbols.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-1.5 py-0.5 rounded bg-paper-dark text-ink-light"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-ink hover:underline line-clamp-2"
                    >
                      {item.title}
                    </a>
                    <p className="text-xs text-ink-muted mt-1">
                      {item.source}
                      {item.publishedAt && (
                        <>
                          {" · "}
                          {new Date(item.publishedAt).toLocaleString("zh-CN", {
                            timeZone: "Asia/Shanghai",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {updatedAt && (
        <p className="text-xs text-ink-muted mt-2">
          最近更新于 {new Date(updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </p>
      )}
    </section>
  );
}
