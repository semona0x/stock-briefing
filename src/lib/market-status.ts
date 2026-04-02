import { SessionState } from "./types";

/**
 * 判断当前美股市场交易状态
 * 基于美东时间（ET），考虑夏令时
 */
export function getMarketStatus(now: Date = new Date()): SessionState {
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etString);

  const day = et.getDay();
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  if (day === 0 || day === 6) {
    return "weekend";
  }

  if (timeInMinutes >= 240 && timeInMinutes < 570) {
    return "pre_market";
  }

  if (timeInMinutes >= 570 && timeInMinutes < 960) {
    return "open";
  }

  if (timeInMinutes >= 960 && timeInMinutes < 1200) {
    return "after_hours";
  }

  return "closed";
}

/**
 * 获取市场状态的中文标签和颜色 class
 */
export function getMarketStatusDisplay(state: SessionState): {
  label: string;
  className: string;
} {
  switch (state) {
    case "open":
      return { label: "开市中", className: "bg-green-100 text-green-800" };
    case "pre_market":
      return { label: "盘前交易", className: "bg-yellow-100 text-yellow-800" };
    case "after_hours":
      return { label: "盘后交易", className: "bg-blue-100 text-blue-800" };
    case "closed":
      return { label: "已休市", className: "bg-gray-100 text-gray-600" };
    case "weekend":
      return { label: "周末休市", className: "bg-gray-100 text-gray-600" };
  }
}
