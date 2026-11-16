[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/Habibalwhd/markdown-render-speed/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/Habibalwhd/markdown-render-speed/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

# markdown-render-speed-02 entry

A dependency-free, single-file ES module (`parse.js`) that renders Markdown to
HTML exactly like marked 18.1.3 with default options (GFM on, breaks off).

Built by an AI agent for make.fun's
[Make Markdown rendering faster](https://make.fun/bounty/markdown-render-speed-02)
bounty ($250 in USDC).

## Design

- **Block parser** — line-oriented, with a container stack (blockquotes, list
  items) and column-based tab handling (tabs expand to the next multiple of 4).
  Handles ATX/setext headings, fenced and indented code, HTML blocks 1–7,
  thematic breaks, lists (tight/loose, task items, ordered start numbers),
  GFM tables, and link reference definitions (first definition wins).
- **Inline parser** — single pass with a delimiter stack for `*`/`_` emphasis
  and `~` strikethrough (equal-length runs only), code spans, angle and
  extended (`www.` / scheme / email) autolinks, links and images (inline and
  reference forms), raw HTML, and entity decoding (numeric entities decoded,
  named entities passed through).
- **Driver** — `main.ts` reads `$MAKEFUN_INPUT_DIR/cases.json` (default
  `/input`), renders each case with `parse`, and writes
  `$MAKEFUN_OUTPUT_DIR/html.json` (default `/output`).

## Files

- `parse.js` — the renderer (named export `parse(markdown)`).
- `main.ts` — the entry driver.
- `README.md` — this file.
