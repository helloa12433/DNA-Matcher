# 🧬 DNA Smith–Waterman Matcher — Local Alignment with Gaps

Local alignment engine based on **Smith–Waterman DP**.  
Finds high-scoring local alignments between pattern and a long DNA text.

UI metrics:

- Gene Present
- Mutation Present
- Virus Marker
- Variant Similarity
- Approx. Similarity (%)

---

## 🔥 Overview

Smith–Waterman computes the **best local alignment** allowing:

- matches (reward)
- mismatches (penalty)
- gaps: insertions & deletions (gap penalty)

Great as an **alignment/visualization step** after a fast filter (seed/FFT/index).

---

## 🌟 Features

- True local alignment (subsequence vs subsequence)
- Configurable match/mismatch/gap scoring
- Backtracking to recover alignment window
- Reports:
  - window start/end on text
  - edit distance / score
  - mismatch positions
- 5 summary cards from top-N alignments

---

## 🧠 How It Works (short)

DP matrix `H[i][j]`:

H[i][j] = max(
  0,
  H[i-1][j-1] + (match ? +score : -penalty),
  H[i-1][j]   + gap,
  H[i][j-1]   + gap
)

Fill H for all i, j.

Track global max cells.

From each max, backtrack until score hits 0:

determine alignment window in text

count mismatches/gaps → similarity.

Normalize scores → heatmap + 5 cards.

Time: O(n * m)
Space: O(n * m) (demo uses compact 1D array + band via “max alignment length”).

⚡ Rough Performance

Pattern ~50–150 bp:

Text length	Time (approx)
50k	~30–50 ms
500k	~300–400 ms
2M	~1.5–2.5 s
10M	~8–12 s

Best usage:

Text up to few MB per run in browser

Or small candidate windows after seeding / indexing

TB-scale only as verification, not full-scan.

👨‍🔬 Ideal For

Showing local alignment around interesting hits

Visualizing mutations + gaps

Teaching scoring-based alignment

live url :- https://dnasmithwatermanmatcher.bytexl.live/

📄 License

MIT — part of DNA Approximate Matcher suite.
