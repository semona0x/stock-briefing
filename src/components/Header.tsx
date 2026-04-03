"use client";

import { useEffect, useState } from "react";
import { getMarketStatus, getMarketStatusDisplay } from "@/lib/market-status";

/**
 * 顶部 Header
 * - 个性化问候（北京时间）
 * - 当前日期（中文格式）
 * - 市场状态 badge
 */
export default function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <header className="px-4 md:px-8 py-6 divider-double" />;
  }

  // 北京时间问候
  const bjHour = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(bjHour, 10);
  const greeting =
    hour >= 5 && hour < 12 ? "早安" :
    hour >= 12 && hour < 18 ? "午安" : "晚安";

  // 中文日期
  const dateStr = new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // 市场状态
  const status = getMarketStatus();
  const statusDisplay = getMarketStatusDisplay(status);

  return (
    <header className="px-4 md:px-8 py-6 divider-double">
      <div className="max-w-7xl mx-auto flex items-baseline justify-between">
        <div>
          <h1 className="font-serif-cn text-2xl md:text-3xl font-bold text-ink">
            温先生，{greeting}
          </h1>
          <p className="text-ink-muted mt-1">{dateStr}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
          {statusDisplay.label}
        </span>
      </div>
    </header>
  );
}
