import { useState, useRef, useCallback, useEffect } from "react";

/* ══════ CONSTANTS ══════ */
const uid = () => Math.random().toString(36).slice(2, 9);
const CARD_W = 164;
const CARD_H = 64;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const FONT = "'Public Sans', 'Segoe UI', system-ui, sans-serif";
const SAVE_KEY = "wfm-autosave";

const COLORS = [
  { key: "blue",   bg: "#e8f0fe", border: "#4285f4", text: "#1a56db" },
  { key: "green",  bg: "#e6f4ea", border: "#34a853", text: "#137333" },
  { key: "amber",  bg: "#fef7e0", border: "#f9ab00", text: "#8a6d00" },
  { key: "red",    bg: "#fce8e6", border: "#ea4335", text: "#b42318" },
  { key: "purple", bg: "#f3e8fd", border: "#a142f4", text: "#7627bb" },
  { key: "gray",   bg: "#f1f3f4", border: "#9aa0a6", text: "#5f6368" },
];

const C = {
  bg: "#f8fafb",
  surface: "#ffffff",
  surfaceSoft: "#f1f4f7",
  border: "#dce1e6",
  borderStrong: "#b8c1cc",
  text: "#1a1f25",
  textMuted: "#5f6b7a",
  textFaint: "#8d97a5",
  accent: "#4285f4",
  accentSoft: "rgba(66,133,244,0.1)",
  red: "#ea4335",
  redSoft: "#fce8e6",
};

/* ══════ GLOBAL CSS ══════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap');
  .wfm * { box-sizing: border-box; }
  .wfm-card { transition: box-shadow 0.15s ${EASE}, transform 0.12s ${EASE}; }
  .wfm-card:hover:not(.dragging) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04) !important; }
  .wfm-btn { transition: all 0.15s ${EASE}; }
  .wfm-btn:hover:not(:disabled) { background: ${C.surfaceSoft} !important; border-color: ${C.borderStrong} !important; }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  .wfm-new { animation: fadeIn 0.25s ${EASE}; }
  .wfm-scrollbar::-webkit-scrollbar { width: 8px; }
  .wfm-scrollbar::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
`;

/* ══════ FACTORIES ══════ */
function makeCard(x, y) {
  return { id: uid(), x, y, title: "", desc: "", color: "blue", createdAt: Date.now() };
}

function makeDefault() {
  const cards = [
    { ...makeCard(140, 200), title: "Identify Stakeholders" },
    { ...makeCard(380, 200), title: "Gather Requirements" },
    { ...makeCard(380, 330), title: "Define Success Criteria" },
    { ...makeCard(620, 265), title: "Build Prototype" },
    { ...makeCard(860, 200), title: "Test & Validate", color: "amber" },
    { ...makeCard(860, 330), title: "Deploy", color: "green" },
  ];
  const conns = [
    { id: uid(), from: cards[0].id, to: cards[1].id, label: "" },
    { id: uid(), from: cards[1].id, to: cards[3].id, label: "" },
    { id: uid(), from: cards[2].id, to: cards[3].id, label: "" },
    { id: uid(), from: cards[3].id, to: cards[4].id, label: "" },
    { id: uid(), from: cards[4].id, to: cards[5].id, label: "approved" },
    { id: uid(), from: cards[4].id, to: cards[3].id, label: "iterate" },
  ];
  return { title: "Untitled Workflow", cards, conns, notes: [] };
}

/* ══════ HELPERS ══════ */
function bezierPath(x1, y1, x2, y2, fromSide, toSide) {
  const off = (side, d) => {
    const m = Math.max(Math.abs(d) * 0.5, 30);
    return side === "r" ? m : side === "l" ? -m : 0;
  };
  const offY = (side, d) => {
    const m = Math.max(Math.abs(d) * 0.5, 30);
    return side === "b" ? m : side === "t" ? -m : 0;
  };
  const fs = fromSide || "r";
  const ts = toSide || "l";
  return `M${x1},${y1} C${x1 + off(fs, x2 - x1)},${y1 + offY(fs, y2 - y1)} ${x2 + off(ts, x2 - x1)},${y2 + offY(ts, y2 - y1)} ${x2},${y2}`;
}

function cardEdge(fp, tp) {
  const GAP = 6;
  const ports = (p) => ({
    r: { x: p.x + CARD_W + GAP, y: p.y + CARD_H / 2, side: "r" },
    l: { x: p.x - GAP, y: p.y + CARD_H / 2, side: "l" },
    b: { x: p.x + CARD_W / 2, y: p.y + CARD_H + GAP, side: "b" },
    t: { x: p.x + CARD_W / 2, y: p.y - GAP, side: "t" },
  });
  const fP = ports(fp);
  const tP = ports(tp);
  const dx = tp.x - fp.x;
  const dy = tp.y - fp.y;
  let fk, tk;
  if (Math.abs(dx) > Math.abs(dy)) { fk = dx > 0 ? "r" : "l"; tk = dx > 0 ? "l" : "r"; }
  else { fk = dy > 0 ? "b" : "t"; tk = dy > 0 ? "t" : "b"; }
  // Fallback if ports would double-back
  const f = fP[fk], t = tP[tk];
  const bad = (fk === "r" && t.x < f.x) || (fk === "l" && t.x > f.x) || (fk === "b" && t.y < f.y) || (fk === "t" && t.y > f.y);
  if (bad) {
    let best = null, bestD = Infinity;
    for (const a of Object.values(fP)) for (const b of Object.values(tP)) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bestD) { bestD = d; best = [a, b]; }
    }
    return best;
  }
  return [f, t];
}

/* ══════ COMPONENTS ══════ */
function Btn({ children, active, disabled, onClick, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className="wfm-btn" style={{
      background: active ? C.accent : C.surface,
      border: `1.5px solid ${active ? C.accent : C.border}`,
      color: active ? "#fff" : disabled ? C.textFaint : C.text,
      padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT,
      boxShadow: active ? `0 2px 8px ${C.accentSoft}` : "none",
    }}>{children}</button>
  );
}

function Sep() { return <div style={{ width: 1, height: 22, background: C.border, margin: "0 4px" }} />; }

/* ══════ MAIN ══════ */
export default function WorkflowMapper() {
  // Load from localStorage or use default
  const loadState = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return makeDefault();
  };

  const [data, setDataRaw] = useState(loadState);
  const [drag, setDrag] = useState(null);
  const [sel, setSel] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [editingTitle, setEditingTitle] = useState(null);
  const [editNote, setEditNote] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panAnchor, setPanAnchor] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [selConn, setSelConn] = useState(null);
  const [connLabel, setConnLabel] = useState("");
  const [tbPos, setTbPos] = useState({ x: 0, y: 12 });
  const [tbDrag, setTbDrag] = useState(null);
  const canvasRef = useRef(null);
  const tbRef = useRef(null);
  const toastTimer = useRef(null);

  const { title, cards, conns, notes } = data;

  // Auto-save on every change
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }, [data]);

  const setData = (fn) => setDataRaw(prev => {
    const next = typeof fn === "function" ? fn(prev) : fn;
    return next;
  });

  const snap = () => setHistory(h => [...h.slice(-30), JSON.parse(JSON.stringify(data))]);

  const undo = () => {
    if (!history.length) return;
    setDataRaw(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    showT("Undone");
  };

  const showT = (m) => {
    clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const toCanvas = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y };
  }, [zoom, pan]);

  const cardPos = (card) => ({ x: card.x, y: card.y });

  // Drag
  const startDrag = (e, id, isNote) => {
    if (linking) return;
    e.stopPropagation();
    snap();
    const item = isNote ? notes.find(n => n.id === id) : cards.find(c => c.id === id);
    if (!item) return;
    const p = toCanvas(e);
    setDrag({ id, ox: p.x - item.x, oy: p.y - item.y, isNote });
  };

  const onMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const p = toCanvas(e);
    setMouse(p);
    if (panning && panAnchor) {
      setPan(pr => ({ x: pr.x + (e.clientX - panAnchor.x) / zoom, y: pr.y + (e.clientY - panAnchor.y) / zoom }));
      setPanAnchor({ x: e.clientX, y: e.clientY });
      return;
    }
    if (drag) {
      const nx = p.x - drag.ox, ny = p.y - drag.oy;
      if (drag.isNote) {
        setData(d => ({ ...d, notes: d.notes.map(n => n.id === drag.id ? { ...n, x: nx, y: ny } : n) }));
      } else {
        setData(d => ({ ...d, cards: d.cards.map(c => c.id === drag.id ? { ...c, x: nx, y: ny } : c) }));
      }
    }
  }, [drag, panning, panAnchor, zoom, toCanvas]);

  const onUp = useCallback(() => { setDrag(null); setPanning(false); setPanAnchor(null); }, []);

  useEffect(() => {
    if (!drag && !panning) return;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, panning, onMove, onUp]);

  // Double-click canvas → new card
  const onDblClick = (e) => {
    if (e.target.closest(".card-el") || e.target.closest(".toolbar") || e.target.closest(".panel")) return;
    const p = toCanvas(e);
    snap();
    const nc = makeCard(p.x - CARD_W / 2, p.y - CARD_H / 2);
    setData(d => ({ ...d, cards: [...d.cards, nc] }));
    setSel(nc.id);
    setEditingTitle(nc.id);
    showT("Double-click to name it");
  };

  // Card click
  const onCardClick = (e, id) => {
    e.stopPropagation();
    if (linking) {
      if (!linkFrom) { setLinkFrom(id); showT("Now click the target"); }
      else if (linkFrom !== id) {
        if (!conns.some(c => c.from === linkFrom && c.to === id)) {
          snap();
          setData(d => ({ ...d, conns: [...d.conns, { id: uid(), from: linkFrom, to: id, label: "" }] }));
          showT("Connected");
        }
        setLinkFrom(null);
      }
      return;
    }
    setSel(id);
    setSelConn(null);
  };

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
      if (e.key === "Escape") { setSel(null); setLinking(false); setLinkFrom(null); setEditingTitle(null); setSelConn(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && sel && !editingTitle) {
        const el = document.activeElement;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
        snap();
        setData(d => ({
          ...d,
          cards: d.cards.filter(c => c.id !== sel),
          conns: d.conns.filter(c => c.from !== sel && c.to !== sel),
        }));
        setSel(null);
        showT("Deleted");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sel, editingTitle, history]);

  // Toolbar drag
  useEffect(() => {
    if (!tbDrag) return;
    const move = (e) => setTbPos({ x: tbDrag.sx + (e.clientX - tbDrag.ax), y: Math.max(0, tbDrag.sy + (e.clientY - tbDrag.ay)) });
    const up = () => setTbDrag(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [tbDrag]);

  // Export / Import
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `workflow-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showT("Exported");
  };

  const importJSON = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json";
    inp.onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (d.cards) { snap(); setDataRaw(d); setSel(null); showT("Imported!"); }
        } catch { showT("Invalid file"); }
      };
      r.readAsText(f);
    };
    inp.click();
  };

  const newBoard = () => { snap(); setDataRaw(makeDefault()); setSel(null); showT("New board"); };

  const selCard = cards.find(c => c.id === sel);

  return (
    <div className="wfm" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", fontFamily: FONT, color: C.text, background: C.bg, overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* TITLE BAR */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "8px 20px",
        background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <input
          value={title}
          onChange={(e) => setData(d => ({ ...d, title: e.target.value }))}
          placeholder="Workflow name…"
          style={{ border: "none", background: "transparent", fontSize: 18, fontWeight: 700, color: C.text, outline: "none", flex: 1, minWidth: 100, fontFamily: FONT }}
        />
        <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{cards.length} cards · {conns.length} links</span>
      </div>

      {/* CANVAS */}
      <div
        ref={canvasRef}
        onMouseDown={(e) => {
          if (e.target.closest(".card-el") || e.target.closest(".toolbar") || e.target.closest(".panel")) return;
          if (!linking) { setPanning(true); setPanAnchor({ x: e.clientX, y: e.clientY }); }
          if (!e.target.closest(".card-el") && !e.target.closest(".panel")) { setSel(null); setSelConn(null); }
        }}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onDoubleClick={onDblClick}
        onWheel={(e) => { e.preventDefault(); setZoom(z => Math.min(3, Math.max(0.2, z - e.deltaY * 0.001))); }}
        style={{
          flex: 1, overflow: "hidden", position: "relative",
          cursor: panning ? "grabbing" : linking ? "crosshair" : "default",
          backgroundImage: `linear-gradient(${C.border}33 1px, transparent 1px), linear-gradient(90deg, ${C.border}33 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
        }}
      >
        {/* FLOATING TOOLBAR */}
        <div ref={tbRef} className="toolbar" style={{
          position: "absolute", top: tbPos.y, left: tbPos.x === 0 ? "50%" : tbPos.x,
          transform: tbPos.x === 0 ? "translateX(-50%)" : "none",
          zIndex: 200, display: "flex", alignItems: "center", gap: 5,
          padding: "6px 8px 6px 0", background: C.surface, border: `1.5px solid ${C.border}`,
          borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,0.10)", userSelect: "none",
        }}>
          {/* Drag handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault(); e.stopPropagation();
              const rect = tbRef.current.getBoundingClientRect();
              const cRect = canvasRef.current.getBoundingClientRect();
              setTbPos({ x: rect.left, y: rect.top - cRect.top });
              setTbDrag({ ax: e.clientX, ay: e.clientY, sx: rect.left, sy: rect.top - cRect.top });
            }}
            style={{ width: 24, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: C.textFaint, borderRadius: "10px 0 0 10px" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textFaint; }}
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1.2"/><circle cx="4.5" cy="1.5" r="1.2"/>
              <circle cx="1.5" cy="5" r="1.2"/><circle cx="4.5" cy="5" r="1.2"/>
              <circle cx="1.5" cy="8.5" r="1.2"/><circle cx="4.5" cy="8.5" r="1.2"/>
            </svg>
          </div>
          <Btn title="Add a new card (or double-click canvas)" onClick={() => {
            snap();
            const nc = makeCard(-pan.x + 300, -pan.y + 200);
            setData(d => ({ ...d, cards: [...d.cards, nc] }));
            setSel(nc.id); setEditingTitle(nc.id);
          }}>+ Card</Btn>
          <Btn active={linking} title="Connect two cards" onClick={() => { setLinking(!linking); setLinkFrom(null); }}>
            {linking ? "⟶ Pick cards…" : "↗ Connect"}
          </Btn>
          <Btn title="Add a sticky note" onClick={() => {
            snap();
            const n = { id: uid(), x: -pan.x + 350, y: -pan.y + 250, text: "" };
            setData(d => ({ ...d, notes: [...d.notes, n] }));
            setEditNote(n.id);
          }}>✎ Note</Btn>
          <Sep />
          <Btn onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">↩</Btn>
          <Btn onClick={newBoard} title="New blank board">New</Btn>
          <Sep />
          <Btn onClick={exportJSON} title="Save as JSON">↓ Save</Btn>
          <Btn onClick={importJSON} title="Load a JSON file">↑ Load</Btn>
          <Sep />
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontSize: 14, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <span style={{ fontSize: 11, color: C.textMuted, minWidth: 36, textAlign: "center", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontSize: 14, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        {/* ZOOM CONTAINER */}
        <div style={{ transform: `scale(${zoom}) translate(${pan.x}px,${pan.y}px)`, transformOrigin: "0 0", position: "relative", width: 4000, height: 3000 }}>

          {/* ARROWS */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: 4000, height: 3000, pointerEvents: "none", zIndex: 1 }}>
            <defs>
              <marker id="ah" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={C.textMuted} />
              </marker>
              <marker id="ah-sel" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={C.accent} />
              </marker>
              <marker id="ah-ghost" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={C.accent} opacity="0.4" />
              </marker>
            </defs>
            {conns.map((conn) => {
              const f = cards.find(c => c.id === conn.from);
              const t = cards.find(c => c.id === conn.to);
              if (!f || !t) return null;
              const [fp, tp] = cardEdge(f, t);
              const isSel = selConn === conn.id;
              const d = bezierPath(fp.x, fp.y, tp.x, tp.y, fp.side, tp.side);
              const mx = (fp.x + tp.x) / 2, my = (fp.y + tp.y) / 2;
              return (
                <g key={conn.id} style={{ pointerEvents: "auto", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setSelConn(isSel ? null : conn.id); setConnLabel(conn.label || ""); setSel(null); }}>
                  <path d={d} stroke="transparent" fill="none" strokeWidth={16} />
                  <path d={d} stroke={isSel ? C.accent : C.textMuted} fill="none" strokeWidth={isSel ? 2.5 : 1.8} strokeLinecap="round" markerEnd={isSel ? "url(#ah-sel)" : "url(#ah)"} opacity={isSel ? 1 : 0.5} />
                  {conn.label && (
                    <g>
                      <rect x={mx - conn.label.length * 3.2 - 6} y={my - 9} width={conn.label.length * 6.4 + 12} height={18} rx={9} fill={C.surface} stroke={isSel ? C.accent : C.border} strokeWidth={1} />
                      <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fontWeight="600" fill={isSel ? C.accent : C.textMuted} fontFamily={FONT}>{conn.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {linking && linkFrom && (() => {
              const f = cards.find(c => c.id === linkFrom);
              if (!f) return null;
              return <path d={`M${f.x + CARD_W / 2},${f.y + CARD_H / 2} L${mouse.x},${mouse.y}`} stroke={C.accent} fill="none" strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#ah-ghost)" opacity={0.5} />;
            })()}
          </svg>

          {/* CARDS */}
          {cards.map((card) => {
            const isSel = sel === card.id;
            const isLinkSrc = linkFrom === card.id;
            const col = COLORS.find(c => c.key === card.color) || COLORS[0];
            const isEditing = editingTitle === card.id;
            const isNew = card.createdAt && Date.now() - card.createdAt < 400;
            return (
              <div
                key={card.id}
                className={`card-el wfm-card ${drag?.id === card.id ? "dragging" : ""} ${isNew ? "wfm-new" : ""}`}
                onMouseDown={(e) => startDrag(e, card.id, false)}
                onClick={(e) => onCardClick(e, card.id)}
                onDoubleClick={(e) => { e.stopPropagation(); if (!linking) setEditingTitle(card.id); }}
                style={{
                  position: "absolute", left: card.x, top: card.y, width: CARD_W, height: CARD_H,
                  background: col.bg, border: `1.5px solid ${isSel ? C.accent : isLinkSrc ? C.accent : col.border}`,
                  borderLeft: `4px solid ${col.border}`,
                  borderRadius: 10, padding: "8px 12px",
                  cursor: linking ? "crosshair" : "grab", userSelect: "none",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  boxShadow: isSel
                    ? `0 0 0 2px ${C.accentSoft}, 0 8px 20px rgba(0,0,0,0.08)`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  zIndex: drag?.id === card.id ? 50 : isSel ? 10 : 2,
                  opacity: drag?.id === card.id ? 0.9 : 1,
                }}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={card.title}
                    onChange={(e) => setData(d => ({ ...d, cards: d.cards.map(c => c.id === card.id ? { ...c, title: e.target.value } : c) }))}
                    onBlur={() => setEditingTitle(null)}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingTitle(null); }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Card name…"
                    style={{ background: "transparent", border: "none", borderBottom: `2px solid ${C.accent}`, fontWeight: 700, fontSize: 13, color: C.text, outline: "none", width: "100%", fontFamily: FONT }}
                  />
                ) : (
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: card.title ? col.text : C.textFaint }}>
                    {card.title || "Double-click to name…"}
                  </div>
                )}
                {card.desc && (
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.desc}</div>
                )}
              </div>
            );
          })}

          {/* NOTES */}
          {notes.map((note) => {
            const isEditing = editNote === note.id;
            return (
              <div
                key={note.id}
                className="card-el"
                onMouseDown={(e) => { if (!isEditing) startDrag(e, note.id, true); }}
                onDoubleClick={(e) => { e.stopPropagation(); setEditNote(note.id); }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute", left: note.x, top: note.y,
                  minWidth: 100, maxWidth: 240, minHeight: 36,
                  background: "#fff9e6", border: "1.5px solid #f0d96044", borderRadius: 8,
                  padding: "6px 10px", cursor: isEditing ? "text" : "grab", zIndex: 3,
                  boxShadow: "0 2px 8px rgba(180,150,0,0.08)",
                  fontFamily: FONT, fontSize: 11, color: C.text, lineHeight: 1.5,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}
              >
                {isEditing ? (
                  <textarea
                    autoFocus value={note.text}
                    onChange={(e) => setData(d => ({ ...d, notes: d.notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n) }))}
                    onBlur={() => { setEditNote(null); if (!note.text.trim()) setData(d => ({ ...d, notes: d.notes.filter(n => n.id !== note.id) })); }}
                    onKeyDown={(e) => { if (e.key === "Escape") e.target.blur(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Type a note…"
                    style={{ background: "transparent", border: "none", outline: "none", resize: "both", width: "100%", minHeight: 30, fontFamily: FONT, fontSize: 11, color: C.text, lineHeight: 1.5, padding: 0 }}
                  />
                ) : (
                  <>
                    <div>{note.text || "Double-click to edit…"}</div>
                    <button onClick={(e) => { e.stopPropagation(); snap(); setData(d => ({ ...d, notes: d.notes.filter(n => n.id !== note.id) })); showT("Note removed"); }}
                      style={{ position: "absolute", top: 2, right: 4, background: "none", border: "none", color: "#c4a000", fontSize: 12, cursor: "pointer", opacity: 0.4, padding: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.4; }}
                    >×</button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* CONNECTION EDITOR */}
        {selConn && (() => {
          const conn = conns.find(c => c.id === selConn);
          if (!conn) return null;
          return (
            <div className="panel" onClick={(e) => e.stopPropagation()} style={{
              position: "absolute", top: 60, right: 16, zIndex: 250,
              background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12,
              padding: 14, width: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontFamily: FONT,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Connection</div>
              <input
                value={connLabel} onChange={(e) => setConnLabel(e.target.value)}
                onBlur={() => setData(d => ({ ...d, conns: d.conns.map(c => c.id === selConn ? { ...c, label: connLabel } : c) }))}
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                placeholder="Label (optional)"
                style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", marginBottom: 10, background: C.surfaceSoft }}
              />
              <button onClick={() => { snap(); setData(d => ({ ...d, conns: d.conns.filter(c => c.id !== selConn) })); setSelConn(null); showT("Removed"); }}
                style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1.5px solid ${C.red}`, background: C.redSoft, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
                Delete Connection
              </button>
            </div>
          );
        })()}

        {/* TOAST */}
        {toast && (
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "8px 20px", borderRadius: 50, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 300, pointerEvents: "none", animation: `toastIn 0.2s ${EASE}` }}>{toast}</div>
        )}
      </div>

      {/* RIGHT PANEL — card detail */}
      {selCard && (
        <div className="panel wfm-scrollbar" style={{
          position: "absolute", top: 50, right: 16, width: 280, maxHeight: "calc(100vh - 80px)",
          background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
          padding: 16, zIndex: 200, boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
          fontFamily: FONT, display: "flex", flexDirection: "column", gap: 12, overflow: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>Card Details</span>
            <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Title</span>
            <input value={selCard.title} onChange={(e) => setData(d => ({ ...d, cards: d.cards.map(c => c.id === sel ? { ...c, title: e.target.value } : c) }))}
              style={{ padding: "8px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: "none", fontWeight: 600, background: C.surfaceSoft }}
              placeholder="Card name…" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Description</span>
            <textarea value={selCard.desc || ""} onChange={(e) => setData(d => ({ ...d, cards: d.cards.map(c => c.id === sel ? { ...c, desc: e.target.value } : c) }))}
              rows={3} style={{ padding: "8px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: FONT, outline: "none", resize: "vertical", lineHeight: 1.5, background: C.surfaceSoft }}
              placeholder="What does this step do?" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Color</span>
            <div style={{ display: "flex", gap: 6 }}>
              {COLORS.map(c => (
                <button key={c.key} onClick={() => setData(d => ({ ...d, cards: d.cards.map(cd => cd.id === sel ? { ...cd, color: c.key } : cd) }))}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: `2px solid ${selCard.color === c.key ? c.border : "transparent"}`,
                    background: c.bg, cursor: "pointer", transition: `border 0.1s`,
                  }} />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: C.border }} />

          <button onClick={() => { snap(); setData(d => ({ ...d, cards: d.cards.filter(c => c.id !== sel), conns: d.conns.filter(c => c.from !== sel && c.to !== sel) })); setSel(null); showT("Deleted"); }}
            style={{ padding: "8px", borderRadius: 8, border: `1.5px solid ${C.red}`, background: C.redSoft, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
            Delete Card
          </button>
        </div>
      )}
    </div>
  );
}
