
import React, { useEffect, useRef, useState } from "react";
import "./dna.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---- WASM loader (optional) ----
 attempts to load /fft.wasm and expects an exported function named `convolution`
 with a simple typed-array-based memory interface. If not present the code falls
 back to the JS FFT implementation below.
*/
async function loadWasmConvolution() {
  try {
    if (!WebAssembly.instantiateStreaming) {
      // older browsers: fetch + instantiate
      const resp = await fetch("/fft.wasm");
      const bytes = await resp.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      return instance;
    }
    const { instance } = await WebAssembly.instantiateStreaming(fetch("/fft.wasm"), {});
    return instance;
  } catch (e) {
    return null;
  }
}

/* ---- JS FFT impl (iterative Cooley-Tukey) ----
 - uses typed Float64Array for speed.
 - returns real-valued convolution result.
*/
function nextPow2(n) {
  return 1 << Math.ceil(Math.log2(n));
}

function fftIterative(re, im, n, invert) {
  // bit reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      let tr = re[i]; re[i] = re[j]; re[j] = tr;
      let ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = 2 * Math.PI / len * (invert ? -1 : 1);
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1;
      let wi = 0;
      for (let j = 0; j < (len >> 1); j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + (len >> 1)] * wr - im[i + j + (len >> 1)] * wi;
        const vIm = re[i + j + (len >> 1)] * wi + im[i + j + (len >> 1)] * wr;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + (len >> 1)] = uRe - vRe;
        im[i + j + (len >> 1)] = uIm - vIm;
        const tr = wr * wlenRe - wi * wlenIm;
        wi = wr * wlenIm + wi * wlenRe;
        wr = tr;
      }
    }
  }

  if (invert) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

function convolveRealArrays(a, b) {
  const n = a.length + b.length - 1;
  const size = nextPow2(n);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  const re2 = new Float64Array(size);
  const im2 = new Float64Array(size);

  re.set(a);
  re2.set(b);

  fftIterative(re, im, size, false);
  fftIterative(re2, im2, size, false);
  for (let i = 0; i < size; i++) {
    const r = re[i] * re2[i] - im[i] * im2[i];
    const imv = re[i] * im2[i] + im[i] * re2[i];
    re[i] = r;
    im[i] = imv;
  }
  fftIterative(re, im, size, true);
  const out = new Float64Array(n);
  out.set(re.subarray(0, n));
  return out;
}

/* ---- High-level convolution that tries WASM then falls back to JS ----
   Expected WASM behaviour (if provided):
   - The WASM instance should export a function `convolution(ptrA, ptrB, lenA, lenB, outPtr)`
     and have an accessible linear memory at instance.exports.memory.
   - This code will automatically attempt to call it when wasmInstance is provided.
*/
async function makeConvolver() {
  const wasmInstance = await loadWasmConvolution();
  if (wasmInstance && wasmInstance.exports && wasmInstance.exports.convolution && wasmInstance.exports.memory) {
    return async function wasmConvolve(aFloat64, bFloat64) {
      const mem = wasmInstance.exports.memory;
      const lenA = aFloat64.length, lenB = bFloat64.length;
      const nOut = lenA + lenB - 1;
      const bytes = 8 * (lenA + lenB + nOut + 16);
      const ptr = wasmInstance.exports.malloc ? wasmInstance.exports.malloc(bytes) : 0;
      if (!ptr) {
        // fallback to JS
        return convolveRealArrays(aFloat64, bFloat64);
      }
      const heap = new Float64Array(mem.buffer, ptr, Math.floor(bytes / 8));
      heap.set(aFloat64, 0);
      heap.set(bFloat64, lenA);
      const outPtr = lenA + lenB;
      // call wasm convolution: convolution(ptrAIdx, ptrBIdx, lenA, lenB, outIdx)
      wasmInstance.exports.convolution(0, lenA, lenA, lenB, outPtr);
      const result = new Float64Array(mem.buffer, ptr + outPtr * 8, nOut).slice();
      if (wasmInstance.exports.free) wasmInstance.exports.free(ptr);
      return result;
    };
  } else {
    return async function jsConvolve(a, b) {
      return convolveRealArrays(a, b);
    };
  }
}

/* ---- Map DNA -> 4 indicator arrays and perform 4 convolutions ----
   Uses pattern reversed (so convolution equals sliding dot product)
*/
async function fftMatchAndSignal(text, pattern, convolveFn) {
  const n = text.length;
  const m = pattern.length;
  if (!m || n < m) return { signal: new Float64Array(n).fill(0), scores: [] };

  const bases = ["A", "C", "G", "T"];
  const summ = new Float64Array(n + m - 1);
  for (let b = 0; b < 4; b++) {
    const ch = bases[b];
    const arrT = new Float64Array(n);
    const arrP = new Float64Array(m);
    for (let i = 0; i < n; i++) arrT[i] = text[i] === ch ? 1.0 : 0.0;
    for (let i = 0; i < m; i++) arrP[m - 1 - i] = pattern[i] === ch ? 1.0 : 0.0; // reversed
    const conv = await convolveFn(arrT, arrP);
    for (let i = 0; i < conv.length; i++) summ[i] += conv[i];
  }
  // summ[k] where k corresponds to index (pattern aligned ending at k)
  // For sliding window starting at i (0-based) we want summ[i + m - 1]
  const signal = new Float64Array(n).fill(0);
  let maxv = 1e-9;
  for (let i = 0; i <= n - m; i++) {
    const score = summ[i + m - 1] / m; // normalized [0..1]
    for (let j = 0; j < m; j++) {
      signal[i + j] += score;
    }
    if (score > maxv) maxv = score;
  }
  // normalize
  for (let i = 0; i < n; i++) signal[i] /= Math.max(maxv, 1e-9);
  return { signal, scores: summ };
}

/* ---- Build matches list using convolution results (fast) ----
   Determine mismatches by computing score = number of equal positions (sum of 4 convolutions)
   mismatches = m - round(score)
*/
function extractMatchesFromConvolution(summ, text, pattern, allowed) {
  const n = text.length, m = pattern.length;
  const out = [];
  for (let i = 0; i <= n - m; i++) {
    const score = summ[i + m - 1]; // actual equal count (floating)
    const matched = Math.round(score);
    const mism = m - matched;
    if (mism <= allowed) {
      out.push({
        pos: i + 1,
        mismatches: mism,
        snippet: text.slice(i, i + m),
        score: (matched / m)
      });
    }
  }
  return out;
}

/* color mapping unchanged from your original */
function valueToColor(v) {
  const r1 = 255, g1 = 82, b1 = 146;
  const r2 = 160, g2 = 82, b2 = 220;
  const r3 = 92, g3 = 138, b3 = 255;
  if (v < 0.5) {
    const t = v / 0.5;
    const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (v - 0.5) / 0.5;
    const r = Math.round(r2 + (r3 - r2) * t), g = Math.round(g2 + (g3 - g2) * t), b = Math.round(b2 + (b3 - b2) * t);
    return `rgb(${r},${g},${b})`;
  }
}

export default function App() {
  const [text, setText] = useState("");
  const [pattern, setPattern] = useState("");
  const [allowed, setAllowed] = useState(1);
  const [matches, setMatches] = useState([]);
  const [signal, setSignal] = useState([]);
  const heatRef = useRef(null);
  const convolverRef = useRef(null);

  useEffect(() => {
    makeConvolver().then(fn => {
      convolverRef.current = fn;
    });
  }, []);

  function drawHeatmap(sig) {
    const container = heatRef.current;
    if (!container) return;
    container.innerHTML = "";
    const n = sig.length;
    if (!n) return;
    const maxBars = Math.min(n, 700);
    const step = Math.max(1, Math.floor(n / maxBars));
    const bars = Math.ceil(n / step);
    for (let i = 0; i < n; i += step) {
      const slice = sig.slice(i, Math.min(i + step, n));
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const bar = document.createElement("div");
      bar.className = "heat-bar";
      bar.style.background = valueToColor(avg);
      bar.style.flex = `0 0 ${100 / bars}%`;
      const labelInterval = Math.max(1, Math.floor(n / 12));
      if (i % labelInterval < step) {
        const lbl = document.createElement("div");
        lbl.className = "heat-bar-label";
        lbl.textContent = String(i + 1);
        bar.appendChild(lbl);
      }
      bar.dataset.pos = String(i + 1);
      bar.dataset.value = avg.toFixed(3);
      container.appendChild(bar);
    }
  }

  async function runMatch() {
    const t = (text || "").toUpperCase().replace(/[^ACGT]/g, "");
    const p = (pattern || "").toUpperCase().replace(/[^ACGT]/g, "");
    if (!p || !t || t.length < p.length) {
      setMatches([]);
      setSignal([]);
      drawHeatmap([]);
      return;
    }
    const convolveFn = convolverRef.current || (async (a, b) => convolveRealArrays(a, b));
    const { signal: sig, scores: summ } = await fftMatchAndSignal(t, p, convolveFn);
    const list = extractMatchesFromConvolution(summ, t, p, allowed);
    setMatches(list);
    setSignal(Array.from(sig));
    drawHeatmap(Array.from(sig));
  }

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".spot-target"));
    if (!els.length) return;
    function onMove(e) {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width);
      const y = clamp(e.clientY - r.top, 0, r.height);
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      const nx = (x - r.width / 2) / (r.width / 2);
      const ny = (y - r.height / 2) / (r.height / 2);
      const dx = Math.round(nx * 10);
      const dy = Math.round(ny * 10);
      el.style.setProperty("--dx", `${dx}px`);
      el.style.setProperty("--dy", `${dy}px`);
      const ang = (Math.atan2(ny, nx) * 180 / Math.PI) + 180;
      const dir = Math.floor((ang + 22.5) / 45) % 8;
      el.setAttribute("data-dir", `dir-${dir}`);
    }
    function onEnter(e) {
      e.currentTarget.classList.add("spot-active");
    }
    function onLeave(e) {
      const el = e.currentTarget;
      el.classList.remove("spot-active");
      el.style.setProperty("--dx", "0px");
      el.style.setProperty("--dy", "0px");
      el.removeAttribute("data-dir");
    }
    els.forEach(el => {
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });
    return () => els.forEach(el => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    });
  }, []);

  function tryExample() {
    setText("ATGCTTACGGAATTCGAGCTTAGGACCTGAGGCTTAGCCTTAGGCTTAGGCTTAGGCTTAGGCTTAGGCTTAGGCT");
    setPattern("ATGACCT");
    setAllowed(1);
    setTimeout(() => runMatch(), 80);
  }

  function clearAll() {
    setText("");
    setPattern("");
    setMatches([]);
    setSignal([]);
    drawHeatmap([]);
  }

  return (
    <div className="dna-app">
      <aside className="left-panel spot-target">
        <div className="logo">DNA</div>
        <h2 className="left-title">DNA FFT MATCHER<br /><span className="small-muted">— heavily optimized FFT for large inputs</span></h2>
        <p className="lead">Fast pattern search with allowed mismatches. Heatmap visualizes strong matches as bright pink-blue spikes.</p>
        <div className="left-cta">
          <button className="btn primary" onClick={tryExample}>Try example</button>
          <button className="btn ghost" onClick={clearAll}>Clear</button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="header-row">
          <h3 className="title">Matcher</h3>
          <div className="header-actions">
            <button className="btn small ghost" onClick={clearAll}>Clear</button>
          </div>
        </header>

        <section className="form-row spot-target">
          <label className="label-accent">Text (T)</label>
          <textarea className="input text-area spot-target" value={text} onChange={e => setText(e.target.value)} placeholder="Paste long DNA sequence (A/C/G/T)" />

          <label>Pattern (P)</label>
          <input className="input spot-target" value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Pattern to search (A/C/G/T)" />

          <div className="controls">
            <div className="mismatch">Allowed mismatches: <strong>{allowed}</strong></div>
            <input type="range" min="0" max="6" value={allowed} onChange={e => setAllowed(parseInt(e.target.value))} />
            <button className="btn primary spot-target" onClick={runMatch}>Run Match</button>
          </div>
        </section>

        <section className="heat-section">
          <div className="heat-wrapper" ref={heatRef} aria-hidden="true"></div>
          <div className="heat-legend">Heatmap — brighter color = stronger match</div>
        </section>

        <section className="summary">
          <div className="stat-card spot-target"><div className="stat-head">Gene Present</div><div className="stat-val">{matches.length ? "Yes" : "No"}</div></div>
          <div className="stat-card spot-target"><div className="stat-head">Mutation Present</div><div className="stat-val">{matches.some(x => x.mismatches > 0) ? "Yes" : "No"}</div></div>
          <div className="stat-card spot-target"><div className="stat-head">Virus Marker</div><div className="stat-val">{matches.length > 1 ? "Possible" : "Unlikely"}</div></div>
          <div className="stat-card spot-target"><div className="stat-head">Variant Similarity</div><div className="stat-val">{matches.length > 2 ? "Very High" : matches.length ? "High" : "-"}</div></div>
          <div className="stat-card spot-target"><div className="stat-head">Approx. Similarity</div><div className="stat-val">{matches.length ? `${Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length * 100)}%` : "None"}</div></div>
        </section>

        <section className="match-list">
          {matches.map((m, idx) => (
            <div key={idx} className="match-box spot-target">
              <div className="meta-key">pos: <span className="meta-num">{m.pos}</span></div>
              <div className="meta-sub">mismatch: {m.mismatches}</div>
              <div className="snippet"><code>{m.snippet}</code></div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
