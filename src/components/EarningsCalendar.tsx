"use client";

import { useEffect, useState } from "react";
import { EarningsEvent, ApiResponse } from "@/lib/types";

interface EarningsCalendarProps {
  symbols: string[];
}

export default function EarningsCalendar({ symbols }: EarningsCalendarProps) {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/earnings?symbols=${symbols.join(",")}`)
      .then((r) => r.json())
      .then((json: ApiResponse<EarningsEvent[]>) => {
        if (json.data) setEarnings(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbols]);

  const hourLabel = (hour: string) => {
    switch (hour) {
      case "bmo": return "盘前";
      case "amc": return "盘后";
      case "dmh": return "盘中";
      default: return "";
    }
  };

  return (
    <div className="border border-divider rounded-lg bg-white">
      <div className="px-4 py-3 border-b border-divider">
        <h3 className="font-serif-cn font-bold">财报日历</h3>
        <p className="text-xs text-ink-muted">未来 7 天</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-paper-dark rounded h-10 animate-pulse" />
            ))}
          </div>
        ) : earnings.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-4">
            未来 7 天暂无自选股财报
          </p>
        ) : (
          <div className="space-y-2">
            {earnings.map((event) => (
              <div
                key={`${event.symbol}-${event.date}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-paper-dark"
              >
                <div>
                  <span className="font-medium">{event.symbol}</span>
                  {hourLabel(event.hour) && (
                    <span className="text-xs text-ink-muted ml-2">
                      {hourLabel(event.hour)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm text-ink-light">{event.date}</span>
                  <span
                    className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                      event.daysUntil <= 2
                        ? "bg-red-50 text-warning font-medium"
                        : "text-ink-muted"
                    }`}
                  >
                    {event.daysUntil === 0 ? "今天" :
                     event.daysUntil === 1 ? "明天" :
                     `${event.daysUntil}天后`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
