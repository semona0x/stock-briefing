"use client";

import { useEffect, useState } from "react";
import { StockQuote, AnalystRating, ApiResponse } from "@/lib/types";
import StockCard from "./StockCard";

interface WatchlistSectionProps {
  symbols: string[];
  onEditClick: () => void;
}

export default function WatchlistSection({ symbols, onEditClick }: WatchlistSectionProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [analysts, setAnalysts] = useState<AnalystRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    const symbolsStr = symbols.join(",");
    setLoading(true);

    Promise.all([
      fetch(`/api/quotes?symbols=${symbolsStr}`).then((r) => r.json()),
      fetch(`/api/analysts?symbols=${symbolsStr}`).then((r) => r.json()),
    ])
      .then(([quotesRes, analystsRes]: [ApiResponse<StockQuote[]>, ApiResponse<AnalystRating[]>]) => {
        if (quotesRes.data) setQuotes(quotesRes.data);
        if (analystsRes.data) setAnalysts(analystsRes.data);
        setUpdatedAt(quotesRes.updatedAt);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbols]);

  const analystMap = new Map(analysts.map((a) => [a.symbol, a]));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif-cn text-xl font-bold">自选股</h2>
        <button
          onClick={onEditClick}
          className="text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ✎ 编辑
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {symbols.map((s) => (
            <div key={s} className="bg-paper-dark rounded-lg p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-ink-muted text-sm">暂无行情数据</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {quotes.map((q) => (
            <StockCard key={q.symbol} quote={q} analyst={analystMap.get(q.symbol)} />
          ))}
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
