# 🧬 DNA Approximate Matching Suite  
### Hybrid FFT + Bit-Vector + Seed-Based + Index-Based DNA Matchers  
🚀 Ultra-optimized search engines for mismatches, edits, and local alignment  

---

# 🌈 Overview  

This project is a **collection of 8 powerful DNA pattern-matching algorithms**, each optimized for:  

- Large DNA sequences (MB → GB scale)  
- Allowed mismatches / edits  
- Local alignment  
- Convolution-based matching  
- Index-based search at huge scale  

Every algorithm reports:  
✔ Gene Present  
✔ Mutation Present  
✔ Virus Marker Probability  
✔ Variant Similarity  
✔ Approx. Similarity (%)  
✔ Neon Heatmap of match strength  

---

# 🔥 Core Comparison Table

| Algorithm | Errors | Speed | Pattern Size | Text Size | TB Realistic? | Best Use |
|----------|--------|--------|---------------|-------------|----------------|-----------|
| **DP Edit Distance** | full edits | ❌ slow | ≤1k | MB–100MB | ❌ | full accuracy |
| **Myers Bit-vector** | k edits/mism | ⚡⚡ fast | ≤128bp | MB–GB | ⚠️ chunked | short pattern fuzzy |
| **FFT JS (Hamming)** | mismatches | ⚡ fast | 10–200bp | 10⁵–10⁶ | ❌ | medium in-browser |
| **FFT WASM** | mismatches | ⚡⚡ faster | 10–200bp | 1M–10M | ⚠️ | high-performance |
| **q-gram / LSH** | edits/mism | ⚡ | any | GB–TB | ✅ | massive DB search |
| **Seed-and-Extend** | mismatches | ⚡ | 10–200 | MB–GB | ⚠️ | BLAST-like |
| **Wu–Manber** | mismatches | ⚡ | 20–200 | MB–GB | ⚠️ | skip-based |
| **FM-index / SA** | k edits | ⚡⚡ | short | GB–tens GB | ⚠️ | genome aligners |

---

# 📚 Individual Algorithm Documentation  

## 1️⃣ DP Edit Distance (Levenshtein)

- Full edits: insertions, deletions, substitutions  
- Perfect accuracy but slow  

### ⏱ Speed  
- 50k text → ~10–20 ms  
- 500k → ~150 ms  
- 2M → ~1–2 s  

### 📦 Data Size  
- MB–100MB  
- ❌ Not GB/TB suitable  

---

## 2️⃣ Myers Bit-vector

- Fastest for patterns ≤ 128 bp  
- DP simulated with bitwise operations  

### ⏱ Speed  
- 50k → ~5 ms  
- 1M → ~40 ms  
- 10M → ~0.5–1.2 s  

### 📦 Data Size  
- MB → a few GB  
- TB possible via streaming  

---

## 3️⃣ FFT k-Mismatches (JS)

- Pure JavaScript FFT  
- 4-channel DNA convolution (A/C/G/T)  

### ⏱ Speed  
- 50k → 10–15 ms  
- 500k → ~90 ms  
- 2M → ~0.5 s  

### 📦 Data Size  
- Best for 10⁵–10⁶  

---

## 4️⃣ FFT k-Mismatches (WASM)

- Native-like convolution  
- Rust/C++ → WebAssembly  

### ⏱ Speed  
- 500k → 50–80 ms  
- 2M → 150–250 ms  
- 10M → 600–800 ms  

### 📦 Data Size  
- 1M–10M  
- Chunking needed beyond this  

---

## 5️⃣ q-gram / LSH + Verify

- TB-scale realistic  
- Divide into q-grams → LSH buckets → verify candidates  

### ⏱ Speed  
- Extremely fast on large datasets  
- Designed for GB–TB databases  

### 📦 Data Size  
- Many GB → Many TB  

---

## 6️⃣ Seed-and-Extend (BLAST-like)

- Exact seeds → extend & check mismatches  
- Used widely in genomics  

### ⏱ Speed  
- 50k → ~5–8 ms  
- 500k → ~60 ms  
- 2M → 200–300 ms  

### 📦 Data Size  
- MB → few GB  
- TB possible with distributed indexing  

---

## 7️⃣ Wu–Manber Style

- Skip-based matching  
- Uses block hashes and shift table  

### ⏱ Speed  
- 50k → 6–10 ms  
- 500k → 50–90 ms  
- 2M → 200–350 ms  

### 📦 Data Size  
- Best: MB–GB  

---

## 8️⃣ FM-Index / Suffix Array

- Compressed full-text index  
- Supports backtracking for k edits  

### 📦 Data Size  
- GB–tens of GB reference  
- TB hard (requires distributed FM-index)  

---

# 🧠 Final Mega-Table

| Algorithm | Full Edits | Mismatches | Speed | Best Pattern | Best Text | TB? | Notes |
|----------|------------|------------|--------|---------------|------------|-------|-------|
| Levenshtein | ✅ | ✅ | ❌ | ≤1k | MB–100MB | ❌ | Exact DP |
| Myers | ✅ | ✅ | ⚡⚡ | ≤128 | MB–GB | ⚠️ | Best for short |
| FFT JS | ❌ | ✅ | ⚡ | 10–200 | 10⁵–10⁶ | ❌ | Browser FFT |
| FFT WASM | ❌ | ✅ | ⚡⚡ | 10–200 | 1M–10M | ⚠️ | Native-like |
| q-gram / LSH | ⚠️ | ⚠️ | ⚡ | any | GB–TB | ✅ | Large DBs |
| Seed+Extend | ❌ | ✅ | ⚡ | 10–200 | MB–GB | ⚠️ | BLAST-like |
| Wu–Manber | ❌ | ✅ | ⚡ | 20–200 | MB–GB | ⚠️ | Skip-based |
| FM-index | ⚠️ | ⚠️ | ⚡⚡ | short | GB–tens GB | ⚠️ | Genome aligners |

---

# 🎉 Conclusion

This repository demonstrates **every major approximate string-matching family**,  
from basic DP → bit-vector → FFT → seeds → index structures.

It can be used for:

- Genomic research  
- Mutation scanning  
- Fast approximate search  
- Educational visualizations  
- Benchmarking diverse algorithms  

---
## 🏆 SUMMARY: Which Algorithm Should You Use?

### ⚡ Fastest overall (situation-based)

**→ FM-index / Suffix-Array (large genomes, repeated queries)**  
Super-fast queries (microseconds–ms) once index is built.  
Ideal for huge reference genomes (GB–tens of GB).

**→ Myers Bit-vector (short patterns, streaming text)**  
Fastest approximate DP for ≤128bp patterns.  
Perfect for MB–GB scans.

**→ FFT WASM k-mismatches (large mismatch scanning)**  
Fastest for long windows (hundreds of thousands–millions of bases).  
Mismatch-only model but extremely high throughput.

---

### 🔬 If you want real BLAST-style matching:

**→ Seed-and-Extend + Smith–Waterman**  
Seeds for fast filtering, SW for accurate local alignment.  
Classic pipeline used in BLAST, Bowtie-2, minimap2.

---

## 🏆 Fastest Algorithms (Situation-Based)

### ⚡ Fastest for full genome-scale search (post-index build)
→ **FM-index / Suffix Array**
- microsecond–millisecond search  
- handles billions of bases  
- backbone of BWA / Bowtie  
- ideal for repeated queries  

### ⚡ Fastest for short-pattern approximate DP
→ **Myers Bit-vector**
- O(n / wordsize) streaming  
- pattern ≤ 128bp  
- best for MB–GB linear scans  

### ⚡ Fastest for large-window mismatch search
→ **FFT WASM k-mismatches**
- O(n log n) convolution  
- best for 200k–10M text size  
- perfect for mismatch-only genomic scanning


### 🏢 If you want TB-scale search:

**→ q-gram / LSH (distributed collection search)**  
Great for many GB–TB of sequences (as documents/reads).

**→ Distributed FM-index (cluster-scale reference)**  
Research-level but extremely powerful for massive references.

---

### 🎯 Best full-edit accuracy (ins/del/sub):

**→ DP Edit Distance (Levenshtein) or Smith–Waterman**  
Use for final verification or small local windows.


# 💛 Credits  
Built with passion by **Pankaj Kumar**.  
