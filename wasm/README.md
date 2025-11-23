# 🧬 DNA FFT Matcher — WebAssembly-Accelerated Core

High-performance DNA k-mismatch matcher using a **WebAssembly FFT** backend.  
Same Hamming model as the JS FFT version, but with **native-like speed**  
for large sequences.

UI metrics & heatmap are identical to the JS FFT matcher.

---

## 🔥 Overview

Heavy FFT work is moved into a WASM module written in Rust/C++ and compiled to WebAssembly.

Hybrid usage:

- small inputs → pure JS FFT is often enough
- large inputs → **WASM FFT** is much faster

This README describes the **WASM engine** alone.

---

## 🌟 Features

- Rust/C++ FFT (KissFFT/FFTW-like) compiled to WASM
- Shared buffers between JS & WASM to avoid copies
- Supports convolution for A/C/G/T channels
- Used by the Hybrid FFT Matcher as the “big data path”
- Same 5 summary cards + heatmap UI

---

## 🧠 How It Works (short)

1. JS prepares float arrays for the 4 DNA channels.
2. Calls WASM:

   ```js
   import init, { wasmFFTConvolve } from "./wasm_fft/wasm_fft.js";

   async function convolve(a, b) {
     await init();
     return wasmFFTConvolve(a, b); // inside WASM
   }
WASM:

runs FFT / IFFT

returns match-count arrays

JS:

converts matches → mismatches

applies k-threshold

feeds data into heatmap + cards.

⚡ Rough Performance (WASM FFT)
Text length	Pattern	Time (approx)
50k	20–100	~15–20 ms
500k	20–100	~50–80 ms
2M	20–100	~150–250 ms
10M	20–100	~0.6–0.8 s

Small sizes: slightly slower than JS FFT (init cost)

Large sizes: significantly faster and more stable.

TB-scale: still requires chunking / distributed pipeline.

live url :- https://dnafftwasmmatcher.bytexl.live/

👨‍🔬 Ideal For
Production-grade FFT-based DNA matcher in browser

Large inputs (hundreds of thousands to millions of bases)

Hybrid systems that auto-pick JS vs WASM based on size

📄 License
MIT — part of DNA Approximate Matcher suite.

yaml
Copy code
