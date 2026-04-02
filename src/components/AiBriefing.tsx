"use client";

import { useEffect, useState } from "react";
import { BriefingData, BriefingInput, ApiResponse } from "@/lib/types";

interface BriefingResponse extends BriefingData {
  briefingInput: BriefingInput;
}

interface AiBriefingProps {
  symbols: string[];
  onBriefingLoaded: (briefingInput: BriefingInput) => void;
}

export default function AiBriefing({ symbols, onBriefingLoaded }: AiBriefingProps) {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState("正在获取市场数据...");

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingStep("正在获取市场数据...");

    const timer = setTimeout(() => {
      setLoadingStep("正在生成简报...");
    }, 3000);

    fetch(`/api/briefing?symbols=${symbols.join(",")}`)
      .then((res) => res.json())
      .then((json: ApiResponse<BriefingResponse>) => {
        clearTimeout(timer);
        if (json.data) {
          setData(json.data);
          onBriefingLoaded(json.data.briefingInput);
        }
        if (json.error) setError(json.error);
      })
      .catch(() => {
        clearTimeout(timer);
        setError("简报生成失败");
      })
      .finally(() => setLoading(false));
  }, [symbols, onBriefingLoaded]);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="font-serif-cn text-xl font-bold mb-4">每日简报</h2>
        <div className="bg-white border border-divider rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-ink-muted">{loadingStep}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mt-8">
        <h2 className="font-serif-cn text-xl font-bold mb-4">每日简报</h2>
        <div className="bg-white border border-divider rounded-lg p-6">
          <p className="text-ink-muted">{error ?? "简报暂时不可用"}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif-cn text-xl font-bold mb-4">每日简报</h2>
      <div className="bg-white border border-divider rounded-lg p-6">
        <p className="text-lg font-bold leading-relaxed text-ink">
          {data.headline}
        </p>

        {data.analysis && (
          <p className="mt-4 text-ink-light leading-relaxed whitespace-pre-line">
            {data.analysis}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-divider">
          <p className="text-xs text-ink-muted">
            数据更新时间：{new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
            {" · "}
            来源：Yahoo Finance / Marketaux / FMP / Finnhub
          </p>
        </div>
      </div>
    </section>
  );
}
