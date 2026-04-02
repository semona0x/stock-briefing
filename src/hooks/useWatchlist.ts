"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_WATCHLIST, STORAGE_KEY_WATCHLIST } from "@/lib/constants";

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_WATCHLIST);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSymbols(parsed);
        }
      }
    } catch {
      // localStorage 不可用时使用默认值
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(symbols));
    } catch {
      // 忽略写入失败
    }
  }, [symbols, loaded]);

  const addSymbol = useCallback((symbol: string) => {
    const upper = symbol.toUpperCase().trim();
    if (!upper) return;
    setSymbols((prev) => (prev.includes(upper) ? prev : [...prev, upper]));
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol.toUpperCase()));
  }, []);

  const setWatchlist = useCallback((newSymbols: string[]) => {
    setSymbols(newSymbols.map((s) => s.toUpperCase().trim()).filter(Boolean));
  }, []);

  return { symbols, loaded, addSymbol, removeSymbol, setWatchlist };
}
