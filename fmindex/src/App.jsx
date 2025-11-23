import React, { useEffect, useRef, useState } from "react";
import "./dna.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function buildSuffixArray(text) {
  const n = text.length;
  const sa = new Array(n);
  for (let i = 0; i < n; i++) sa[i] = i;
  sa.sort((i, j) => {
    if (i === j) return 0;
    const s1 = text.slice(i);
    const s2 = text.slice(j);
    if (s1 < s2) return -1;
    if (s1 > s2) return 1;
    return 0;
  });
  return sa;
}

function compareSubstring(text, pos, pattern) {
  const n = text.length;
  const m = pattern.length;
  for (let i = 0; i < m; i++) {
    const ti = pos + i;
    if (ti >= n) return 1;
    const a = text.charCodeAt(ti);
    const b = pattern.charCodeAt(i);
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

function suffixArraySearch(text, sa, pattern) {
  const n = text.length;
  const m = pattern.length;
  if (!m) return [];

  let lo = 0, hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const cmp = compareSubstring(text, sa[mid], pattern);
    if (cmp >= 0) hi = mid;
    else lo = mid + 1;
  }
  const start = lo;

  lo = 0; hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const cmp = compareSubstring(text, sa[mid], pattern);
    if (cmp > 0) hi = mid;
    else lo = mid + 1;
  }
  const end = lo;

  const res = [];
  for (let i = start; i < end; i++) res.push(sa[i]);
  return res;
}

function computeMatchesFM(text, pattern, allowedMismatch) {
  const n = text.length;
  const m = pattern.length;
  const out = [];
  if (!m || n < m) return out;

  const sa = buildSuffixArray(text);

  const blocks = allowedMismatch + 1;
  const blockLen = Math.max(1, Math.floor(m / blocks));
  const seen = new Map();

  for (let b = 0; b < blocks; b++) {
    const startInP = b * blockLen;
    if (startInP >= m) break;
    const len = b === blocks - 1 ? m - startInP : blockLen;
    if (len <= 0) continue;
    const seed = pattern.slice(startInP, startInP + len);
    const seedPositions = suffixArraySearch(text, sa, seed);

    for (const posSeed of seedPositions) {
      const candidateStart = posSeed - startInP;
      if (candidateStart < 0 || candidateStart + m > n) continue;
      if (seen.has(candidateStart)) continue;
      seen.set(candidateStart, true);

      let mism = 0;
      const mismatchIndexes = [];
      for (let j = 0; j < m; j++) {
        if (text[candidateStart + j] !== pattern[j]) {
          mism++;
          mismatchIndexes.push(candidateStart + j + 1);
          if (mism > allowedMismatch) break;
        }
      }
      if (mism <= allowedMismatch) {
        const score = (m - mism) / m;
        out.push({
          start: candidateStart + 1,
          end: candidateStart + m,
          mismatches: mism,
          mismatchIndexes,
          snippet: text.slice(candidateStart, candidateStart + m),
          score,
        });
      }
    }
  }

  out.sort((a, b) => b.score - a.score || a.start - b.start);
  return out;
}

function buildHeatmapSignal(text, matches) {
  const n = text.length;
  const sig = new Array(n).fill(0);
  if (!n || !matches.length) return sig;
  for (const m of matches) {
    const s = m.start - 1;
    const e = m.end - 1;
    for (let i = s; i <= e && i < n; i++) sig[i] += m.score;
  }
  const max = Math.max(...sig, 1e-9);
  return sig.map(v => v / max);
}

function valueToColor(v) {
  const r1 = 255, g1 = 82, b1 = 146;
  const r2 = 160, g2 = 82, b2 = 220;
  const r3 = 92, g3 = 138, b3 = 255;
  if (v < 0.5) {
    const t = v / 0.5;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (v - 0.5) / 0.5;
    const r = Math.round(r2 + (r3 - r2) * t);
    const g = Math.round(g2 + (g3 - g2) * t);
    const b = Math.round(b2 + (b3 - b2) * t);
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

  function runMatch() {
    const t = (text || "").toUpperCase().replace(/[^ACGT]/g, "");
    const p = (pattern || "").toUpperCase().replace(/[^ACGT]/g, "");
    if (!p || !t || t.length < p.length) {
      setMatches([]);
      setSignal([]);
      drawHeatmap([]);
      return;
    }
    const res = computeMatchesFM(t, p, allowed);
    const sig = buildHeatmapSignal(t, res);
    setMatches(res);
    setSignal(sig);
    drawHeatmap(sig);
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
      const ang = (Math.atan2(ny, nx) * 180) / Math.PI + 180;
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

    return () =>
      els.forEach(el => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
  }, []);

  function tryExample() {
    setText(
      "ATGCTTACGGAATTCGAGCTTAGGACCTGAGGCTTAGCCTTAGGCTTAGGCTTAGGCTTAGGCTTAGGCTTAGGCT"
    );
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

  const avgSimilarity = matches.length
    ? Math.round(
        (matches.reduce((s, m) => s + m.score, 0) / matches.length) * 100
      )
    : 0;

  return (
    <div className="dna-app">
      <aside className="left-panel spot-target">
        <div className="logo">DNA</div>
        <h2 className="left-title">
          DNA FM-INDEX MATCHER
          <br />
          <span className="small-muted">
            — suffix-array style seed + backtrack
          </span>
        </h2>
        <p className="lead">
          Demonstrates the idea behind FM-index / suffix-array + backtracking:
          use seeded exact hits to find candidate alignments, then verify
          mismatches. Real FM-index engines scale to huge genomes with compressed
          disk-backed indexes.
        </p>
        <div className="left-cta">
          <button className="btn primary" onClick={tryExample}>
            Try example
          </button>
          <button className="btn ghost" onClick={clearAll}>
            Clear
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="header-row">
          <h3 className="title">Matcher</h3>
          <div className="header-actions">
            <button className="btn small ghost" onClick={clearAll}>
              Clear
            </button>
          </div>
        </header>

        <section className="form-row spot-target">
          <label className="label-accent">Text (T)</label>
          <textarea
            className="input text-area spot-target"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste long DNA sequence (A/C/G/T)"
          />

          <label>Pattern (P)</label>
          <input
            className="input spot-target"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="Pattern to search (A/C/G/T)"
          />

          <div className="controls">
            <div className="mismatch">
              Allowed mismatches: <strong>{allowed}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              value={allowed}
              onChange={e => setAllowed(parseInt(e.target.value))}
            />
            <button className="btn primary spot-target" onClick={runMatch}>
              Run Match
            </button>
          </div>
        </section>

        <section className="heat-section">
          <div className="heat-wrapper" ref={heatRef} aria-hidden="true"></div>
          <div className="heat-legend">
            Heatmap — brighter color = stronger seeded alignment density
          </div>
        </section>

        <section className="summary">
          <div className="stat-card spot-target">
            <div className="stat-head">Gene Present</div>
            <div className="stat-val">{matches.length ? "Yes" : "No"}</div>
          </div>
          <div className="stat-card spot-target">
            <div className="stat-head">Mutation Present</div>
            <div className="stat-val">
              {matches.some(x => x.mismatches > 0) ? "Yes" : "No"}
            </div>
          </div>
          <div className="stat-card spot-target">
            <div className="stat-head">Virus Marker</div>
            <div className="stat-val">
              {matches.length > 1 ? "Possible" : "Unlikely"}
            </div>
          </div>
          <div className="stat-card spot-target">
            <div className="stat-head">Variant Similarity</div>
            <div className="stat-val">
              {matches.length > 2 ? "Very High" : matches.length ? "High" : "-"}
            </div>
          </div>
          <div className="stat-card spot-target">
            <div className="stat-head">Approx. Similarity</div>
            <div className="stat-val">
              {matches.length ? `${avgSimilarity}%` : "None"}
            </div>
          </div>
        </section>

        <section className="match-list">
          {matches.map((m, idx) => (
            <div key={idx} className="match-box spot-target">
              <div className="meta-key">
                pos:{" "}
                {m.mismatchIndexes.length
                  ? m.mismatchIndexes.join(", ")
                  : "no mismatch"}
              </div>
              <div className="meta-sub">
                mismatches: {m.mismatches} | window: {m.start} → {m.end}
              </div>
              <div className="snippet">
                <code>{m.snippet}</code>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
