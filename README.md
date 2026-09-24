# Screaming Frog Custom JavaScript

A collection of custom JavaScript snippets for Screaming Frog SEO Spider —
verifying and going beyond what the built-in reports flag.

Each folder is a self-contained snippet: a `snippet.js` to paste into
`Configuration > Custom > Custom JavaScript`, and a `README.md` explaining
the issue it addresses, why it matters, and how to use it.

## Snippets

- [`picture-source-missing-dimensions/`](./picture-source-missing-dimensions) —
  Distinguishes real layout-shift risk from spec-valid `<picture>`
  `<source>` elements flagged by "Missing Size Attributes."
- [`alt-text-generator/`](./alt-text-generator) —
  Generates alt text for a page's hero image with Gemini, tied to the
  page's actual target keyword (from its `<title>`/H1) rather than a
  generic visual description.

## Usage

1. Enable `Configuration > Spider > Rendering > JavaScript`
2. `Configuration > Custom > Custom JavaScript` → Add
3. Paste a snippet's contents — no outer `function () { }` wrapper;
   Screaming Frog's editor already supplies that
4. Crawl, then read the columns as described in that snippet's README
