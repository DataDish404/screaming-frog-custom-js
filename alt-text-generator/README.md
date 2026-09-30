# Title-Aware Alt Text Generator for Screaming Frog + Gemini

A Screaming Frog Custom JavaScript snippet that generates alt text for each article's hero image using Google Gemini — and, unlike a generic "describe this image" prompt, ties the description to the page's actual target keyword by pulling it live from the page's `<title>` tag (falling back to the H1 if the title is empty).

Most AI alt-text scripts describe what's visually in the image and nothing else. That's accurate, but often useless for SEO: an image can be perfectly described and still say nothing about what the page is actually targeting. This script fixes that by requiring the page's own keyword phrase to appear verbatim in the output, not paraphrased.

## What it does

- Runs on article/HTML pages (not image URLs) during a normal Screaming Frog crawl
- Reads the page's `<title>` tag as the keyword source (falls back to the first `<h1>` if the title is empty)
- Finds the hero image via the page's `og:image` meta tag
- Sends the image to Gemini with a prompt that:
  - Describes the image in ~30 words, object-action-context style
  - Transcribes any visible on-image text
  - Requires the exact keyword phrase (or an exact substring of it, for long titles) verbatim in the output — no synonyms, no paraphrasing
- Returns the result to Screaming Frog's Custom JavaScript tab

## How to use

1. Open Screaming Frog → **Configuration > Custom > Custom JavaScript** → **+ Add**, and paste in `screaming-frog-gemini-alttext-keyword-aware.js`.
2. Replace `your_api_key_here` with your own Gemini API key.
3. Set the snippet's **Content Types** filter to `text/html` (or leave it blank) — this must run on HTML pages, not image resources, or it won't have DOM access to read the title/H1.
4. Raise **two separate timeouts**, both default to ~5s and both are too short for a network fetch + Gemini vision call:
   - **Configuration > Custom > Custom JavaScript** → edit the snippet → **Timeout (secs)** → 30+ (how long this specific snippet may run)
   - **Configuration > Spider > Rendering > JavaScript > AJAX Timeout** → 30+ (a *global* setting for how long Chromium waits for all JS on the page, including this snippet, before considering the page "loaded" — easy to miss, and raising only the snippet timeout above is not enough on its own)
5. **Slow the crawl down.** Every page the snippet runs on is one Gemini API call, and Screaming Frog crawls several pages in parallel by default, so even a small crawl sends calls in bursts and a free-tier key hits its per-minute limit.
   - In Screaming Frog go to **Configuration > Speed** and set **Max Threads** to **2**.
   - Tested on a free-tier key with the default model: 274 of 276 blog URLs returned alt text, with zero rate-limit errors. The 2 misses were pages with no `og:image`.
   - Only crawl the pages you need alt text for (e.g. **Configuration > Include** with a regex matching your article URLs, or **List mode** with a pasted URL list). Category, tag and author pages often have an `og:image` too and would use API calls.

Crawl normally. Results appear per-URL in the Custom JavaScript tab.

## Model

The script uses **`gemini-3.5-flash-lite`**. It's the one that worked best of the Gemini models tested on a free-tier API key: fast enough for Screaming Frog's timeouts and enough free quota for a real crawl. (Test details in [MODEL-NOTES.md](MODEL-NOTES.md).)

**To change model**, edit the model ID in the `apiUrl` line near the top of the script:

```js
const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent`;
```

Replace `gemini-3.5-flash-lite` with any model ID from Google's [models page](https://ai.google.dev/gemini-api/docs/models). If you get a `404 … not found`, try `/v1beta/` instead of `/v1/`. If the 404 says the model is "no longer available to new users", pick a different model.

⚠️ **Be careful with the newer / bigger Flash models on a free-tier key.** In testing they had much lower free quotas (as low as 20 requests/day), were often overloaded (`503`), and sometimes answered too slowly for Screaming Frog's timeout. Newest isn't best here. Check your project's actual limits per model in [AI Studio → Rate limit](https://aistudio.google.com/rate-limit) before switching.

## Tested on

Validated on both WordPress-based blogs and custom-built (non-WordPress) product pages, across two separate domains.

## Known limitations

- **`java.util.concurrent.TimeoutException`**: this is one of Screaming Frog's own timeouts firing, not a bug in the script — see step 4 above, and check *both* the snippet's Timeout (secs) and the global AJAX Timeout, since raising only one still leaves the other cutting things off. If it still happens after raising both, the Gemini call itself is slow or hanging (large source images fetch slowly; consider using a resized/thumbnail `og:image` variant if the site serves one).
- **Rate limits (429 / 503)**: free-tier limits apply **per project and per model** (a second API key in the same project doesn't add quota), and the daily quota resets at **midnight Pacific time**.
  - `429` mentioning `PerMinute` → you're crawling too fast; lower Max Threads (step 5). Clears after a minute.
  - `429` mentioning `PerDay` → daily quota used up; wait for the reset, switch model, or enable billing.
  - `503 UNAVAILABLE` → Google-side overload, not your quota. Retry later.
  - For larger sites, link a billing account in AI Studio to move to the paid tier.
  - **Free-tier data may be used by Google to improve its products; paid-tier data isn't** (per Google's pricing page). Worth knowing before running client or unpublished images through a free key.
  - Docs: https://ai.google.dev/gemini-api/docs/rate-limits · https://ai.google.dev/gemini-api/docs/pricing
- **Always keyword-aware, even when the image doesn't match**: by design, the alt text always ties back to the page's title/H1 topic — even for purely decorative or abstract images. This is a deliberate trade-off for consistent, demoable output. If you're adapting this for production alt text at scale (not a demo), consider softening this so unrelated images get a purely accurate description instead of a forced keyword connection — a falsely-specific description can hurt accessibility more than a generic one.
- **The page `<title>` is used verbatim as the keyword**, including any brand suffix (e.g. " - Site Name"). The script assumes titles are already optimised; if yours carry a long suffix, it will appear in the alt text.

## Credit

Based on a prompt technique by Jarrod Blundy: https://heydingus.net/shortcuts/generate-alt-text-with-openai-vision
