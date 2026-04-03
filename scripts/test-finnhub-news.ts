import * as fs from "fs";
import * as path from "path";

// Load .env.local from project root (run script from project root)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const SYMBOLS = ["INTC", "NVDA", "GOOGL"];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

async function fetchNews(symbol: string, from: string, to: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

  const params = new URLSearchParams({ symbol, from, to, token: apiKey });
  const res = await fetch(`${FINNHUB_BASE}/company-news?${params}`);

  if (!res.ok) throw new Error(`Finnhub ${symbol} failed: ${res.status} ${await res.text()}`);

  return res.json() as Promise<Array<{ headline: string; source: string; datetime: number; url: string }>>;
}

async function main() {
  const date = today();
  console.log(`Date range: ${date} → ${date}\n`);

  for (const symbol of SYMBOLS) {
    console.log(`=== ${symbol} ===`);
    const articles = await fetchNews(symbol, date, date);

    if (articles.length === 0) {
      console.log("  (no news today)\n");
      continue;
    }

    for (const a of articles) {
      const ts = new Date(a.datetime * 1000).toISOString();
      console.log(`  [${ts}] ${a.source}`);
      console.log(`  ${a.headline}`);
      console.log();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
