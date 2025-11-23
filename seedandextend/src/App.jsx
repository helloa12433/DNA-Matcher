import React, { useEffect, useRef, useState } from "react";
import "./dna.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const normalizeDNA = s =>
  (s || "").toUpperCase().replace(/[^ACGT]/g, "");

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

function buildHeatFromMatches(text, matches) {
  const n = text.length;
  const sig = new Array(n).fill(0);
  if (!n || !matches.length) return sig;
  for (const m of matches) {
    const s = m.start - 1;
    const e = m.end - 1;
    for (let i = s; i <= e && i < n; i++) sig[i] += m.score;
  }
  const mx = Math.max(...sig, 1e-9);
  return sig.map(v => v / mx);
}

// Optimized seed+extend:
// 1) Build seed index over text (length seedLen).
// 2) For each seed position in pattern, fetch hits, compute candidate start.
// 3) Verify with mismatches <= maxMismatch.
// 4) Use seen set to avoid duplicate candidates.
function seedAndExtend(text, pattern, seedLen, maxMismatch, maxHits = 1000) {
  const n = text.length, m = pattern.length;
  if (!n || !m || seedLen <= 0 || seedLen > m) return [];

  const index = new Map();
  const limit = n - seedLen + 1;

  for (let i = 0; i < limit; i++) {
    const seed = text.slice(i, i + seedLen);
    let arr = index.get(seed);
    if (!arr) {
      arr = [];
      index.set(seed, arr);
    }
    arr.push(i);
  }

  const seen = new Set();
  const out = [];

  const stride = Math.max(1, Math.floor(seedLen / 2)); // spaced seeds
  for (let s = 0; s <= m - seedLen; s += stride) {
    const seed = pattern.slice(s, s + seedLen);
    const hits = index.get(seed);
    if (!hits) continue;

    for (let p of hits) {
      const start = p - s;
      if (start < 0 || start + m > n) continue;
      if (seen.has(start)) continue;
      seen.add(start);

      let mism = 0;
      const mismatchIndexes = [];
      for (let j = 0; j < m; j++) {
        if (text[start + j] !== pattern[j]) {
          mism++;
          mismatchIndexes.push(start + j + 1); // 1-based
          if (mism > maxMismatch) break;
        }
      }
      if (mism <= maxMismatch) {
        const score = (m - mism) / m;
        out.push({
          start: start + 1,
          end: start + m,
          mismatches: mism,
          mismatchIndexes,
          snippet: text.slice(start, start + m),
          score
        });
        if (out.length >= maxHits) break;
      }
    }
    if (out.length >= maxHits) break;
  }

  out.sort((a, b) => b.score - a.score || a.start - b.start);
  return out;
}

export default function App() {
  const [text, setText] = useState("");
  const [pattern, setPattern] = useState("");
  const [seedLen, setSeedLen] = useState(4);
  const [allowed, setAllowed] = useState(1);
  const [matches, setMatches] = useState([]);
  const heatRef = useRef(null);

  function drawHeat(sig) {
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
    const t = normalizeDNA(text);
    const p = normalizeDNA(pattern);

    if (!t || !p || t.length < p.length || p.length < seedLen) {
      setMatches([]);
      drawHeat([]);
      return;
    }

    const res = seedAndExtend(t, p, seedLen, allowed, 200);
    setMatches(res);
    drawHeat(buildHeatFromMatches(t, res));
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
    }

    function onEnter(e) { e.currentTarget.classList.add("spot-active"); }
    function onLeave(e) {
      const el = e.currentTarget;
      el.classList.remove("spot-active");
      el.style.setProperty("--dx", "0px");
      el.style.setProperty("--dy", "0px");
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
    setSeedLen(3);
    setAllowed(1);
    setTimeout(() => runMatch(), 80);
  }

  function clearAll() {
    setText("");
    setPattern("");
    setMatches([]);
    drawHeat([]);
  }

  const avgSimilarity = matches.length
    ? Math.round(
        (matches.reduce((s, m) => s + m.score, 0) / matches.length) * 100
      )
    : 0;

  return (
    <div className="dna-app">
      {/* LEFT PANEL */}
      <aside className="left-panel spot-target">
        <div className="logo">DNA</div>
        <h2 className="left-title">
          DNA SEED+EXTEND MATCHER
          <br />
          <span className="small-muted">
            — BLAST-style seeds with fast verify
          </span>
        </h2>
        <p className="lead">
          Indexes fixed-length seeds over the DNA text and then extends matching
          regions while counting mismatches. Reports exact mismatch indices and
          visualizes strong hits as bright pink-blue spikes.
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

      {/* MAIN PANEL */}
      <main className="main-panel">
        <header className="header-row">
          <h3 className="title">Matcher</h3>
          <div className="header-actions">
            <button className="btn small ghost" onClick={clearAll}>
              Clear
            </button>
          </div>
        </header>

        {/* FORM */}
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
            <div className="mismatch">
              Seed length: <strong>{seedLen}</strong>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              value={seedLen}
              onChange={e => setSeedLen(parseInt(e.target.value))}
            />
            <button className="btn primary spot-target" onClick={runMatch}>
              Run Match
            </button>
          </div>
        </section>

        {/* HEATMAP */}
        <section className="heat-section">
          <div className="heat-wrapper" ref={heatRef} aria-hidden="true" />
          <div className="heat-legend">
            Heatmap — brighter color = stronger seed hits + extensions
          </div>
        </section>

        {/* 5 SUMMARY CARDS */}
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
              {matches.length > 2
                ? "Very High"
                : matches.length
                ? "High"
                : "-"}
            </div>
          </div>
          <div className="stat-card spot-target">
            <div className="stat-head">Approx. Similarity</div>
            <div className="stat-val">
              {matches.length ? `${avgSimilarity}%` : "None"}
            </div>
          </div>
        </section>

        {/* MATCH LIST */}
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
