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

```text
H[i][j] = max(
  0,
  H[i-1][j-1] + (match ? +score : -penalty),
  H[i-1][j]   + gap,
  H[i][j-1]   + gap
)
