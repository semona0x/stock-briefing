"use client";

import { useState } from "react";

interface WatchlistEditorProps {
  symbols: string[];
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onClose: () => void;
}

export default function WatchlistEditor({
  symbols,
  onAdd,
  onRemove,
  onClose,
}: WatchlistEditorProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const symbol = input.toUpperCase().trim();
    if (symbol && !symbols.includes(symbol)) {
      onAdd(symbol);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif-cn text-lg font-bold">编辑自选股</h3>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入股票代码，如 AAPL"
            className="flex-1 border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-ink-light transition-colors"
          >
            添加
          </button>
        </div>

        <div className="space-y-2">
          {symbols.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center justify-between px-3 py-2 bg-paper-dark rounded-lg"
            >
              <span className="font-medium">{symbol}</span>
              <button
                onClick={() => onRemove(symbol)}
                className="text-sm text-ink-muted hover:text-stock-up transition-colors"
              >
                删除
              </button>
            </div>
          ))}
        </div>

        {symbols.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-4">
            自选股列表为空，请添加股票代码
          </p>
        )}
      </div>
    </div>
  );
}
