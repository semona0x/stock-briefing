import { StockQuote, AnalystRating } from "@/lib/types";

interface StockCardProps {
  quote: StockQuote;
  analyst?: AnalystRating;
}

export default function StockCard({ quote, analyst }: StockCardProps) {
  const isUp = quote.changePct > 0;
  const isDown = quote.changePct < 0;

  return (
    <div className="border border-divider rounded-lg p-4 bg-white">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif-cn font-bold text-lg">{quote.symbol}</h3>
        <span
          className={`text-sm font-medium px-2 py-0.5 rounded ${
            isUp ? "bg-red-50 text-stock-up" :
            isDown ? "bg-green-50 text-stock-down" :
            "bg-gray-50 text-stock-flat"
          }`}
        >
          {isUp ? "+" : ""}{quote.changePct.toFixed(2)}%
        </span>
      </div>

      <p className="text-2xl font-bold mt-2">
        ${quote.price.toFixed(2)}
      </p>

      {analyst && (
        <div className="mt-3 pt-3 border-t border-divider text-sm text-ink-light">
          <div className="flex justify-between">
            <span>分析师共识</span>
            <span className="font-medium">{analyst.consensus}</span>
          </div>
          {analyst.targetPrice > 0 && (
            <div className="flex justify-between mt-1">
              <span>目标价</span>
              <span className="font-medium">${analyst.targetPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between mt-1">
            <span>分析师人数</span>
            <span className="font-medium">{analyst.analystCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
