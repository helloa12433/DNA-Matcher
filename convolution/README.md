# 🧬 DNA FFT Matcher — Pure JavaScript Convolution

Fast DNA k-mismatch matcher using **complex FFT convolution in JavaScript**  
(no WebAssembly).  
Specialized for **Hamming distance** (mismatches-only).

UI metrics:

- Gene Present
- Mutation Present
- Virus Marker
- Variant Similarity
- Approx. Similarity (%)
- Pink–blue heatmap of match strength.

---

## 🔥 Overview

For each base A/C/G/T we build indicator arrays and convolve them using JS FFT:

```text
matches[i] = matches_A[i] + matches_C[i] + matches_G[i] + matches_T[i]
mismatches[i] = patternLen - matches[i]
This gives the mismatch count at every alignment in nearly O(n log n).

Best for medium–large sequences where DP is too slow

No WASM build step, instant dev experience

🌟 Features
Pure JavaScript Cooley–Tukey FFT

4-channel DNA encoding (A/C/G/T)

k-mismatch filtering after convolution

Heatmap from normalized match score

5 dashboard cards computed from best hits

🧠 How It Works (short)
Encode DNA into 4 binary arrays (text + reversed pattern).

For each base b:

Tb = FFT(text_b)

Pb = FFT(pattern_b_rev)

conv_b = IFFT(Tb * conj(Pb))

Sum matches across bases; derive mismatches.

Keep positions with mismatches ≤ k.

Time per run: O(L log L) where L ≈ textLen + patternLen.

⚡ Rough Performance (JS FFT)
Text length	Pattern	Time (approx)
50k	20–100	~10–15 ms
500k	20–100	~80–120 ms
2M	20–100	~0.4–0.6 s
10M	20–100	❌ often too slow / memory-heavy

Best when:

text up to ~1e5–1e6 chars in browser

you want FFT demo without WASM toolchain.

👨‍🔬 Ideal For
Teaching convolution-based string matching

Moderate-size genomic experiments

Quick prototype before WASM/Native optimization

📄 License
MIT — part of DNA Approximate Matcher suite.
