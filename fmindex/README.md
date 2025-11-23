# 🧬 DNA FM-index Matcher — Compressed Index + Backtracking

DNA matcher built on top of a **FM-index / suffix-array** style compressed index.

Instead of scanning the whole text on every query, we:

- pre-build an index over the reference genome (GB-scale), then
- answer queries with **backward search** and limited **backtracking** for mismatches/edits.

---

## 🔥 Overview

FM-index is essentially a compressed representation of all suffixes of the reference.
It supports fast operations:

- count how many times a pattern occurs
- locate exact match positions
- extend search with one more character to left/right

With special branching logic, we can allow **k mismatches** or **k edits** while still exploring
only a small part of the search tree.

---

## 🌟 Features

- 🧱 Compressed index over DNA reference (BWT + rank/select)
- 🔍 Exact match search in `O(|pattern|)` time (plus rank/select cost)
- 🌊 Approximate search via bounded backtracking:
  - explore edit operations at limited depth
- ⚡ Fast queries after heavy one-time index build
- 📊 For demo UI:
  - show reference hit positions
  - mismatch locations after verifying each hit

---

## 🧠 How FM-index Matching Works

### Index construction (offline)

1. Take reference string `T` with terminal symbol `$`.
2. Build suffix array `SA`.
3. Build BWT (Burrows–Wheeler Transform).
4. Precompute rank/select structures for each symbol (A/C/G/T/$).
5. Store compressed index.

### Exact backward search

For pattern `P`:

1. Start with range `[l, r)` = whole suffix array.
2. For `i = |P|−1 down to 0`:
   - c = `P[i]`
   - update `[l, r)` with rank/select on BWT:
     - new interval = suffixes beginning with c+prefix
3. If interval non-empty → occurrences are `SA[l..r)`.

### Approximate (k-mismatch / k-edit) backtracking

At each recursion step:

- Keep `(i, l, r, kLeft)`:
  - `i` = current pattern index
  - `[l, r)` = current suffix-interval
  - `kLeft` = remaining allowed errors
- Options:
  - **match**: next char same → normal backward step
  - **substitution**: try different char with `kLeft-1`
  - **insertion/deletion**: adjust `i` or `[l, r)` accordingly (for edit distance)

Prune states when:

- `kLeft < 0`
- or `[l, r)` becomes empty

---

## ⚡ Practical Scale

Index build:

- Memory: proportional to reference size with compression (~3–5 bits/base)
- Time: heavy but done once

Query:

- Exact search: `O(|pattern|)`  
- Approximate: `O(branching_factor^k)` but with tight pruning; in practice good for small `k`.

Typical reference:

- **GB–10s of GB** of DNA
- Many queries (reads) of length **50–250 bp**

TB-level:

- ⚠️ `TB` of reference is **hard / research-grade**:
  - must shard index
  - maybe store across cluster
  - careful I/O and compression

---

live url:- https://f-mindexdnamatcher.bytexl.live/

## 👨‍🔬 Ideal For

- Read mapping against big genomes (conceptually similar to BWA/Bowtie style)
- High-throughput query workloads after one-time index build
- Teaching how compressed text indexes speed up DNA search

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Pankaj Kumar
