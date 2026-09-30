# Model notes — what was tested and why the default is gemini-3.5-flash-lite

Tests run 2026-09-30 on a B2B SaaS blog, one free-tier Gemini API key, Screaming Frog Custom JavaScript. Numbers below come from the Screaming Frog exports and the API error bodies returned in them.

## Results

| Model | Setup | Result |
|---|---|---|
| `gemini-3.5-flash-lite` ✅ | 2 threads, full blog crawl | 274 / 276 URLs returned alt text. 0 × 429, 0 × 503. 2 misses = pages with no og:image. |
| `gemini-3.6-flash` | default threads, 345 URLs | 12 successes. Free tier capped at 5 requests/minute and 20 requests/day; 313 × 429, 9 × 503. |
| `gemini-3.8-flash` | 4 threads, then 1 thread + 0.1 URL/s, 20 URLs | 2 / 19, then 0 / 20. Mostly 503 (overloaded), 2 Screaming Frog timeouts, then hit a 20/day cap. |
| `gemini-2.5-flash-lite` | 1 thread + 0.1 URL/s, 20 URLs | 0 / 20. Every call returned `404 … no longer available to new users`. |

## Learnings

- **Newest isn't best for crawling on a free tier.** The newer Flash models had the lowest free quotas and were the most often overloaded.
- **Quotas are per project, per model.** Switching model gets a fresh quota; a new API key in the same project doesn't.
- **Failed calls appear to count against the daily quota.** Across two gemini-3.8-flash runs, successes + 503s added up to exactly 20 before the daily-limit error appeared. Inferred from the exports, not confirmed by Google docs.
- **Screaming Frog's Limit URL/s minimum is 0.1** (6 pages/min). With 1 thread, the wait for each Gemini response slows the crawl further, which kept us under a 5/min limit.
- **Google's pricing page can list models new keys can't use.** gemini-2.5-flash-lite was still on the pricing page but returned 404 for a new key.
- **Free-tier request limits aren't published in Google's docs** — only per project in AI Studio → Rate limit (https://aistudio.google.com/rate-limit).
- **Output quality wasn't compared across models** — the other models didn't return enough results to compare. The default was chosen for reliability on a free tier.
