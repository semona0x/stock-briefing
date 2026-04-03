import { StockQuote, AnalystRating } from "@/lib/types";

interface StockCardProps {
  quote: StockQuote;
  analyst?: AnalystRating;
}

export default function StockCard({ quote, analyst }: StockCardProps) {
  const isUp = quote.changePct > 0;
  const isDown = quote.changePct < 0;

  return (
    <div className="border border-divider rounded-lg p-3 bg-white min-w-0">
      {/* 行1：ticker 左，涨跌幅右 */}
      <div className="flex items-center justify-between gap-1">
        <h3 className="font-serif-cn font-bold text-base leading-none truncate">{quote.symbol}</h3>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${
            isUp ? "bg-red-50 text-stock-up" :
            isDown ? "bg-green-50 text-stock-down" :
            "bg-gray-50 text-stock-flat"
          }`}
        >
          {isUp ? "+" : ""}{quote.changePct.toFixed(2)}%
        </span>
      </div>

      {/* 行2：股价 */}
      <p className="text-xl font-bold mt-1.5 leading-none">
        ${quote.price.toFixed(2)}
      </p>

      {/* 行3：分析师信息，紧凑小字 */}
      {analyst && (
        <div className="mt-2 pt-2 border-t border-divider text-xs text-ink-muted space-y-0.5">
          <div className="flex justify-between gap-1">
            <span className="truncate">共识</span>
            <span className="font-medium text-ink-light shrink-0">{analyst.consensus}</span>
          </div>
          {analyst.targetPrice > 0 && (
            <div className="flex justify-between gap-1">
              <span className="truncate">目标价</span>
              <span className="font-medium text-ink-light shrink-0">${analyst.targetPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
