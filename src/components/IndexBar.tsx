"use client";

import { useEffect, useState } from "react";
import { IndexData, VixData, ApiResponse } from "@/lib/types";

interface IndicesData {
  indices: IndexData[];
  vix: VixData;
  treasury10y: number;
}

/**
 * 指数栏：6格横排
 * S&P500、NASDAQ、道琼斯、费城半导体、VIX恐慌指数、10年期美债
 */
export default function IndexBar() {
  const [data, setData] = useState<IndicesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indices")
      .then((res) => res.json())
      .then((json: ApiResponse<IndicesData>) => {
        if (json.data) setData(json.data);
        if (json.error) setError(json.error);
      })
      .catch(() => setError("指数数据加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-3 px-8 py-4 max-w-7xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-paper-dark rounded-lg p-3 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-8 py-4 max-w-7xl mx-auto">
        <p className="text-ink-muted text-sm">{error ?? "指数数据暂时不可用"}</p>
      </div>
    );
  }

  const cards = [
    ...data.indices.map((idx) => ({
      name: idx.name,
      value: idx.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      changePct: idx.changePct,
      isSpecial: false,
    })),
    {
      name: "VIX恐慌指数",
      value: data.vix.value.toFixed(2),
      changePct: 0,
      isSpecial: true,
      level: data.vix.level,
    },
    {
      name: "10年期美债",
      value: data.treasury10y.toFixed(2) + "%",
      changePct: 0,
      isSpecial: true,
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3 px-8 py-4 max-w-7xl mx-auto">
      {cards.map((card) => (
        <div
          key={card.name}
          className="bg-paper-dark rounded-lg p-3 border border-divider"
        >
          <p className="text-xs text-ink-muted truncate">{card.name}</p>
          <p className="text-lg font-bold font-serif-cn mt-1">{card.value}</p>
          {!card.isSpecial && (
            <p
              className={`text-sm mt-0.5 ${
                card.changePct > 0 ? "text-stock-up" :
                card.changePct < 0 ? "text-stock-down" : "text-stock-flat"
              }`}
            >
              {card.changePct > 0 ? "+" : ""}
              {card.changePct.toFixed(2)}%
            </p>
          )}
          {"level" in card && card.level && (
            <p className={`text-xs mt-0.5 ${
              card.level === "high" ? "text-stock-up font-bold" :
              card.level === "elevated" ? "text-stock-up" : "text-ink-muted"
            }`}>
              {card.level === "low" ? "低位" :
               card.level === "normal" ? "正常" :
               card.level === "elevated" ? "偏高" : "高位警告"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
