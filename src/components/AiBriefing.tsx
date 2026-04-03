"use client";

import { useEffect, useRef, useState } from "react";
import { BriefingData, BriefingInput, ApiResponse } from "@/lib/types";

interface BriefingResponse extends BriefingData {
  briefingInput: BriefingInput;
}

interface AiBriefingProps {
  symbols: string[];
  symbolsReady: boolean;
  onBriefingLoaded: (briefingInput: BriefingInput) => void;
}

const COOLDOWN_SECONDS = 300; // 5 minutes

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")} 后可再次刷新`;
}

function formatBeijingTime(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = d.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

export default function AiBriefing({ symbols, symbolsReady, onBriefingLoaded }: AiBriefingProps) {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState("正在获取市场数据...");
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function fetchBriefing(force = false) {
    if (symbols.length === 0) return;

    const url = `/api/briefing?symbols=${symbols.join(",")}${force ? "&force=true" : ""}`;

    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoadingStep("正在获取市场数据...");
    }

    const timer = force
      ? null
      : setTimeout(() => setLoadingStep("正在生成简报..."), 3000);

    fetch(url)
      .then((res) => res.json())
      .then((json: ApiResponse<BriefingResponse>) => {
        if (json.data) {
          setData(json.data);
          onBriefingLoaded(json.data.briefingInput);
        }
        if (json.error) setError(json.error);
      })
      .catch(() => setError("简报生成失败"))
      .finally(() => {
        if (timer) clearTimeout(timer);
        if (force) {
          setRefreshing(false);
          startCooldown();
        } else {
          setLoading(false);
        }
      });
  }

  useEffect(() => {
    if (!symbolsReady) return;
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }
    fetchBriefing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, symbolsReady]);

  const refreshDisabled = refreshing || cooldown > 0;

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

  const { date: bjDate, time: bjTime } = formatBeijingTime(data.generatedAt);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif-cn text-xl font-bold">每日简报</h2>
        <button
          onClick={() => fetchBriefing(true)}
          disabled={refreshDisabled}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            refreshDisabled
              ? "border-divider text-ink-muted cursor-not-allowed"
              : "border-ink text-ink hover:bg-ink hover:text-white"
          }`}
        >
          {refreshing
            ? "生成中..."
            : cooldown > 0
            ? formatCooldown(cooldown)
            : "刷新简报"}
        </button>
      </div>
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
            {`本期简报基于 ${bjDate} 数据，生成于北京时间 ${bjTime}`}
          </p>
        </div>
      </div>
    </section>
  );
}
