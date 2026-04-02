"use client";

import { useState, useCallback } from "react";
import { BriefingInput } from "@/lib/types";
import { useWatchlist } from "@/hooks/useWatchlist";
import Header from "@/components/Header";
import IndexBar from "@/components/IndexBar";
import WatchlistSection from "@/components/WatchlistSection";
import WatchlistEditor from "@/components/WatchlistEditor";
import AiBriefing from "@/components/AiBriefing";
import NewsList from "@/components/NewsList";
import ChatBox from "@/components/ChatBox";
import EarningsCalendar from "@/components/EarningsCalendar";

export default function Home() {
  const { symbols, loaded, addSymbol, removeSymbol } = useWatchlist();
  const [editorOpen, setEditorOpen] = useState(false);
  const [briefingContext, setBriefingContext] = useState<BriefingInput | null>(null);

  const handleBriefingLoaded = useCallback((input: BriefingInput) => {
    setBriefingContext(input);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-muted">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 顶部 Header */}
      <Header />

      {/* 指数栏 */}
      <IndexBar />

      {/* 主体两栏 */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex gap-8">
          {/* 左栏：主信息 */}
          <div className="flex-1 min-w-0">
            {/* 自选股 */}
            <WatchlistSection
              symbols={symbols}
              onEditClick={() => setEditorOpen(true)}
            />

            {/* AI 简报 */}
            <AiBriefing
              symbols={symbols}
              onBriefingLoaded={handleBriefingLoaded}
            />

            {/* 重要新闻 */}
            <NewsList symbols={symbols} />
          </div>

          {/* 右栏：工具 */}
          <div className="w-[380px] shrink-0 space-y-6">
            {/* AI Chat */}
            <ChatBox briefingContext={briefingContext} />

            {/* 财报日历 */}
            <EarningsCalendar symbols={symbols} />
          </div>
        </div>
      </div>

      {/* 自选股编辑弹窗 */}
      {editorOpen && (
        <WatchlistEditor
          symbols={symbols}
          onAdd={addSymbol}
          onRemove={removeSymbol}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
