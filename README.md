This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Set the following in `.env.local` (dev) and Vercel project settings (prod):

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (gpt-4o-search-preview for briefing, gpt-4o for news translation) |
| `FMP_API_KEY` | Financial Modeling Prep API key (analyst ratings, fallback quotes/indices) |
| `MARKETAUX_API_KEY` | Marketaux API key (news feed) |
| `FINNHUB_API_KEY` | Finnhub API key (earnings calendar) |
| `CRON_SECRET` | Secret for Vercel Cron job auth — set to a random string, e.g. `ws9Kp2mXqL8nRvT4hJ6dYbF3cA5eZu7N` |

The `CRON_SECRET` must match the `Authorization: Bearer <secret>` header that Vercel sends to `/api/cron/briefing` on the daily schedule (weekdays 21:00 UTC / 5:00 PM ET).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
