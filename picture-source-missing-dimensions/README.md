# Picture `<source>` Missing Dimensions — Real Gap or Spec-Valid?

## The issue
Screaming Frog's "Missing Size Attributes" report flags `<source>` elements
inside `<picture>` that have no `width`/`height` — for example, an AVIF
`<source>` used for format switching, with a JPG `<img>` fallback.

This flag is technically accurate: the `<source>` element genuinely has no
dimension attributes. But it isn't automatically a layout-shift risk. Per
the HTML spec, `width`/`height` on `<source>` are used *instead of* the
sibling `<img>`'s to determine layout size — so if the `<img>` already
declares dimensions, the browser reserves that space regardless of which
`<source>` ends up loading. The flag can be true and harmless at the same
time.

## What this solves
Distinguishes, for every flagged `<source>`, whether its sibling `<img>`
already covers the layout-reservation job — separating true gaps (no
`<img>` fallback dimensions either) from spec-valid, already-covered cases.

## Why it's relevant
"Missing X" in a crawl report is a starting point, not a verdict. Treating
every flagged `<source>` as a defect can send you fixing markup that isn't
actually causing layout shift, while missing pages where the `<img>`
fallback is *also* missing dimensions — the cases that matter.

## How to use
1. Screaming Frog → `Configuration > Spider > Rendering > JavaScript` (on)
2. `Configuration > Custom > Custom JavaScript` → Add
3. Paste the contents of `snippet.js` — no outer `function () { }` wrapper;
   Screaming Frog's editor already supplies that
4. Crawl. Each page returns three columns:
   - flagged `<source>` count
   - true gaps (no `<img>` fallback dimensions)
   - detail: type, srcset, whether the `<img>` covers it, and its dimensions
5. Sum the second column across all pages. `0` means every flag on the
   site is spec-valid and already covered — worth confirming manually on
   a couple of pages that it's genuine format-switching (same image, AVIF
   vs. JPG) and not art direction (different crop per breakpoint), where
   the `<img>`'s dimensions might not match the `<source>`'s.
