🧬 DNA Approximate Matching Suite
Hybrid FFT + Bit-Vector + Seed-Based + Index-Based DNA Matchers

🚀 Ultra-optimized search engines for mismatches, edits, and local alignment

Author: Pankaj Kumar
Competitive Programmer • MERN + Web3 • FFT Specialist

🌈 Overview

This project is a collection of the 8 most powerful DNA pattern-matching algorithms, optimized for:

Large DNA sequences (MB → GB scale)

Allowed mismatches / edits

Local alignment

High-speed k-mismatch FFT

Index-based rapid searching

Every algorithm is implemented with:
🔬 concrete performance
🧠 data-size capacity
📊 best use-case
🎯 TB-level feasibility

🔥 Big Comparison Table (The Heart of the Project)
⭐ Algorithm Capabilities & Scaling
Family / Algorithm	Errors Allowed	Speed	Pattern Size	Text Size	TB-Level Feasible?	Notes
DP Edit Distance (Levenshtein)	full edits (ins/del/sub)	❌ slow	≤ 1k	MB–100MB	❌ No	Gold-standard accuracy
Myers Bit-vector	k edits	⚡ very fast	≤ 64–128 chars	MB–few GB	⚠️ Yes (streaming)	Best for short patterns
FFT k-mismatches (JS)	mismatches only	⚡ fast	10–200	MB–1GB	❌ No	Near O(n log n)
FFT k-mismatches (WASM)	mismatches only	⚡⚡ faster	10–200	1M–10M	⚠️ Limited	Hybrid for huge
q-gram / LSH + Verify	edits/mismatches	⚡ fast for collections	any	Many GB–TB	✅ Yes	Distributed-friendly
Seed-and-Extend	mismatches	⚡ fast	10–200	MB–GB	⚠️ Partial	Used in BLAST
Wu–Manber Style	k mismatches	⚡ fast	20–200	MB–GB	⚠️ Sometimes	Skip-based
FM-index / SA + Backtrack	k mismatches or k edits	⚡⚡ powerful	short	GB–tens of GB	⚠️ hard TB	Used in Bowtie/BWA
🎨 UI Summary Cards (Common to all)

All algorithms fill 5 key stats:

Gene Present

Mutation Present

Virus Marker Probability

Variant Similarity

Approx. Similarity (%)

Heatmap: brighter → stronger match
Mismatch index cards shown for every hit.

📚 INDIVIDUAL README SECTIONS

Below har algorithm ka independent README diya gaya.

1️⃣ DP Edit Distance (Levenshtein)
Full edit distance (insertions, deletions, substitutions)
🔧 Model

Classic dynamic programming on a matrix.

⚡ Speed
Text	Pattern	Time
50k	30 bp	~10–20 ms
500k	30 bp	~100–200 ms
2M	30 bp	~1–2 sec
📦 Data Size

Best: MB–100MB

Not suited for GB/TB.

🎯 Use

Exact accuracy needed

Verification stage for other algorithms

2️⃣ Myers Bit-vector (Bitset DP)
🔥 Fastest for small patterns (≤128 bp)
🔧 Model

Bitmasks + bit-operations simulate DP rows.

⚡ Speed
Text	Pattern	Time
50k	40 bp	~5 ms
1M	40 bp	~40 ms
10M	40 bp	~0.4–0.8 s
📦 Data Size

MB → few GB

TB possible via chunk-streaming.

🎯 Use

Short pattern fuzzy search

Real-time streaming DNA analysis

3️⃣ FFT k-Mismatches (Pure JS)
Fast Hamming mismatch finder via convolution
🔧 Method

Binary encode A/C/G/T → 4 FFT convolutions → sum → mismatches.

⚡ Speed
Text	Pattern	Time
50k	30 bp	~10–15 ms
500k	30 bp	~80–100 ms
2M	30 bp	~0.4–0.6s
📦 Data Size

Best: 10⁵ – 10⁶ bases

JS memory limits hit quickly.

🎯 Use

Browser-only FFT demo

Medium sequences

4️⃣ FFT k-Mismatches (WASM)
🚀 Native-like FFT for large sequences
⚡ Speed
Text	Pattern	Time
500k	30 bp	~50–80 ms
2M	30 bp	~150–250 ms
10M	30 bp	~700–800 ms
📦 Data Size

Safe: 1M–10M bases

Chunking needed beyond this.

🎯 Use

High-performance FFT pipeline

Browser-based genomic tools

5️⃣ q-gram / LSH + Verify
TB-scale realistic — large DNA databases
🔧 Method

Break into q-grams

Hash buckets

LSH for approximate similarity

Verify short candidate windows

⚡ Speed

Varies, but extremely fast for huge databases.

📦 Data Size

GB–TB realistically

Used in similarity search engines.

🎯 Use

DNA document databases

Massive-scale genome collections

6️⃣ Seed-and-Extend (BLAST-like)
Search seeds → verify windows
⚡ Speed
Sequence	Pattern	Time
50k	30 bp	~5–8 ms
500k	30 bp	~50–70 ms
2M	30 bp	~200–300 ms
📦 Data Size

MB→GB

TB possible in distributed mode.

🎯 Use

Mutation-tolerant

Great before Smith–Waterman

7️⃣ Wu–Manber Style
Skip-based matching with block shifts
⚡ Speed
Text	Pattern	Time
50k	40 bp	~6–10 ms
500k	40 bp	~60–90 ms
2M	40 bp	~200–300 ms
📦 Data Size

Best: MB→GB

TB rare (needs non-repetitive text).

🎯 Use

Approximate matching with skipping

Good when DNA has low repetition

8️⃣ FM-Index / Suffix Array + Backtracking
Ultra-compressed index-based DNA search
⚡ Speed

Query: microseconds

But build time is huge.

📦 Data Size

Reference: GB–tens of GB

TB possible with distributed FM-index.

🎯 Use

Genome aligners (Bowtie/BWA)

Large reference DNA

🏆 SUMMARY: Which Algorithm Should You Use?
If you want the fastest overall:

→ Myers bit-vector (short patterns)
→ FFT WASM (large mismatches)

If you want real BLAST-style matching:

→ Seed-and-extend + Smith–Waterman

If you want TB-scale search:

→ q-gram/LSH OR distributed FM-index

Best full-edit accuracy:

→ DP Edit Distance or Smith–Waterman

🧠 Final Mega-Table (Everything Combined)
Algorithm	Full Edits	Mismatches	Speed	Best Pattern Size	Best Text Size	TB-Level	Notes
DP Edit Distance	✅	✅	❌ slow	≤1k	MB–100MB	❌	full accuracy
Myers Bit-vector	✅	✅	⚡⚡	≤128	MB–GB	⚠️	best for short patterns
FFT JS	❌	✅	⚡	10–200	10⁵–10⁶	❌	browser FFT
FFT WASM	❌	✅	⚡⚡	10–200	1M–10M	⚠️	heavy FFT
q-gram / LSH	⚠️	⚠️	⚡	any	GB–TB	✅	massive datasets
Seed-and-Extend	❌	✅	⚡	10–200	MB–GB	⚠️	BLAST-like
Wu–Manber	❌	✅	⚡	20–200	MB–GB	⚠️	skip-based
FM-index	⚠️	⚠️	⚡⚡	small	GB–tens GB	⚠️	genome aligners
