
---

# 🧬 DNA Wu–Manber Matcher — Block-Hash Skip + k-Mismatches

Approximate DNA matcher inspired by the **Wu–Manber** algorithm.

Uses a **block-size hash** at the pattern tail to skip over the text,  
then verifies candidate windows with up to `k` mismatches.

UI metrics:

- Gene Present
- Mutation Present
- Virus Marker
- Variant Similarity
- Approx. Similarity (%)

---

## 🔥 Overview

Wu–Manber-style matching:

- Precomputes a shift table for pattern tail blocks.
- While scanning text:
  - if the current tail block is unlikely → jump ahead.
  - if tail block matches → verify full window.

This reduces the number of full comparisons on large texts.

- Error model: k mismatches (no gaps)
- Works well for **medium patterns** (20–200 bp).

---

## 🌟 Features

- Block size slider (B = 2–6 bases)
- Shift-table pre-processing:
  - maps block → minimum safe shift
- Fast skipping on non-matching regions
- Full Hamming verify on candidate windows
- Reports mismatch indices, similarity, 5 cards + heatmap

---

## 🧠 How It Works (short)

1. **Preprocess pattern**

   For each position `i`:

   ```text
   block = pattern[i .. i+B)
   shift[block] = min(shift[block], m - B - i)

Default shift = m - B + 1.

Scan text

Align pattern at pos.

Compare tail block text[pos + m - B .. pos + m).

Look up shift s:

if s > 0 → pos += s.

if s == 0 → verify full window
(count mismatches, record indices; keep if ≤ k), then pos += 1.

⚡ Rough Performance
Text length	Pattern	Block	Time (approx)
50k	40 bp	3	~6–10 ms
500k	40 bp	3	~50–90 ms
2M	40 bp	3	~200–350 ms
10M	40 bp	3	~1.2–1.8 s

Good when blocks are reasonably selective (not ultra repetitive).

live url :- https://dnawumanbermatcher.bytexl.live/

👨‍🔬 Ideal For

Fast approximate search with very cheap preprocessing

Comparing skip-based vs full-scan algorithms

As a filter before heavier alignment

📄 License

MIT — part of DNA Approximate Matcher suite.
