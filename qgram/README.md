q-gram / LSH + Verify Matcher

```md
# 🧬 DNA q-gram / LSH Matcher — Index + Verify

Large-scale DNA matcher using **q-gram indexing / locality sensitive hashing (LSH)**
combined with a **verification step**.

Instead of scanning every base for every query, we:

1. Index many small q-grams from all sequences.
2. Use LSH / hash buckets to get **candidates** that look similar.
3. Run an exact matcher (DP / Hamming) only on those candidates.

---

## 🔥 Overview

q-gram / LSH + verify is designed for **databases**:

- many sequences (documents, reads, contigs)
- total size: **GB–TB**
- queries: short patterns or sequences

Works for both **mismatches** and **edits** (when verifier supports edits).

---

## 🌟 Features

- 🧱 q-gram index over all DNA strings
- 🪣 Hash buckets or LSH signatures for grouping similar substrings
- ⚡ Fast candidate retrieval (sub-linear in total DB size)
- ✅ Configurable verification backend:
  - Hamming k-mismatches
  - Levenshtein DP
  - Myers bit-vector
- 📊 Outputs:
  - candidate sequence IDs + positions
  - similarity score
  - 5-card summary (for single chosen sequence in UI demo)

---

## 🧠 How q-gram / LSH + Verify Works

### q-gram indexing

1. Choose q (e.g. 8–15).
2. For each sequence `S` in DB and each position `i`:
   - `gram = S[i..i+q)`
   - insert `(seqId, i)` into index[gram].

### Query phase

1. Break pattern `P` into q-grams.
2. For each q-gram:
   - look up index[gram]
   - collect candidate `(seqId, position)` hits
3. Cluster candidates into windows / sequences with many shared q-grams.
4. For each candidate window:
   - call verifier (DP / Hamming)
   - keep only those within error threshold.

LSH variant:

- Instead of exact q-grams, we store hash-based signatures (e.g. MinHash, SimHash).
- Candidates are retrieved from similar buckets.

---

## ⚡ Practical Scale & Performance

**Best use: big collections**

- Many sequences, total size: **many GB–TB**
- Index resides on disk / distributed nodes
- Query time mostly depends on:
  - number of q-gram hits
  - number of candidate windows verified

Browser demo:

- Small in-memory q-gram index to show concept.
- Backend/cluster version: real scale.

TB-level: ✅ **realistic as collection** when:

- index is sharded
- verification is parallelized.

---

## 👨‍🔬 Ideal For

- Large genomic DB search (many genomes / contigs)
- Read mapping in read-mapping style tools (with further refinement)
- Near-duplicate document / sequence detection

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Pankaj Kumar
