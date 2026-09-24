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

Crawl normally. Results appear per-URL in the Custom JavaScript tab.

## Tested on

Validated on both WordPress-based blogs and custom-built (non-WordPress) product pages, across two separate domains.

## Known limitations

- **`java.util.concurrent.TimeoutException`**: this is one of Screaming Frog's own timeouts firing, not a bug in the script — see step 4 above, and check *both* the snippet's Timeout (secs) and the global AJAX Timeout, since raising only one still leaves the other cutting things off. If it still happens after raising both, the Gemini call itself is slow or hanging (large source images fetch slowly; consider using a resized/thumbnail `og:image` variant if the site serves one).
- **Rate limits**: free-tier Gemini API keys will hit 429 errors on large crawls. If you're running this across more than a handful of URLs, either use a paid-tier key or add delay/retry logic to the `geminiRequest` function — it isn't included here to keep the script simple to read for a first pass.
- **Always keyword-aware, even when the image doesn't match**: by design, the alt text always ties back to the page's title/H1 topic — even for purely decorative or abstract images. This is a deliberate trade-off for consistent, demoable output. If you're adapting this for production alt text at scale (not a demo), consider softening this so unrelated images get a purely accurate description instead of a forced keyword connection — a falsely-specific description can hurt accessibility more than a generic one.

## Credit

Based on a prompt technique by Jarrod Blundy: https://heydingus.net/shortcuts/generate-alt-text-with-openai-vision
