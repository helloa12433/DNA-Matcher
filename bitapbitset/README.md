
##  Bitap / Bitset DP Matcher


# 🧬 DNA Bitap Matcher — Bitset DP for k Errors

Approximate DNA matcher using **Bitap / bitset dynamic programming**.

This method trades full DP matrix for **bit masks**, allowing very fast matching
for **short patterns** over **long texts** with up to `k` errors
(mismatches or full edits depending on variant).

---

## 🔥 Overview

Bitap builds bitmasks that encode where each character appears in the pattern.
Each text character updates one or more bit-vectors that represent whether
prefixes of the pattern match with up to `k` errors.

For DNA we keep bitmasks for `A/C/G/T` and maintain k+1 bitsets in parallel.

- Error model: `k` errors (can be mismatch-only or full edit variant)
- Very efficient when pattern length ≤ machine word size * a few

---

## 🌟 Features

- 📦 Pattern packed into bitsets
- ⚡ Very fast per-character update using bitwise ops
- 🔢 Supports small `k` (0–4 typically)
- 🎯 Reports windows with ≤ `k` errors
- 🎨 Heatmap from normalized match score

---

## 🧠 How Bitap Works (mismatch-only flavour)

For pattern `P` length `m` (assume `m ≤ 64` for simple version):

1. Build equality masks:

   ```txt
   Peq[c] = bit i is 1 if P[i] == c
Maintain a bit-vector R where bit i means
"prefix of length i+1 matches suffix of text with ≤ k errors".

For each text char c:

update R with a bit-parallel recurrence involving shifts, AND, OR.

if bit corresponding to full length falls within error threshold, emit match.

Full k-error edit-distance variant maintains k+1 bitsets: R0, R1, ..., Rk.

Time per character: O(k) bit operations (usually < 5)
Space: O(k * ceil(m / wordSize)).

⚡ Practical Size & Performance
Best when:

pattern length ≤ few hundred chars (bitsets across few words)

text length: MB–few GB (streaming/chunked)

Example (single-word DNA variant, m ≤ 64):

Text length	Pattern length	k errors	Time (approx)
50k	40 bp	≤ 2	~4–8 ms
500k	40 bp	≤ 2	~40–70 ms
2M	40 bp	≤ 2	~160–280 ms
10M	40 bp	≤ 2	~1–1.8 s

TB-level: ⚠️ Only via streaming over sharded data; each core must still read all characters.

live url :- https://bitapbitsetdpdnamatcher.bytexl.live/

👨‍🔬 Ideal For
“Fuzzy grep” style search with short motifs

Real-time log / stream matching with small pattern

Teaching bit-parallel algorithms on DNA

📄 License
MIT License

👨‍💻 Author
Pankaj Kumar
