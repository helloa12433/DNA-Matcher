# 🧬 DNA Myers Matcher — Bit-Vector k-Errors

High-speed approximate DNA matcher using the **Myers bit-vector algorithm**.  
Optimized for **short patterns** and **very long text**.

UI output (same as other matchers):

- Gene Present
- Mutation Present
- Virus Marker
- Variant Similarity
- Approx. Similarity (%)

---

## 🔥 Overview

Myers encodes the pattern into **bit masks** and simulates the Levenshtein DP row
with bitwise operations. For pattern lengths up to 64–128 bases, this is extremely fast.

- Error model: full edits (ins/del/sub)
- Allowed errors: small `k` (e.g. 0–6)
- Great for streaming over large DNA sequences

---

## 🌟 Features

- Pattern compressed into bit-vectors
- O(1) work per text character (a few bit ops)
- Supports insertions, deletions, mismatches
- Reports:
  - window start/end
  - edit distance
  - **mismatch indices on text axis**
  - similarity score → 5 summary cards

---

## 🧠 How It Works (short)

1. For each base `b ∈ {A,C,G,T}` build bitmask `Peq[b]` over pattern.
2. Maintain bit-vectors (`Pv`, `Mv`) representing DP row state.
3. For each text char:
   - load `Eq = Peq[text[i]]`
   - update `Pv`, `Mv` via bitwise ops
   - derive current edit distance at pattern end.
4. If distance ≤ k → output a match window & compute mismatch positions.

Time: `O(n * ceil(m / wordSize))`  
Space: `O(ceil(m / wordSize))`.

---

## ⚡ Rough Performance (JS, one core)

| Text length | Pattern | k | Time (approx) |
|-----------:|--------:|--:|---------------|
| 50k        | 20–40   | ≤3| ~5–8 ms       |
| 500k       | 20–40   | ≤3| ~40–70 ms     |
| 2M         | 20–40   | ≤3| ~180–250 ms   |
| 10M        | 20–40   | ≤3| ~1–1.6 s      |

- Best for pattern ≤ **64–128 bp**
- Text: MB–few GB (streaming/chunked)
- TB-level: only via **sharding/streaming**, not in one array.

---

live url :- https://dnamyersmatcherbit-vectork-errors.bytexl.live/

## 👨‍🔬 Ideal For

- Fast fuzzy search of small motifs
- Online / streaming DNA monitoring
- “Fuzzy grep” demo for edit distance

---

## 📄 License

MIT — part of DNA Approximate Matcher suite.
