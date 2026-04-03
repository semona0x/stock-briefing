"use client";

import React, { useEffect, useRef, useState } from "react";
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

/** 将简报文本按行解析，返回带样式的 JSX 元素数组 */
function renderBriefingLines(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 空行 → 小间距
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-3" />);
      continue;
    }

    // 【标签】格式 → 加粗节标题，上方留边距
    if (/^【[^】]+】/.test(line)) {
      nodes.push(
        <p key={i} className="font-bold text-ink mt-4 first:mt-0">
          {line}
        </p>
      );
      continue;
    }

    // "关键词：" 结尾的行（如 "半导体："、"信息来源："）→ 缩进小标题
    if (/^[\u4e00-\u9fa5A-Za-z&／/]+[：:]\s*$/.test(line.trim())) {
      nodes.push(
        <p key={i} className="font-semibold text-ink mt-2 pl-2 border-l-2 border-divider">
          {line}
        </p>
      );
      continue;
    }

    // "关键词：内容" 的行（如 "发生了什么：xxx"、"信息来源：Reuters"）→ 关键词加粗
    const labelMatch = line.match(/^([\u4e00-\u9fa5A-Za-z&／/]+[：:])(.+)$/);
    if (labelMatch) {
      nodes.push(
        <p key={i} className="mt-1 text-ink-light">
          <span className="font-semibold text-ink">{labelMatch[1]}</span>
          {labelMatch[2]}
        </p>
      );
      continue;
    }

    // 普通段落
    nodes.push(
      <p key={i} className="mt-1 text-ink-light leading-relaxed">
        {line}
      </p>
    );
  }

  return nodes;
}

function formatBeijingTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "2026-04-02" → "4月2日" */
function tradingDayLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}月${parseInt(d)}日`;
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

  const bjTime = formatBeijingTime(data.generatedAt);
  const dayLabel = tradingDayLabel(data.briefingInput.date);

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
          <div className="mt-4">
            {renderBriefingLines(data.analysis)}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-divider">
          <p className="text-xs text-ink-muted">
            {`本期简报基于 ${dayLabel} 收盘数据，生成于北京时间 ${bjTime}`}
          </p>
        </div>
      </div>
    </section>
  );
}
