import React, { useEffect, useRef, useState } from "react";
import "./dna.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function popcountBigInt(x) {
  let c = 0;
  while (x) {
    x &= x - 1n;
    c++;
  }
  return c;
}

function maskToIndexes(mask, offset) {
  const res = [];
  let i = 0;
  let m = mask;
  while (m) {
    if (m & 1n) res.push(offset + i + 1);
    m >>= 1n;
    i++;
  }
  return res;
}

function computeMatchesBitap(text, pattern, allowedMismatch) {
  const n = text.length,
    m = pattern.length;
  const out = [];
  if (!m || n < m) return out;

  const pat = pattern.split("");

  for (let i = 0; i <= n - m; i++) {
    let mism = 0;
    let mask = 0n;

    for (let j = 0; j < m; j++) {
      if (text[i + j] !== pat[j]) {
        mism++;
        mask |= 1n << BigInt(j);
        if (mism > allowedMismatch) break;
      }
    }

    if (mism <= allowedMismatch) {
      const mismatchIndexes = maskToIndexes(mask, i);
      const score = (m - mism) / m;
      out.push({
        start: i + 1,
        end: i + m,
        mismatches: mism,
        mismatchIndexes,
        snippet: text.slice(i, i + m),
        score,
      });
    }
  }

  return out;
}

function buildHeatmapSignal(text, pattern) {
  const n = text.length,
    m = pattern.length;
  if (!m || n < m) return new Array(n).fill(0);
  const sig = new Array(n).fill(0);

  for (let i = 0; i <= n - m; i++) {
    let matches = 0;
    for (let j = 0; j < m; j++) if (text[i + j] === pattern[j]) matches++;
    const score = matches / m;
    for (let j = 0; j < m; j++) sig[i + j] += score;
  }

  const max = Math.max(...sig, 1e-9);
  return sig.map((s) => s / max);
}

function valueToColor(v) {
  const r1 = 255,
    g1 = 82,
    b1 = 146;
  const r2 = 160,
    g2 = 82,
    b2 = 220;
  const r3 = 92,
    g3 = 138,
    b3 = 255;

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
    const res = computeMatchesBitap(t, p, allowed);
    const sig = buildHeatmapSignal(t, p);
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

    els.forEach((el) => {
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () =>
      els.forEach((el) => {
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
          DNA BITAP MATCHER
          <br />
          <span className="small-muted">
            — bitset-based approximate DNA matcher
          </span>
        </h2>
        <p className="lead">
          Uses a bitset-style Bitap scan to find windows with limited
          mismatches. Heatmap visualizes strong matches as bright pink-blue
          spikes.
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste long DNA sequence (A/C/G/T)"
          />

          <label>Pattern (P)</label>
          <input
            className="input spot-target"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
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
              onChange={(e) => setAllowed(parseInt(e.target.value))}
            />
            <button className="btn primary spot-target" onClick={runMatch}>
              Run Match
            </button>
          </div>
        </section>

        <section className="heat-section">
          <div className="heat-wrapper" ref={heatRef} aria-hidden="true"></div>
          <div className="heat-legend">
            Heatmap — brighter color = stronger match
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
              {matches.some((x) => x.mismatches > 0) ? "Yes" : "No"}
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
