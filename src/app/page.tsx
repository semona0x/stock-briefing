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

  return (
    <div className="min-h-screen">
      {/* 顶部 Header */}
      <Header />

      {/* 指数栏 */}
      <IndexBar />

      {/* 主体：移动端单列，桌面端两栏 */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* 左栏：主信息 */}
          <div className="flex-1 min-w-0">
            {/* 自选股 */}
            <WatchlistSection
              symbols={symbols}
              onEditClick={() => setEditorOpen(true)}
            />

            {/* AI 简报：等 symbols 从 localStorage 确认后再发起请求 */}
            <AiBriefing
              symbols={symbols}
              symbolsReady={loaded}
              onBriefingLoaded={handleBriefingLoaded}
            />

            {/* 重要新闻 */}
            <NewsList symbols={symbols} />
          </div>

          {/* 右栏：工具（移动端跟在新闻后面，桌面端固定宽度） */}
          <div className="md:w-[380px] md:shrink-0 space-y-6">
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
