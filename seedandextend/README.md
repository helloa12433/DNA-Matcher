
---


# 🧬 DNA Seed-and-Extend Matcher — BLAST-Style Hits

Approximate DNA matcher using a **seed-and-extend** strategy similar to BLAST:

1. Find exact matches of short **seeds**.
2. Extend around each seed while counting mismatches.

UI metrics:

- Gene Present
- Mutation Present
- Virus Marker
- Variant Similarity
- Approx. Similarity (%)

---

## 🔥 Overview

Instead of comparing at every position, this matcher:

- builds a seed index over the text (k-mer → positions)
- picks spaced seeds from the pattern
- verifies only windows that share seeds with the pattern

This gives big speedups on large texts, especially when seeds are selective.

- Error model: k mismatches (Hamming)
- Pattern length: 10–200 bp (typical)

---

## 🌟 Features

- Seed length slider (e.g. 3–8)
- Spaced seeding (step ≈ seedLen/2)
- Text-side seed index (Map: seed → positions)
- Full-window Hamming verify after a seed hit
- Reports:
  - window start/end
  - mismatch positions
  - similarity score + 5 cards
- Heatmap based on match density/score

---

## 🧠 How It Works (short)

1. **Index text**

   For each `i`:

   ```text
   seed = text[i .. i+seedLen)
   index[seed].push(i)

Generate seeds from pattern

for s = 0; s <= m - seedLen; s += stride:

seed = pattern[s .. s+seedLen)

For each hit position p of that seed

candidate window start = p - s

verify pattern vs text[start .. start+m):

count mismatches, record mismatch indices

accept if mismatches ≤ k

Aggregate accepted windows → UI.

⚡ Rough Performance

SeedLen 3–6, normal DNA (not too repetitive):

Text length	Pattern	Time (approx)
50k	~30 bp	~5–8 ms
500k	~30 bp	~40–70 ms
2M	~30 bp	~180–300 ms
10M	~30 bp	~1.0–1.5 s

Handles many MB–hundreds of MB on single machine.

TB-scale realistic as many sequences + index, not one big string.

live url :- https://dnaseed-and-extendmatcher.bytexl.live/

👨‍🔬 Ideal For

BLAST-style “hit first, align later” pipelines

Quickly narrowing down regions for Smith–Waterman

Matching reads with small error tolerance

📄 License

MIT — part of DNA Approximate Matcher suite.
