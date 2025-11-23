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

function smithWaterman(text, pattern, maxLen, maxHits) {
  const n = text.length, m = pattern.length;
  if (!n || !m) return [];

  const matchScore = 2;
  const misScore = -1;
  const gapScore = -2;

  const cols = n + 1;
  const H = new Int16Array((m + 1) * cols);
  const cells = [];

  let best = 0;

  for (let i = 1; i <= m; i++) {
    const pi = pattern.charCodeAt(i - 1);
    const rowOffset = i * cols;
    const prevRowOffset = (i - 1) * cols;
    for (let j = 1; j <= n; j++) {
      const tj = text.charCodeAt(j - 1);
      const diag = H[prevRowOffset + (j - 1)] + (pi === tj ? matchScore : misScore);
      const up = H[prevRowOffset + j] + gapScore;
      const left = H[rowOffset + (j - 1)] + gapScore;
      let val = diag;
      if (up > val) val = up;
      if (left > val) val = left;
      if (val < 0) val = 0;
      H[rowOffset + j] = val;
      if (val > 0) {
        if (val > best) best = val;
        cells.push({ i, j, val });
      }
    }
  }

  if (!best) return [];

  cells.sort((a, b) => b.val - a.val);

  const hits = [];
  const used = new Set();

  for (const { i: si, j: sj, val } of cells) {
    if (!val || hits.length >= maxHits) break;

    let i = si;
    let j = sj;
    let score = val;
    let end = j;
    let aligned = 0;
    let mismatches = 0;
    const mismatchIndexes = [];

    while (i > 0 && j > 0) {
      const idx = i * cols + j;
      const curr = H[idx];
      if (curr === 0 || aligned >= maxLen) break;

      const pi = pattern.charCodeAt(i - 1);
      const tj = text.charCodeAt(j - 1);

      const diagIdx = (i - 1) * cols + (j - 1);
      const upIdx = (i - 1) * cols + j;
      const leftIdx = i * cols + (j - 1);

      const diagVal = H[diagIdx];
      const upVal = H[upIdx];
      const leftVal = H[leftIdx];

      const matchMisScore = pi === tj ? matchScore : misScore;

      if (curr === diagVal + matchMisScore) {
        if (pi !== tj) {
          mismatches++;
          mismatchIndexes.push(j);
        }
        i--;
        j--;
        aligned++;
      } else if (curr === upVal + gapScore) {
        mismatches++;
        i--;
        aligned++;
      } else if (curr === leftVal + gapScore) {
        mismatches++;
        mismatchIndexes.push(j);
        j--;
        aligned++;
      } else {
        break;
      }
    }

    const start = j + 1;
    if (end - start + 1 < 1) continue;

    const key = `${start}-${end}`;
    if (used.has(key)) continue;
    used.add(key);

    const snippet = text.slice(start - 1, end);
    const normDen = matchScore * Math.max(1, end - start + 1);
    const normScore = Math.max(0, score) / normDen;

    hits.push({
      start,
      end,
      mismatches,
      mismatchIndexes: mismatchIndexes.reverse(),
      snippet,
      score: normScore
    });
  }

  hits.sort((a, b) => b.score - a.score || a.start - b.start);
  return hits;
}

export default function App() {
  const [text, setText] = useState("");
  const [pattern, setPattern] = useState("");
  const [maxLen, setMaxLen] = useState(40);
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

    if (!t || !p) {
      setMatches([]);
      drawHeat([]);
      return;
    }

    const hits = smithWaterman(t, p, maxLen, 16);
    setMatches(hits);
    drawHeat(buildHeatFromMatches(t, hits));
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

    function onEnter(e) {
      e.currentTarget.classList.add("spot-active");
    }

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
    setMaxLen(30);
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
      <aside className="left-panel spot-target">
        <div className="logo">DNA</div>
        <h2 className="left-title">
          DNA SMITH–WATERMAN MATCHER
          <br />
          <span className="small-muted">
            — local alignment with gaps & mismatches
          </span>
        </h2>
        <p className="lead">
          Finds high-scoring local alignments between a DNA pattern and a long
          sequence, allowing mismatches and gaps. Heatmap highlights strong
          alignments as bright pink-blue spikes.
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
            placeholder="Pattern to align (A/C/G/T)"
          />

          <div className="controls">
            <div className="mismatch">
              Max alignment length: <strong>{maxLen}</strong>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              value={maxLen}
              onChange={e => setMaxLen(parseInt(e.target.value))}
            />
            <button className="btn primary spot-target" onClick={runMatch}>
              Run Match
            </button>
          </div>
        </section>

        <section className="heat-section">
          <div className="heat-wrapper" ref={heatRef} aria-hidden="true" />
          <div className="heat-legend">
            Heatmap — brighter color = stronger local alignment
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
