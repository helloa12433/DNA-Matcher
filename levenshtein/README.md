# 🧬 DNA Edit Distance Matcher — Full Levenshtein DP

Exact DNA matcher using classic **Levenshtein dynamic programming**.  
Supports **full edits**:

- insertions
- deletions
- substitutions

and reports the **true edit distance** between pattern and every window of the DNA text.

UI matches the rest of the suite:

- neon heatmap
- 5 summary cards:
  - Gene Present
  - Mutation Present
  - Virus Marker
  - Variant Similarity
  - Approx. Similarity

---

## 🔥 Overview

Levenshtein DP is the most direct way to measure how many edits it takes to turn
the DNA pattern into a substring of the text.

We slide the pattern over the text and maintain a DP row that gives the edit distance
for each alignment. This is **exact** but heavier than bit-vector or FFT methods.

- Errors allowed: insert, delete, substitute
- Distance = minimum number of edits
- Perfect for small/medium sequences or as a **verification** stage

---

## 🌟 Features

- 🧮 Exact edit distance between pattern and text windows
- 🧬 Full edit model (indels + mismatches)
- 🎯 Optional threshold `k` (report windows with distance ≤ k)
- 🎨 Heatmap based on normalized similarity `1 − dist / patternLen`
- 📊 5 summary cards derived from best windows

---

## 🧠 How Levenshtein DP Works (Sliding Version)

For pattern `P` length `m`, text `T` length `n`:

- Maintain two DP rows: `prev[]` and `curr[]`, each size `m + 1`.
- `prev[j]` = edit distance between `P[0..j-1]` and current text prefix.
- For each text character `T[i]`, update:

```txt
curr[0] = i + 1
for j = 1..m:
  cost = (P[j-1] == T[i]) ? 0 : 1

  curr[j] = min(
    prev[j]   + 1,    // deletion
    curr[j-1] + 1,    // insertion
    prev[j-1] + cost  // substitution
  )
After processing T[i], curr[m] is the edit distance of alignment ending at i.

If curr[m] ≤ k, record a match window [i-m+1, i].

Time: O(n * m)
Space: O(m).

⚡ Practical Size & Performance
Example JS timings, pattern 50–200 bp:

Text length	Pattern length	Time (approx)
10k	80 bp	~5–10 ms
100k	80 bp	~60–100 ms
1M	80 bp	~0.8–1.5 s
5M	80 bp	~5–8 s (heavy)

Best use:

pattern ≤ 1k

text up to few MB–~100 MB (native/backend), smaller in browser

as local verify after seeding / indexing

TB-level: ❌ only as tiny verification windows, not full scan.

👨‍🔬 Ideal For
When you need exact edit distance, not approximate

Visualizing cost of mutations and indels

Explaining dynamic programming on DNA sequences

📄 License
MIT License

👨‍💻 Author
Pankaj Kumar
