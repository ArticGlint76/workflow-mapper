import { useState, useRef, useCallback, useEffect } from "react";

/* ══════ CONSTANTS ══════ */
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];

/* BSWH-inspired executive palette */
const C = {
  bg: "#edf3f7",
  bgGrain: "#e6eef4",
  surface: "#ffffff",
  surfaceSoft: "#f7fbfd",
  surfaceTint: "#f1f7fb",
  border: "#d4dee7",
  borderStrong: "#b9c8d6",
  text: "#10233b",
  textMuted: "#53677c",
  textFaint: "#7f92a5",
  accent: "#005eb8",
  accentDark: "#0d2240",
  accentSoft: "rgba(0,94,184,0.08)",
  accentMed: "rgba(0,94,184,0.16)",
  accentGlow: "rgba(0,94,184,0.22)",
  teal: "#007a6e",
  tealSoft: "#edf7f5",
  green: "#2d8f5a",
  greenSoft: "#eef8f1",
  orange: "#d97706",
  orangeSoft: "#fff5e8",
  red: "#b42318",
  redSoft: "#fdf1f0",
  purple: "#5a4fcf",
  purpleSoft: "#f1efff",
  amber: "#b98900",
  amberSoft: "#fff8df",
  navySoft: "#16365f",
};

const LANE_TINTS = [
  { bg: "linear-gradient(180deg, #f3f8fd 0%, #edf4fa 100%)", accent: "#005eb8", chip: "#ebf3fb" },
  { bg: "linear-gradient(180deg, #f1f9f7 0%, #eaf5f2 100%)", accent: "#007a6e", chip: "#e9f7f4" },
  { bg: "linear-gradient(180deg, #fff8ee 0%, #fdf2df 100%)", accent: "#d97706", chip: "#fff3df" },
  { bg: "linear-gradient(180deg, #f5f3fd 0%, #efedfb 100%)", accent: "#5a4fcf", chip: "#efecfb" },
  { bg: "linear-gradient(180deg, #fdf4f3 0%, #f9eceb 100%)", accent: "#b42318", chip: "#fbecea" },
];

const STATUS_LIST = [
  { key: "none", icon: "○", label: "No Status", color: "#b8b4a8", bg: "transparent" },
  { key: "draft", icon: "✎", label: "Draft", color: "#9333ea", bg: "#f5effa" },
  { key: "active", icon: "▶", label: "In Progress", color: "#5b4fff", bg: "#edf0ff" },
  { key: "review", icon: "◉", label: "In Review", color: "#d97706", bg: "#fdf6e8" },
  { key: "done", icon: "✓", label: "Complete", color: "#16a34a", bg: "#f0faf3" },
  { key: "blocked", icon: "✕", label: "Blocked", color: "#dc2626", bg: "#fdf0f0" },
];

const PRIORITY_LIST = [
  { key: "none", icon: "—", label: "None", color: "#b8b4a8" },
  { key: "low", icon: "↓", label: "Low", color: "#16a34a" },
  { key: "medium", icon: "→", label: "Medium", color: "#d97706" },
  { key: "high", icon: "↑", label: "High", color: "#dc2626" },
  { key: "critical", icon: "⚡", label: "Critical", color: "#be123c" },
];

const BOARD_STATUS = ["Draft", "Active", "In Review", "Final", "Archived"];

const CONNECTOR_TYPES = [
  { key: "flow",       label: "Flow",       color: "#5b4fff", dash: "none",   width: 2.5, desc: "Sequential step" },
  { key: "data",       label: "Data",       color: "#9333ea", dash: "8 4",    width: 2.5, desc: "Data exchange" },
  { key: "feedback",   label: "Feedback",   color: "#d97706", dash: "2 4",    width: 2.5, desc: "Loopback / iteration" },
  { key: "dependency", label: "Dependency", color: "#6b675e", dash: "4 3",    width: 1.5, desc: "Prerequisite" },
  { key: "exception",  label: "Exception",  color: "#dc2626", dash: "none",   width: 2.5, desc: "Error / escalation" },
];

const TITLE_BLOCK_EXPANDED = 56;
const TITLE_BLOCK_COLLAPSED = 40;
const MIN_LANE_H = 100;
const LABEL_W = 140;
const COL_HEADER_H = 40;
const CARD_W = 130;
const CARD_H = 52;
const CARD_PAD = 8;
const CARD_GAP_X = 8;
const CARD_GAP_Y = 8;
const COL_W = 160;
const MAX_CARDS_PER_ROW = 2;

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const FONT_SANS = "'Public Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const FONT_SERIF = "'Libre Baskerville', 'Georgia', serif";

/* ══════ STYLE CONSTANTS ══════ */
const inputStyle = {
  background: C.surfaceSoft,
  border: `1.5px solid ${C.border}`,
  color: C.text,
  padding: "10px 13px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT_SANS,
  transition: `all 0.2s ${EASE}`,
};

const kbdStyle = {
  background: C.surfaceSoft,
  border: `1px solid ${C.border}`,
  borderRadius: 5,
  padding: "1px 6px",
  fontSize: 11,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 500,
};

const tabBtnStyle = {
  background: "none",
  border: "none",
  padding: "12px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: `all 0.2s ${EASE}`,
  letterSpacing: "-0.01em",
};

const tinyBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  padding: 0,
  lineHeight: 1,
  transition: `all 0.2s ${EASE}`,
};

/* ══════ GLOBAL CSS ══════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Libre+Baskerville:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap');

  .wfm-root * { box-sizing: border-box; }
  .wfm-root {
    background-image:
      radial-gradient(ellipse at top left, rgba(0,94,184,0.08) 0%, transparent 42%),
      radial-gradient(ellipse at bottom right, rgba(0,122,110,0.06) 0%, transparent 40%),
      linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 28%),
      repeating-linear-gradient(135deg, rgba(13,34,64,0.018) 0 12px, rgba(13,34,64,0) 12px 24px);
  }

  .wfm-btn { transition: all 0.2s ${EASE}; }
  .wfm-btn:hover:not(:disabled) {
    background: ${C.surfaceTint} !important;
    border-color: ${C.accent + "55"} !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(16,35,59,0.08);
  }
  .wfm-btn-active:hover:not(:disabled) {
    background: ${C.navySoft} !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${C.accentGlow};
  }
  .wfm-sm-btn { transition: all 0.15s ${EASE}; }
  .wfm-sm-btn:hover { background: ${C.surfaceTint} !important; border-color: ${C.accent + "44"} !important; }

  .wfm-card { transition: box-shadow 0.2s ${EASE}, border-color 0.2s ${EASE}, transform 0.15s ${EASE}; }
  .wfm-card:hover:not(.wfm-dragging) {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(16,35,59,0.12), 0 3px 8px rgba(16,35,59,0.06) !important;
  }

  .wfm-input:focus, .wfm-textarea:focus, .wfm-select:focus {
    border-color: ${C.accent} !important;
    background: ${C.surface} !important;
    box-shadow: 0 0 0 3px ${C.accentSoft};
  }

  .wfm-pill { transition: all 0.15s ${EASE}; }
  .wfm-pill:hover:not(.wfm-pill-active) {
    background: ${C.surfaceTint} !important;
    border-color: ${C.accent + "33"} !important;
  }

  .wfm-close:hover { color: ${C.text} !important; background: ${C.surfaceSoft} !important; }
  .wfm-delete-conn:hover path:last-child { stroke-width: 3.5 !important; opacity: 1 !important; }

  @keyframes wfm-fade-in {
    from { opacity: 0; transform: translateY(4px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes wfm-toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes wfm-pulse {
    0%, 100% { box-shadow: 0 0 0 0 ${C.accentGlow}; }
    50% { box-shadow: 0 0 0 6px rgba(91,79,255,0); }
  }
  .wfm-card-new { animation: wfm-fade-in 0.3s ${EASE}; }
  .wfm-linking { animation: wfm-pulse 1.5s infinite; }

  .wfm-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .wfm-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .wfm-scrollbar::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
  .wfm-scrollbar::-webkit-scrollbar-thumb:hover { background: ${C.borderStrong}; background-clip: padding-box; }
`;

/* ══════ FACTORIES ══════ */
function makeCard(laneId, colId) {
  return {
    id: uid(), laneId, colId, title: "",
    x: null, y: null,
    status: "none", priority: "none",
    sourceSystem: "", smes: "", process: "",
    dataElements: "", decisions: "", risks: "", notes: "",
    createdAt: Date.now(),
  };
}

function makeMeta() {
  return {
    title: "Untitled Workflow", description: "",
    owner: "", participants: "", initiative: "", department: "",
    version: "1.0", boardStatus: "Draft",
    createdDate: today(), modifiedDate: today(), tags: "",
  };
}

function makeInitialState() {
  const cols = [
    { id: uid(), name: "Phase 1" },
    { id: uid(), name: "Phase 2" },
    { id: uid(), name: "Phase 3" },
  ];
  const lanes = [
    { id: uid(), name: "Lane 1", color: 0 },
    { id: uid(), name: "Lane 2", color: 1 },
  ];
  return { cols, lanes, cards: [], conns: [] };
}

/* ══════ HELPERS ══════ */
function bezier(x1, y1, x2, y2, fromSide, toSide) {
  const TENSION = 0.55;

  // Build control-point offsets based on which side the connector exits/enters
  const cpOffset = (side, dist) => {
    const d = Math.max(Math.abs(dist) * TENSION, 30);
    switch (side) {
      case "r": return { dx: d,  dy: 0 };
      case "l": return { dx: -d, dy: 0 };
      case "b": return { dx: 0,  dy: d };
      case "t": return { dx: 0,  dy: -d };
      default: return { dx: d, dy: 0 };
    }
  };

  const totalDx = x2 - x1;
  const totalDy = y2 - y1;
  const fs = fromSide || (totalDx >= 0 ? "r" : "l");
  const ts = toSide   || (totalDx >= 0 ? "l" : "r");
  const cp1 = cpOffset(fs, fs === "r" || fs === "l" ? totalDx : totalDy);
  const cp2 = cpOffset(ts, ts === "r" || ts === "l" ? totalDx : totalDy);

  return `M${x1},${y1} C${x1 + cp1.dx},${y1 + cp1.dy} ${x2 + cp2.dx},${y2 + cp2.dy} ${x2},${y2}`;
}

/* Smart routing: avoids crossing over intermediate cards */
function routeAroundCards(fromCard, toCard, allCards, cardPosFn) {
  const PAD = 20;
  const fc = { x: cardPosFn(fromCard).x + CARD_W / 2, y: cardPosFn(fromCard).y + CARD_H / 2 };
  const tc = { x: cardPosFn(toCard).x + CARD_W / 2, y: cardPosFn(toCard).y + CARD_H / 2 };

  // Build bounding boxes for all OTHER cards (exclude source/target)
  const obstacles = allCards
    .filter(c => c.id !== fromCard.id && c.id !== toCard.id)
    .map(c => {
      const p = cardPosFn(c);
      return { l: p.x - PAD, r: p.x + CARD_W + PAD, t: p.y - PAD, b: p.y + CARD_H + PAD };
    });

  // Check if the straight bezier midpoint sits inside an obstacle
  const midX = (fc.x + tc.x) / 2;
  const midY = (fc.y + tc.y) / 2;
  const blocked = obstacles.some(o => midX > o.l && midX < o.r && midY > o.t && midY < o.b);

  if (!blocked) return null; // use default bezier

  // Find the blocking card closest to the midpoint
  let bestOb = null;
  let bestDist = Infinity;
  for (const o of obstacles) {
    if (midX > o.l && midX < o.r && midY > o.t && midY < o.b) {
      const cx = (o.l + o.r) / 2;
      const cy = (o.t + o.b) / 2;
      const d = Math.hypot(midX - cx, midY - cy);
      if (d < bestDist) { bestDist = d; bestOb = o; }
    }
  }
  if (!bestOb) return null;

  // Route above or below the obstacle depending on which side source/target are
  const goAbove = fc.y <= bestOb.t || tc.y <= bestOb.t;
  const wy = goAbove ? bestOb.t - 10 : bestOb.b + 10;

  // Exit from source edge, enter to target edge
  const a1 = Math.atan2(wy - fc.y, midX - fc.x);
  const x1 = fc.x + Math.cos(a1) * (CARD_W / 2 + 8);
  const y1 = fc.y + Math.sin(a1) * (CARD_H / 2 + 8);
  const a2 = Math.atan2(tc.y - wy, tc.x - midX);
  const x2 = tc.x - Math.cos(a2) * (CARD_W / 2 + 8);
  const y2 = tc.y - Math.sin(a2) * (CARD_H / 2 + 8);

  const dx1 = Math.abs(midX - x1) * 0.4;
  const dx2 = Math.abs(x2 - midX) * 0.4;

  return `M${x1},${y1} C${x1 + dx1},${y1} ${midX - 15},${wy} ${midX},${wy} C${midX + 15},${wy} ${x2 - dx2},${y2} ${x2},${y2}`;
}

function slugify(s) {
  return (s || "workflow").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "workflow";
}

function boardStatusTone(status) {
  switch (status) {
    case "Active":
      return { color: C.accent, bg: C.accentSoft, border: C.accent + "44" };
    case "In Review":
      return { color: C.orange, bg: C.orangeSoft, border: C.orange + "44" };
    case "Final":
      return { color: C.teal, bg: C.tealSoft, border: C.teal + "44" };
    case "Archived":
      return { color: C.textMuted, bg: C.surfaceTint, border: C.borderStrong };
    default:
      return { color: C.navySoft, bg: "rgba(13,34,64,0.08)", border: "rgba(13,34,64,0.18)" };
  }
}

/* ══════ SMALL COMPONENTS ══════ */
function StatusBadge({ status }) {
  const s = STATUS_LIST.find(x => x.key === status) || STATUS_LIST[0];
  if (s.key === "none") return null;
  return (
    <div style={{
      position: "absolute", top: -6, right: -6, width: 18, height: 18,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}dd 100%)`,
      color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 800, border: "2px solid #fff",
      boxShadow: `0 1px 4px ${s.color}55`,
      lineHeight: 1,
    }}>{s.icon}</div>
  );
}

function PriorityTag({ priority }) {
  const p = PRIORITY_LIST.find(x => x.key === priority);
  if (!p || p.key === "none") return null;
  return (
    <div style={{
      position: "absolute", bottom: -6, right: -6, width: 16, height: 16,
      borderRadius: "50%", background: "#fff", color: p.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 800, border: `2px solid ${p.color}`,
      boxShadow: `0 1px 4px ${p.color}33`, lineHeight: 1,
    }}>{p.icon}</div>
  );
}

function Chip({ children, color, bg }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 600, color,
      background: bg || color + "14",
      padding: "1px 5px", borderRadius: 8,
      whiteSpace: "nowrap",
      letterSpacing: "-0.01em",
      border: `1px solid ${color}22`,
    }}>{children}</span>
  );
}

function Btn({ children, active, disabled, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={active ? "wfm-btn wfm-btn-active" : "wfm-btn"}
      style={{
        background: active ? C.accent : C.surface,
        border: `1.5px solid ${active ? C.accent : C.border}`,
        color: active ? "#fff" : disabled ? C.textFaint : C.text,
        padding: "7px 14px",
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: FONT_SANS,
        boxShadow: active ? `0 2px 8px ${C.accentGlow}` : "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >{children}</button>
  );
}

function SmBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="wfm-sm-btn"
      style={{
        width: 30, height: 30, borderRadius: 7,
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        color: C.text, fontSize: 16,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
        fontWeight: 600,
      }}
    >{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{
      display: "flex", flexDirection: "column", gap: 6,
      fontSize: 10, fontWeight: 700, color: C.textMuted,
      textTransform: "uppercase", letterSpacing: "0.08em",
      fontFamily: FONT_SANS,
    }}>{label}{children}</label>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 22, background: C.border, margin: "0 6px" }} />;
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;
}

/* ══════ MAIN COMPONENT ══════ */
export default function WorkflowMapper() {
  const initial = useState(makeInitialState)[0];
  const [meta, setMeta] = useState(makeMeta);
  const [cols, setCols] = useState(initial.cols);
  const [lanes, setLanes] = useState(initial.lanes);
  const [cards, setCards] = useState(initial.cards);
  const [conns, setConns] = useState(initial.conns || []);
  const [drag, setDrag] = useState(null);
  const [sel, setSel] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [editField, setEditField] = useState(null);
  const [editCol, setEditCol] = useState(null);
  const [editLane, setEditLane] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panAnchor, setPanAnchor] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [panel, setPanel] = useState("card");
  const [hoverCard, setHoverCard] = useState(null);
  const [connType, setConnType] = useState("flow");
  const [selConn, setSelConn] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [editAnnotation, setEditAnnotation] = useState(null);
  const [titleCollapsed, setTitleCollapsed] = useState(false);
  const [tbPos, setTbPos] = useState({ x: 0, y: 12 });
  const [tbDrag, setTbDrag] = useState(null);
  const [mode, setMode] = useState("free"); // "free" | "structured"
  const [showStructureMenu, setShowStructureMenu] = useState(false);
  const canvasRef = useRef(null);
  const tbRef = useRef(null);
  const toastTimer = useRef(null);
  const zoomContainerRef = useRef(null);

  const isFree = mode === "free";
  const titleBlockH = isFree ? 0 : (titleCollapsed ? TITLE_BLOCK_COLLAPSED : TITLE_BLOCK_EXPANDED);

  // Count cards per cell → derive rows needed per cell
  const cellCount = (colId, laneId) => cards.filter(c => c.colId === colId && c.laneId === laneId).length;
  const cellRows = (count) => Math.max(1, Math.ceil(count / MAX_CARDS_PER_ROW));
  const cellCols = (count) => Math.min(count, MAX_CARDS_PER_ROW);

  // Dynamic column widths — based on widest cell (capped at MAX_CARDS_PER_ROW)
  const colWidths = (() => {
    const widths = {};
    cols.forEach(col => {
      let maxCols = 1;
      lanes.forEach(lane => {
        const n = cellCount(col.id, lane.id);
        maxCols = Math.max(maxCols, cellCols(n));
      });
      widths[col.id] = Math.max(COL_W, CARD_PAD * 2 + maxCols * (CARD_W + CARD_GAP_X) - CARD_GAP_X);
    });
    return widths;
  })();

  // Dynamic lane heights — based on tallest cell in that lane
  const laneHeights = (() => {
    const heights = {};
    lanes.forEach(lane => {
      let maxRows = 1;
      cols.forEach(col => {
        const n = cellCount(col.id, lane.id);
        maxRows = Math.max(maxRows, cellRows(n));
      });
      heights[lane.id] = Math.max(MIN_LANE_H, CARD_PAD * 2 + maxRows * (CARD_H + CARD_GAP_Y) - CARD_GAP_Y);
    });
    return heights;
  })();

  const colWidthOf = (colId) => colWidths[colId] || COL_W;
  const laneHeightOf = (laneId) => laneHeights[laneId] || MIN_LANE_H;
  const structuredW = LABEL_W + cols.reduce((sum, c) => sum + colWidthOf(c.id), 0);
  const structuredH = titleBlockH + COL_HEADER_H + lanes.reduce((sum, l) => sum + laneHeightOf(l.id), 0);
  const totalW = isFree ? 3000 : structuredW;
  const totalH = isFree ? 2000 : structuredH;

  const colLeft = (colId) => {
    const i = cols.findIndex(c => c.id === colId);
    if (i < 0) return LABEL_W;
    let left = LABEL_W;
    for (let j = 0; j < i; j++) left += colWidthOf(cols[j].id);
    return left;
  };

  const laneTopOf = (laneId) => {
    const i = lanes.findIndex(l => l.id === laneId);
    if (i < 0) return titleBlockH + COL_HEADER_H;
    let top = titleBlockH + COL_HEADER_H;
    for (let j = 0; j < i; j++) top += laneHeightOf(lanes[j].id);
    return top;
  };

  const laneIndexAt = (y) => {
    let top = titleBlockH + COL_HEADER_H;
    for (let i = 0; i < lanes.length; i++) {
      const h = laneHeightOf(lanes[i].id);
      if (y >= top && y < top + h) return i;
      top += h;
    }
    return -1;
  };

  const colIndexAt = (x) => {
    let left = LABEL_W;
    for (let i = 0; i < cols.length; i++) {
      const w = colWidthOf(cols[i].id);
      if (x >= left && x < left + w) return i;
      left += w;
    }
    return -1;
  };

  const showToast = (m) => {
    clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const snap = () => {
    setHistory(h => [...h.slice(-20), {
      meta: { ...meta },
      cards: JSON.parse(JSON.stringify(cards)),
      conns: JSON.parse(JSON.stringify(conns)),
      lanes: JSON.parse(JSON.stringify(lanes)),
      cols: JSON.parse(JSON.stringify(cols)),
      annotations: JSON.parse(JSON.stringify(annotations)),
    }]);
  };

  const undo = () => {
    if (!history.length) return;
    const p = history[history.length - 1];
    setMeta(p.meta); setCards(p.cards); setConns(p.conns);
    setLanes(p.lanes); setCols(p.cols);
    if (p.annotations) setAnnotations(p.annotations);
    setHistory(h => h.slice(0, -1));
    showToast("Undone");
  };

  const toCanvas = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y };
  }, [zoom, pan]);

  const updateCard = (id, patch) => {
    setCards(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const updateMeta = (patch) => {
    setMeta(m => ({ ...m, ...patch, modifiedDate: today() }));
  };

  // Computed grid position for a card (used by Tidy and new cards)
  const cardGridPos = (card) => {
    const cellCards = cards.filter(c => c.laneId === card.laneId && c.colId === card.colId);
    const idx = Math.max(0, cellCards.findIndex(c => c.id === card.id));
    const col = idx % MAX_CARDS_PER_ROW;
    const row = Math.floor(idx / MAX_CARDS_PER_ROW);
    return {
      x: colLeft(card.colId) + CARD_PAD + col * (CARD_W + CARD_GAP_X),
      y: laneTopOf(card.laneId) + CARD_PAD + row * (CARD_H + CARD_GAP_Y),
    };
  };

  // Actual position: stored x/y if set, otherwise computed grid
  const cardPos = (card) => {
    if (card.x != null && card.y != null) return { x: card.x, y: card.y };
    return cardGridPos(card);
  };

  const startDrag = (e, cid) => {
    if (linking) return;
    e.stopPropagation();
    snap();
    const card = cards.find(c => c.id === cid);
    if (!card) return;
    const pos = cardPos(card);
    const p = toCanvas(e);
    setDrag({ cardId: cid, ox: p.x - pos.x, oy: p.y - pos.y, freeX: pos.x, freeY: pos.y });
  };

  const onMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const p = toCanvas(e);
    setMouse(p);
    if (panning && panAnchor) {
      setPan(pr => ({
        x: pr.x + (e.clientX - panAnchor.x) / zoom,
        y: pr.y + (e.clientY - panAnchor.y) / zoom,
      }));
      setPanAnchor({ x: e.clientX, y: e.clientY });
      return;
    }
    if (drag) {
      const nx = p.x - drag.ox;
      const ny = p.y - drag.oy;
      setDrag(d => ({ ...d, freeX: nx, freeY: ny }));
      if (drag.isNote) {
        setAnnotations(prev => prev.map(n => n.id === drag.noteId ? { ...n, x: nx, y: ny } : n));
      } else {
        // Free-position the card + update lane/col for organizational metadata
        const ci = colIndexAt(nx + CARD_W / 2);
        const li = laneIndexAt(ny + CARD_H / 2);
        const patch = { x: nx, y: ny };
        if (ci >= 0 && ci < cols.length) patch.colId = cols[ci].id;
        if (li >= 0 && li < lanes.length) patch.laneId = lanes[li].id;
        setCards(prev => prev.map(c =>
          c.id === drag.cardId ? { ...c, ...patch } : c
        ));
      }
    }
  }, [drag, panning, panAnchor, zoom, toCanvas, cols, lanes]);

  const onUp = useCallback(() => {
    setDrag(null);
    setPanning(false);
    setPanAnchor(null);
  }, []);

  // Attach to window during drag/pan so fast mouse movement doesn't escape
  useEffect(() => {
    if (!drag && !panning) return;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, panning, onMove, onUp]);

  const onDblClick = (e) => {
    if (e.target.closest(".card-el")) return;
    if (e.target.closest(".toolbar")) return;
    if (e.target.closest(".detail-panel")) return;
    if (e.target.closest(".col-header")) return;
    if (e.target.closest(".lane-label")) return;
    if (e.target.closest(".board-bar")) return;
    const p = toCanvas(e);
    const ci = colIndexAt(p.x);
    const li = laneIndexAt(p.y);
    if (ci < 0 || ci >= cols.length || li < 0 || li >= lanes.length) return;
    snap();
    const nc = { ...makeCard(lanes[li].id, cols[ci].id), x: p.x - CARD_W / 2, y: p.y - CARD_H / 2 };
    setCards(pr => [...pr, nc]);
    setSel(nc.id);
    setPanel("card");
    setEditField({ cardId: nc.id, field: "title" });
    showToast("New card — start typing");
  };

  const onCardClick = (e, cid) => {
    e.stopPropagation();
    if (linking) {
      if (!linkFrom) {
        setLinkFrom(cid);
        showToast("Now click the target card");
      } else if (linkFrom !== cid) {
        const exists = conns.some(c => c.from === linkFrom && c.to === cid);
        if (!exists) {
          snap();
          setConns(pr => [...pr, { id: uid(), from: linkFrom, to: cid, type: connType, label: "" }]);
          showToast(`Connected (${connType})`);
        }
        setLinkFrom(null);
      }
      return;
    }
    setSel(cid);
    setPanel("card");
  };

  const onCardDblClick = (e, cid) => {
    e.stopPropagation();
    if (linking) return;
    setEditField({ cardId: cid, field: "title" });
  };

  const cardCenterOf = (card) => {
    const pos = cardPos(card);
    return { x: pos.x + CARD_W / 2, y: pos.y + CARD_H / 2 };
  };

  // Pick the optimal side (L/R/T/B) of each card so arrows stay clean
  const cardEdge = (f, t) => {
    const fp = cardPos(f);
    const tp = cardPos(t);
    const GAP = 6;

    // Four anchor points per card: right-center, left-center, bottom-center, top-center
    const ports = (p) => ({
      r: { x: p.x + CARD_W + GAP, y: p.y + CARD_H / 2 },
      l: { x: p.x - GAP,          y: p.y + CARD_H / 2 },
      b: { x: p.x + CARD_W / 2,   y: p.y + CARD_H + GAP },
      t: { x: p.x + CARD_W / 2,   y: p.y - GAP },
    });
    const fPorts = ports(fp);
    const tPorts = ports(tp);

    // Score every combination — shortest distance that doesn't double-back
    const dx = tp.x - fp.x;
    const dy = tp.y - fp.y;

    // Preferred exit/entry based on relative position
    let fromSide, toSide;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Primarily horizontal
      fromSide = dx > 0 ? "r" : "l";
      toSide   = dx > 0 ? "l" : "r";
    } else {
      // Primarily vertical
      fromSide = dy > 0 ? "b" : "t";
      toSide   = dy > 0 ? "t" : "b";
    }

    // If cards overlap on the chosen axis, fall back to the better perpendicular
    const from = fPorts[fromSide];
    const to   = tPorts[toSide];

    // Check if the line would need to double-back (exit right but target is left of exit)
    const needsFallback =
      (fromSide === "r" && to.x < from.x) ||
      (fromSide === "l" && to.x > from.x) ||
      (fromSide === "b" && to.y < from.y) ||
      (fromSide === "t" && to.y > from.y);

    if (needsFallback) {
      // Pick the pair of ports with the shortest straight-line distance
      let best = null;
      let bestDist = Infinity;
      for (const fk of ["r", "l", "b", "t"]) {
        for (const tk of ["r", "l", "b", "t"]) {
          const d = Math.hypot(fPorts[fk].x - tPorts[tk].x, fPorts[fk].y - tPorts[tk].y);
          if (d < bestDist) { bestDist = d; best = { from: fPorts[fk], to: tPorts[tk], fk, tk }; }
        }
      }
      return { x1: best.from.x, y1: best.from.y, x2: best.to.x, y2: best.to.y, fromSide: best.fk, toSide: best.tk };
    }

    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, fromSide, toSide };
  };

  const selCard = cards.find(c => c.id === sel);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo();
      }
      if (e.key === "Escape") {
        setSel(null); setLinking(false); setLinkFrom(null);
        setEditField(null); setEditCol(null); setEditLane(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = document.activeElement;
        const inPanel = active && active.closest && active.closest(".detail-panel");
        const inInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
        if (sel && !editField && !editCol && !editLane && !inPanel && !inInput) {
          snap();
          setCards(p => p.filter(c => c.id !== sel));
          setConns(p => p.filter(c => c.from !== sel && c.to !== sel));
          setSel(null);
          showToast("Deleted");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sel, editField, editCol, editLane, history]);

  // Toolbar drag — window-level so it never sticks
  useEffect(() => {
    if (!tbDrag) return;
    const onMove = (e) => {
      setTbPos({
        x: tbDrag.startX + (e.clientX - tbDrag.anchorX),
        y: Math.max(0, tbDrag.startY + (e.clientY - tbDrag.anchorY)),
      });
    };
    const onUp = () => setTbDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [tbDrag]);

  const exportJSON = () => {
    const payload = {
      meta: { ...meta, modifiedDate: today(), exportedAt: new Date().toISOString() },
      cols, lanes, cards, conns, annotations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const fname = `${slugify(meta.title)}-${today()}.json`;
    const a = document.createElement("a");
    a.href = url; a.download = fname; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported: ${fname}`);
  };

  const importJSON = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".json";
    inp.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (d.lanes && d.cards && d.cols) {
            snap();
            if (d.meta) setMeta(d.meta);
            setCols(d.cols); setLanes(d.lanes);
            setCards(d.cards); setConns(d.conns || []);
            setAnnotations(d.annotations || []);
            setSel(null);
            showToast("Imported!");
          }
        } catch { showToast("Invalid file"); }
      };
      r.readAsText(f);
    };
    inp.click();
  };

  // Fields available for structuring
  const GROUPABLE_FIELDS = [
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "sourceSystem", label: "Source System" },
    { key: "smes", label: "SME / Owner" },
  ];

  const applyStructure = (colField, rowField) => {
    snap();
    // Build columns from unique values of colField
    const colValues = [...new Set(cards.map(c => c[colField] || "Unset").filter(Boolean))];
    const newCols = colValues.map(v => ({ id: uid(), name: v }));

    // Build lanes from unique values of rowField
    const rowValues = [...new Set(cards.map(c => c[rowField] || "Unset").filter(Boolean))];
    const newLanes = rowValues.map((v, i) => ({ id: uid(), name: v, color: i % 5 }));

    // Assign each card to the right cell, clear free position
    const newCards = cards.map(c => {
      const cv = c[colField] || "Unset";
      const rv = c[rowField] || "Unset";
      const col = newCols.find(nc => nc.name === cv);
      const lane = newLanes.find(nl => nl.name === rv);
      return { ...c, colId: col.id, laneId: lane.id, x: null, y: null };
    });

    setCols(newCols);
    setLanes(newLanes);
    setCards(newCards);
    setMode("structured");
    setShowStructureMenu(false);
    showToast(`Structured: ${colField} × ${rowField}`);
  };

  const goFreeform = () => {
    snap();
    // Stamp current computed positions as free positions before switching
    setCards(prev => prev.map(c => {
      const pos = cardPos(c);
      return { ...c, x: pos.x, y: pos.y };
    }));
    setMode("free");
    showToast("Freeform mode");
  };

  // Auto-layout: sort cards within each cell alphabetically for clean ordering
  const tidyLayout = () => {
    snap();
    setCards(prev => {
      const sorted = [...prev].map(c => ({ ...c, x: null, y: null }));
      sorted.sort((a, b) => {
        if (a.laneId !== b.laneId) return lanes.findIndex(l => l.id === a.laneId) - lanes.findIndex(l => l.id === b.laneId);
        if (a.colId !== b.colId) return cols.findIndex(c => c.id === a.colId) - cols.findIndex(c => c.id === b.colId);
        return (a.title || "").localeCompare(b.title || "");
      });
      return sorted;
    });
    showToast("Snapped to grid");
  };

  // Fit entire board in view
  const fitToView = () => {
    if (!canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = (r.width - 40) / (totalW + 60);
    const scaleY = (r.height - 40) / (totalH + 60);
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(Math.max(0.15, Math.round(newZoom * 100) / 100));
    setPan({ x: 10, y: 10 });
    showToast(`Fit to view (${Math.round(newZoom * 100)}%)`);
  };

  // Export board as PNG
  const exportPNG = async () => {
    const el = zoomContainerRef.current;
    if (!el) return;
    showToast("Rendering…");
    try {
      // Save current transform, reset for clean capture
      const prevTransform = el.style.transform;
      const prevOrigin = el.style.transformOrigin;
      el.style.transform = "none";
      el.style.transformOrigin = "0 0";

      const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm");
      const canvas = await html2canvas(el, {
        backgroundColor: "#edf3f7",
        scale: 2,
        width: totalW + 40,
        height: totalH + 40,
        logging: false,
      });

      // Restore transform
      el.style.transform = prevTransform;
      el.style.transformOrigin = prevOrigin;

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slugify(meta.title)}-${today()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("PNG exported!");
      });
    } catch {
      showToast("PNG export failed — try JSON instead");
    }
  };

  const showPanel = sel || panel === "board";

  return (
    <div
      className="wfm-root"
        style={{
          width: "100%", height: "100vh",
          display: "flex", flexDirection: "column",
          fontFamily: FONT_SANS,
          color: C.text, background: C.bg,
          overflow: "hidden",
          letterSpacing: "-0.01em",
        }}
      >
      <style>{GLOBAL_CSS}</style>

      {/* BOARD TITLE BAR — compact */}
      <div className="board-bar" style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 20px",
        background: `linear-gradient(90deg, ${C.accentDark} 0%, ${C.navySoft} 58%, ${C.accent} 100%)`,
        borderBottom: `1px solid rgba(255,255,255,0.08)`, flexShrink: 0,
        boxShadow: "0 4px 20px rgba(13,34,64,0.18)",
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          fontSize: 13, fontWeight: 800, color: "#fff",
          background: "rgba(255,255,255,0.14)",
          border: "1px solid rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>BS</span>
        <input
          value={meta.title}
          onChange={(e) => updateMeta({ title: e.target.value })}
          placeholder="Workflow Title…"
          style={{
            border: "none", background: "transparent",
            fontSize: 20, fontWeight: 700, color: "#fff", outline: "none",
            flex: 1, minWidth: 100,
            fontFamily: FONT_SANS, letterSpacing: "-0.03em",
          }}
        />
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#fff",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.16)",
          padding: "3px 9px", borderRadius: 16,
          textTransform: "uppercase", letterSpacing: "0.08em",
          flexShrink: 0,
        }}>{meta.boardStatus}</span>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.6)",
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, flexShrink: 0,
        }}>v{meta.version}</span>
        {/* Gear icon — opens board info panel */}
        <button
          onClick={() => { setPanel("board"); setSel(null); }}
          title="Board settings"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: panel === "board" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, flexShrink: 0,
            transition: `all 0.15s ${EASE}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = panel === "board" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M6.8 1.5h2.4l.35 1.6a5 5 0 011.15.67l1.55-.5.12.2 1.08 1.86-.12.2-1.2 1.1a5 5 0 010 1.34l1.2 1.1.12.2-1.08 1.86-.12.2-1.55-.5a5 5 0 01-1.15.67l-.35 1.6H6.8l-.35-1.6a5 5 0 01-1.15-.67l-1.55.5-.12-.2L2.55 9.3l.12-.2 1.2-1.1a5 5 0 010-1.34l-1.2-1.1-.12-.2L3.63 3.5l.12-.2 1.55.5a5 5 0 011.15-.67L6.8 1.5z" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* CANVAS */}
        <div
          ref={canvasRef}
          onMouseDown={(e) => {
            const onCard = e.target.closest(".card-el");
            const onHeader = e.target.closest(".col-header");
            const onLane = e.target.closest(".lane-label");
            const onToolbar = e.target.closest(".toolbar");
            if (!onCard && !onHeader && !onLane && !onToolbar && !linking) {
              setPanning(true);
              setPanAnchor({ x: e.clientX, y: e.clientY });
            }
            if (!onCard && !onToolbar && !e.target.closest(".detail-panel")) {
              setSel(null);
              setSelConn(null);
            }
          }}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onDoubleClick={onDblClick}
          onWheel={(e) => {
            e.preventDefault();
            setZoom(z => Math.min(2, Math.max(0.25, z - e.deltaY * 0.0015)));
          }}
            style={{
              flex: 1, overflow: "hidden",
              cursor: panning ? "grabbing" : linking ? "crosshair" : "default",
              position: "relative",
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,94,184,0.09) 1px, transparent 0)`,
              backgroundSize: `${28}px ${28}px`,
              backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
            }}
          >
          {/* FLOATING TOOLBAR — draggable */}
          <div
            ref={tbRef}
            className="toolbar"
            style={{
              position: "absolute",
              top: tbPos.y,
              left: tbPos.x === 0 ? "50%" : tbPos.x,
              transform: tbPos.x === 0 ? "translateX(-50%)" : "none",
              zIndex: 200, display: "flex", alignItems: "center", gap: 6,
              padding: "8px 6px 8px 0",
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 14,
              boxShadow: tbDrag
                ? "0 12px 36px rgba(16,35,59,0.2), 0 4px 10px rgba(16,35,59,0.08)"
                : "0 8px 28px rgba(16,35,59,0.14), 0 2px 6px rgba(16,35,59,0.06)",
              fontFamily: FONT_SANS,
              transition: tbDrag ? "none" : `box-shadow 0.2s ${EASE}`,
              userSelect: "none",
            }}
          >
            {/* Drag handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = tbRef.current.getBoundingClientRect();
                setTbPos({ x: rect.left, y: rect.top - canvasRef.current.getBoundingClientRect().top });
                setTbDrag({
                  anchorX: e.clientX, anchorY: e.clientY,
                  startX: rect.left,
                  startY: rect.top - canvasRef.current.getBoundingClientRect().top,
                });
              }}
              style={{
                width: 28, height: 34, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: tbDrag ? "grabbing" : "grab",
                color: C.textFaint,
                borderRadius: "12px 0 0 12px",
                transition: `color 0.15s ${EASE}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textFaint; }}
              title="Drag to reposition"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
                <circle cx="2" cy="2" r="1.5" /><circle cx="6" cy="2" r="1.5" />
                <circle cx="2" cy="7" r="1.5" /><circle cx="6" cy="7" r="1.5" />
                <circle cx="2" cy="12" r="1.5" /><circle cx="6" cy="12" r="1.5" />
              </svg>
            </div>
            <Btn onClick={() => { snap(); setCols(p => [...p, { id: uid(), name: "New Phase" }]); showToast("Column added"); }}>
              <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 800 }}>+</span> Column
            </Btn>
            <Btn onClick={() => { snap(); setLanes(p => [...p, { id: uid(), name: "New Lane", color: p.length % 5 }]); showToast("Lane added"); }}>
              <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 800 }}>+</span> Lane
            </Btn>
            <Sep />
            <Btn active={linking} onClick={() => { setLinking(!linking); setLinkFrom(null); }}>
              {linking ? "⟶ Click two cards…" : "↗ Connect"}
            </Btn>
            <ConnectorTypePicker value={connType} onChange={setConnType} />
            <Sep />
            <Btn onClick={undo} disabled={!history.length}>↩ Undo</Btn>
            <Sep />
            <Btn onClick={exportJSON}>↓ JSON</Btn>
            <Btn onClick={exportPNG}>⎙ PNG</Btn>
            <Btn onClick={importJSON}>↑ Import</Btn>
            <Sep />
            <Btn onClick={() => {
              snap();
              const cx = -pan.x + 400;
              const cy = -pan.y + 300;
              const note = { id: uid(), x: cx, y: cy, text: "", w: 180, h: 80 };
              setAnnotations(p => [...p, note]);
              setEditAnnotation(note.id);
              showToast("Note added — start typing");
            }}>✎ Note</Btn>
            <Sep />
            {/* Mode toggle + Structure */}
            {isFree ? (
              <div style={{ position: "relative" }}>
                <Btn onClick={() => setShowStructureMenu(!showStructureMenu)}>⊞ Structure</Btn>
                {showStructureMenu && (
                  <>
                    <div onClick={() => setShowStructureMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 298 }} />
                    <StructureMenu fields={GROUPABLE_FIELDS} onApply={applyStructure} onClose={() => setShowStructureMenu(false)} />
                  </>
                )}
              </div>
            ) : (
              <Btn onClick={goFreeform}>◇ Freeform</Btn>
            )}
            {!isFree && <Btn onClick={tidyLayout}>⊞ Tidy</Btn>}
            <Btn onClick={fitToView}>⊡ Fit</Btn>
            <Sep />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <SmBtn onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}>−</SmBtn>
              <span style={{
                fontSize: 11, color: C.textMuted, minWidth: 40, textAlign: "center",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              }}>{Math.round(zoom * 100)}%</span>
              <SmBtn onClick={() => setZoom(z => Math.min(2, z + 0.15))}>+</SmBtn>
            </div>
          </div>

          <div ref={zoomContainerRef} style={{
            transform: `scale(${zoom}) translate(${pan.x}px,${pan.y}px)`,
            transformOrigin: "0 0", position: "relative",
            width: totalW + 60, minHeight: totalH + 60,
          }}>

            {/* Title block — only in structured mode */}
            {!isFree && <TitleBlock meta={meta} totalW={totalW} stats={{ cards: cards.length, conns: conns.length }} collapsed={titleCollapsed} onToggle={() => setTitleCollapsed(c => !c)} />}

            {/* Column headers — structured mode only */}
            {!isFree &&
            <div style={{
              position: "absolute", top: titleBlockH, left: LABEL_W,
              display: "flex", height: COL_HEADER_H, zIndex: 5,
            }}>
              {cols.map((col) => {
                const cw = colWidthOf(col.id);
                return (
                <div
                  key={col.id}
                  className="col-header"
                  style={{
                    width: cw, height: COL_HEADER_H,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    borderBottom: `2px solid ${C.accent + "2a"}`,
                    borderRight: `1px solid ${C.border}`,
                    background: `linear-gradient(180deg, ${C.surface} 0%, ${C.surfaceTint} 100%)`,
                    position: "relative",
                    boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.65)",
                  }}
                >
                  {editCol === col.id ? (
                    <input
                      autoFocus
                      value={col.name}
                      onChange={(e) => setCols(p => p.map(c => c.id === col.id ? { ...c, name: e.target.value } : c))}
                      onBlur={() => setEditCol(null)}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      style={{
                        background: "transparent", border: "none",
                        borderBottom: `2px solid ${C.accent}`,
                        fontWeight: 700, fontSize: 13, color: C.text,
                        textAlign: "center", outline: "none",
                        width: cw - 60, fontFamily: FONT_SANS,
                        letterSpacing: "0.01em",
                      }}
                    />
                  ) : (
                    <span
                      onClick={(e) => { e.stopPropagation(); setEditCol(col.id); }}
                      style={{
                        fontWeight: 800, fontSize: 12, color: C.navySoft,
                        cursor: "text",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    >{col.name}</span>
                  )}
                  {cols.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        snap();
                        const ids = new Set(cards.filter(c => c.colId === col.id).map(c => c.id));
                        setCards(p => p.filter(c => c.colId !== col.id));
                        setConns(p => p.filter(c => !ids.has(c.from) && !ids.has(c.to)));
                        setCols(p => p.filter(c => c.id !== col.id));
                        showToast("Column removed");
                      }}
                      style={{
                        ...tinyBtnStyle,
                        color: C.textFaint,
                        fontSize: 14, position: "absolute", right: 8,
                        width: 20, height: 20, borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseEnter={(e) => { e.target.style.color = C.red; e.target.style.background = C.redSoft; }}
                      onMouseLeave={(e) => { e.target.style.color = C.textFaint; e.target.style.background = "transparent"; }}
                    >×</button>
                  )}
                </div>
                );
              })}
            </div>}

            {/* Corner */}
            {!isFree && <div style={{
              position: "absolute", top: titleBlockH, left: 0,
              width: LABEL_W, height: COL_HEADER_H,
              background: `linear-gradient(135deg, ${C.accentDark} 0%, ${C.navySoft} 100%)`,
              borderBottom: `2px solid ${C.accent + "44"}`,
              borderRight: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 6,
              boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08)",
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.8)",
                textTransform: "uppercase", letterSpacing: "0.12em",
                fontFamily: FONT_SANS,
              }}>Phase →</span>
            </div>}

            {/* Lanes */}
            {!isFree && lanes.map((lane) => {
              const lh = laneHeightOf(lane.id);
              const lt = laneTopOf(lane.id);
              const tint = LANE_TINTS[lane.color % 5];
              return (
                <div
                  key={lane.id}
                  style={{
                    position: "absolute", top: lt, left: 0,
                    width: totalW, height: lh,
                    background: tint.bg,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    className="lane-label"
                    style={{
                      position: "absolute", left: 0, top: 0,
                      width: LABEL_W, height: lh,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8,
                      borderRight: `1px solid ${C.border}`,
                      background: `linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.76) 100%)`,
                      padding: "10px 10px", zIndex: 3,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{
                      width: 28, height: 4, borderRadius: 2,
                      background: `linear-gradient(90deg, ${tint.accent} 0%, ${tint.accent}88 100%)`,
                      boxShadow: `0 1px 3px ${tint.accent}44`,
                    }} />
                    {editLane === lane.id ? (
                      <input
                        autoFocus
                        value={lane.name}
                        onChange={(e) => setLanes(p => p.map(l => l.id === lane.id ? { ...l, name: e.target.value } : l))}
                        onBlur={() => setEditLane(null)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                        style={{
                          background: "transparent", border: "none",
                          borderBottom: `2px solid ${C.accent}`,
                          textAlign: "center", fontWeight: 700, fontSize: 13,
                          color: C.text, width: 130, outline: "none",
                          fontFamily: FONT_SANS, letterSpacing: "-0.01em",
                        }}
                      />
                    ) : (
                      <span
                        onClick={(e) => { e.stopPropagation(); setEditLane(lane.id); }}
                        style={{
                          fontWeight: 700, fontSize: 13, color: C.text,
                          cursor: "text", textAlign: "center", lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >{lane.name}</span>
                    )}
                    {lanes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          snap();
                          const ids = new Set(cards.filter(c => c.laneId === lane.id).map(c => c.id));
                          setCards(p => p.filter(c => c.laneId !== lane.id));
                          setConns(p => p.filter(c => !ids.has(c.from) && !ids.has(c.to)));
                          setLanes(p => p.filter(l => l.id !== lane.id));
                          showToast("Lane removed");
                        }}
                        style={{
                          ...tinyBtnStyle,
                          color: C.textFaint, fontSize: 14,
                          width: 20, height: 20, borderRadius: 4,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        onMouseEnter={(e) => { e.target.style.color = C.red; e.target.style.background = C.redSoft; }}
                        onMouseLeave={(e) => { e.target.style.color = C.textFaint; e.target.style.background = "transparent"; }}
                      >×</button>
                    )}
                  </div>
                  {(() => {
                    let left = LABEL_W;
                    return cols.map((col) => {
                      const cw = colWidthOf(col.id);
                      const divider = (
                        <div
                          key={col.id}
                          style={{
                            position: "absolute",
                            left: left, top: 0,
                            width: cw, height: lh,
                            borderRight: `1px dashed ${C.border}`,
                          }}
                        />
                      );
                      left += cw;
                      return divider;
                    });
                  })()}
                </div>
              );
            })}

            {/* Arrows */}
            <svg style={{
              position: "absolute", top: 0, left: 0,
              width: totalW, height: totalH,
              pointerEvents: "none", zIndex: 4,
            }}>
              <defs>
                {CONNECTOR_TYPES.map(ct => (
                  <marker key={ct.key} id={`ah-${ct.key}`} markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orient="auto">
                    <polygon points="0 0, 4 1.5, 0 3" fill={ct.color} />
                  </marker>
                ))}
                <marker id="ag" markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orient="auto">
                  <polygon points="0 0, 4 1.5, 0 3" fill={CONNECTOR_TYPES.find(c => c.key === connType).color} opacity="0.5" />
                </marker>
              </defs>
              {conns.map((conn) => {
                const f = cards.find(c => c.id === conn.from);
                const t = cards.find(c => c.id === conn.to);
                if (!f || !t) return null;
                const ed = cardEdge(f, t);
                const ct = CONNECTOR_TYPES.find(x => x.key === (conn.type || "flow")) || CONNECTOR_TYPES[0];
                const isSelConn = selConn === conn.id;
                // Try smart route; fall back to side-aware bezier
                const smartPath = routeAroundCards(f, t, cards, cardPos);
                const pathD = smartPath || bezier(ed.x1, ed.y1, ed.x2, ed.y2, ed.fromSide, ed.toSide);
                const midX = (ed.x1 + ed.x2) / 2;
                const midY = (ed.y1 + ed.y2) / 2;
                return (
                  <g
                    key={conn.id}
                    style={{ pointerEvents: "auto", cursor: "pointer" }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelConn(isSelConn ? null : conn.id);
                      setSel(null);
                    }}
                  >
                    <path d={pathD} stroke="transparent" fill="none" strokeWidth={20} />
                    <path
                      d={pathD}
                      stroke={ct.color} fill="none"
                      strokeWidth={isSelConn ? ct.width + 1.5 : ct.width}
                      strokeLinecap="round"
                      strokeDasharray={ct.dash === "none" ? "0" : ct.dash}
                      markerEnd={`url(#ah-${ct.key})`}
                      opacity={isSelConn ? 1 : 0.75}
                    />
                    {conn.label && (
                      <g>
                        <rect
                          x={midX - conn.label.length * 3.5 - 6} y={midY - 10}
                          width={conn.label.length * 7 + 12} height={20}
                          rx={10} fill="#fff" stroke={ct.color} strokeWidth={1}
                        />
                        <text x={midX} y={midY + 4} textAnchor="middle"
                          fontSize={11} fontWeight="600" fill={ct.color}
                          fontFamily={FONT_SANS}>{conn.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}
              {linking && linkFrom && (function () {
                const f = cards.find(c => c.id === linkFrom);
                if (!f) return null;
                const fc = cardCenterOf(f);
                const ct = CONNECTOR_TYPES.find(c => c.key === connType);
                return (
                  <path
                    d={bezier(fc.x, fc.y, mouse.x, mouse.y)}
                    stroke={ct.color} fill="none" strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray={ct.dash === "none" ? "4 4" : ct.dash}
                    markerEnd="url(#ag)"
                    opacity={0.55}
                  />
                );
              })()}
            </svg>

            {/* Cards */}
            {cards.map((card) => {
              const isSel = sel === card.id;
              const isLS = linkFrom === card.id;
              const st = STATUS_LIST.find(s => s.key === card.status) || STATUS_LIST[0];
              const lane = lanes.find(l => l.id === card.laneId);
              const laneTint = LANE_TINTS[(lane?.color || 0) % 5];
              const isEditing = editField && editField.cardId === card.id;
              const isDragging = drag && drag.cardId === card.id;
              const pos = isDragging ? { x: drag.freeX, y: drag.freeY } : cardPos(card);
              const hasDetail = card.sourceSystem || card.smes || card.process;
              const isNew = card.createdAt && Date.now() - card.createdAt < 500;
              return (
                <div
                  key={card.id}
                  className={`card-el wfm-card ${isDragging ? "wfm-dragging" : ""} ${isLS ? "wfm-linking" : ""} ${isNew ? "wfm-card-new" : ""}`}
                  onMouseDown={(e) => startDrag(e, card.id)}
                  onClick={(e) => onCardClick(e, card.id)}
                  onDoubleClick={(e) => onCardDblClick(e, card.id)}
                  onMouseEnter={() => setHoverCard(card.id)}
                  onMouseLeave={() => setHoverCard(null)}
                  style={{
                    position: "absolute",
                      left: pos.x, top: pos.y,
                      width: CARD_W, height: CARD_H,
                      background: isLS
                        ? `linear-gradient(135deg, ${C.accentSoft} 0%, ${C.accentMed} 100%)`
                        : st.bg !== "transparent"
                        ? `linear-gradient(180deg, #fff 0%, ${st.bg} 100%)`
                        : `linear-gradient(180deg, #fff 0%, ${C.surfaceTint} 100%)`,
                    border: `1.5px solid ${isSel ? C.accent : isLS ? C.accent : C.border}`,
                    borderTop: `3px solid ${isSel ? C.accent : st.key !== "none" ? st.color : laneTint.accent}`,
                    borderRadius: 10, padding: "6px 10px 5px",
                    cursor: linking ? "crosshair" : "grab",
                    userSelect: "none",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    boxShadow: isSel
                      ? `0 0 0 3px ${C.accentMed}, 0 14px 30px rgba(0,94,184,0.15), 0 4px 10px rgba(16,35,59,0.06)`
                      : isDragging
                        ? "0 20px 36px rgba(16,35,59,0.18), 0 6px 12px rgba(16,35,59,0.08)"
                        : "0 8px 18px rgba(16,35,59,0.08), 0 1px 4px rgba(16,35,59,0.04)",
                    zIndex: isDragging ? 50 : isSel ? 10 : hoverCard === card.id ? 8 : 5,
                    opacity: isDragging ? 0.95 : 1,
                    transform: isDragging ? "rotate(1deg)" : "none",
                    overflow: "visible",
                  }}
                >
                  <StatusBadge status={card.status} />
                  <PriorityTag priority={card.priority} />
                  {isEditing && editField.field === "title" ? (
                    <input
                      autoFocus
                      value={card.title}
                      onChange={(e) => updateCard(card.id, { title: e.target.value })}
                      onBlur={() => setEditField(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                        if (e.key === "Escape") setEditField(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="Step name…"
                      style={{
                        background: "transparent", border: "none",
                        borderBottom: `2px solid ${C.accent}`,
                        fontWeight: 700, fontSize: 11, color: C.text,
                        outline: "none", padding: "1px 0", width: "100%",
                        fontFamily: FONT_SANS,
                        letterSpacing: "-0.01em",
                      }}
                    />
                  ) : (
                    <div style={{
                      fontWeight: 700, fontSize: 11, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: card.title ? C.text : C.textFaint,
                      letterSpacing: "-0.01em",
                    }}>
                      {card.title || "Dbl-click to name…"}
                    </div>
                  )}
                  {hasDetail && (
                    <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                      {card.sourceSystem && <Chip color={C.accent}>{card.sourceSystem}</Chip>}
                      {card.smes && (
                        <Chip color={C.purple}>
                          {card.smes.split(",")[0].trim()}
                          {card.smes.indexOf(",") >= 0 ? " +" : ""}
                        </Chip>
                      )}
                      {card.process && <Chip color={C.green}>Process</Chip>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Free-text annotations */}
            {annotations.map((note) => {
              const isEditing = editAnnotation === note.id;
              return (
                <div
                  key={note.id}
                  className="card-el"
                  onMouseDown={(e) => {
                    if (isEditing) return;
                    e.stopPropagation();
                    const p = toCanvas(e);
                    setDrag({ cardId: `note-${note.id}`, ox: p.x - note.x, oy: p.y - note.y, freeX: note.x, freeY: note.y, isNote: true, noteId: note.id });
                  }}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditAnnotation(note.id); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: drag && drag.noteId === note.id ? drag.freeX : note.x,
                    top: drag && drag.noteId === note.id ? drag.freeY : note.y,
                    minWidth: 120, maxWidth: 300, minHeight: 40,
                    background: C.amberSoft,
                    border: `1.5px solid ${C.amber}44`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: isEditing ? "text" : "grab",
                    zIndex: 6,
                    boxShadow: "0 4px 14px rgba(185,137,0,0.12), 0 1px 3px rgba(0,0,0,0.04)",
                    fontFamily: FONT_SANS,
                    fontSize: 12, color: C.text, lineHeight: 1.5,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    userSelect: isEditing ? "text" : "none",
                  }}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={note.text}
                      onChange={(e) => setAnnotations(p => p.map(n => n.id === note.id ? { ...n, text: e.target.value } : n))}
                      onBlur={() => {
                        setEditAnnotation(null);
                        // Remove empty notes
                        if (!note.text.trim()) {
                          setAnnotations(p => p.filter(n => n.id !== note.id));
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === "Escape") { e.target.blur(); } }}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="Type a note…"
                      style={{
                        background: "transparent", border: "none", outline: "none",
                        resize: "both", width: "100%", minHeight: 40,
                        fontFamily: FONT_SANS, fontSize: 12, color: C.text,
                        lineHeight: 1.5, padding: 0,
                      }}
                    />
                  ) : (
                    <>
                      <div style={{
                        fontSize: 8, fontWeight: 800, color: C.amber,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        marginBottom: 3,
                      }}>NOTE</div>
                      <div>{note.text || "Double-click to edit…"}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); snap(); setAnnotations(p => p.filter(n => n.id !== note.id)); showToast("Note removed"); }}
                        style={{
                          position: "absolute", top: 4, right: 6,
                          background: "none", border: "none",
                          color: C.amber, fontSize: 13, cursor: "pointer",
                          padding: 0, lineHeight: 1, opacity: 0.5,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; }}
                      >×</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connection editor popup */}
          {selConn && (() => {
            const conn = conns.find(c => c.id === selConn);
            if (!conn) return null;
            const f = cards.find(c => c.id === conn.from);
            const t = cards.find(c => c.id === conn.to);
            if (!f || !t) return null;
            return (
              <ConnectionPopup
                conn={conn}
                onChangeType={(type) => { snap(); setConns(p => p.map(c => c.id === conn.id ? { ...c, type } : c)); }}
                onChangeLabel={(label) => setConns(p => p.map(c => c.id === conn.id ? { ...c, label } : c))}
                onDelete={() => { snap(); setConns(p => p.filter(c => c.id !== conn.id)); setSelConn(null); showToast("Connection removed"); }}
                onClose={() => setSelConn(null)}
              />
            );
          })()}

          {/* MINIMAP */}
          <Minimap
            totalW={totalW} totalH={totalH}
            pan={pan} zoom={zoom}
            canvasRef={canvasRef}
            cards={cards} lanes={lanes} cols={cols}
            cardPos={cardPos}
            laneTopOf={laneTopOf} laneHeightOf={laneHeightOf}
            colLeft={colLeft} colWidthOf={colWidthOf}
            titleBlockH={titleBlockH}
            onNav={(newPan) => setPan(newPan)}
          />

          {toast && (
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              background: C.text, color: C.surface,
              padding: "10px 22px", borderRadius: 100,
              fontSize: 13, fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.08)",
              zIndex: 100, pointerEvents: "none",
              letterSpacing: "-0.01em",
              animation: `wfm-toast-in 0.25s ${EASE}`,
              border: `1px solid ${C.borderStrong}`,
            }}>{toast}</div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {showPanel && (
          <div className="detail-panel wfm-scrollbar" style={{
            width: 380, background: C.surface,
            borderLeft: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", flexShrink: 0,
            boxShadow: "-16px 0 36px rgba(16,35,59,0.08)",
          }}>
            <div style={{
              display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0,
              background: `linear-gradient(180deg, ${C.surfaceTint} 0%, ${C.surfaceSoft} 100%)`,
            }}>
              <button
                onClick={() => setPanel("board")}
                style={{
                  ...tabBtnStyle,
                  borderBottom: panel === "board" ? `2px solid ${C.accent}` : "2px solid transparent",
                  color: panel === "board" ? C.accent : C.textMuted,
                }}
              >Board Info</button>
              <button
                onClick={() => { if (selCard) setPanel("card"); }}
                style={{
                  ...tabBtnStyle,
                  borderBottom: (panel === "card" && selCard) ? `2px solid ${C.accent}` : "2px solid transparent",
                  color: (panel === "card" && selCard) ? C.accent : C.textMuted,
                  opacity: selCard ? 1 : 0.4,
                }}
              >Step Details</button>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => { setSel(null); setPanel("board"); }}
                className="wfm-close"
                style={{
                  background: "none", border: "none",
                  color: C.textFaint, cursor: "pointer",
                  fontSize: 18, padding: "0 16px",
                  transition: `all 0.15s ${EASE}`,
                }}
              >✕</button>
            </div>

            <div
              className="wfm-scrollbar"
              style={{
                padding: 20, display: "flex", flexDirection: "column",
                gap: 14, overflow: "auto", flex: 1,
              }}
            >
              {panel === "board" && (
                <BoardInfoPanel
                  meta={meta}
                  updateMeta={updateMeta}
                  stats={{ cards: cards.length, conns: conns.length, lanes: lanes.length, cols: cols.length }}
                />
              )}
              {panel === "card" && selCard && (
                <CardDetailPanel
                  card={selCard}
                  cols={cols}
                  lanes={lanes}
                  conns={conns}
                  updateCard={(patch) => updateCard(sel, patch)}
                  snap={snap}
                  onDelete={() => {
                    snap();
                    setCards(p => p.filter(c => c.id !== sel));
                    setConns(p => p.filter(c => c.from !== sel && c.to !== sel));
                    setSel(null);
                    showToast("Deleted");
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════ PANELS ══════ */
function BoardInfoPanel({ meta, updateMeta, stats }) {
  return (
    <>
      <div style={{
        padding: "14px 16px",
        borderRadius: 14,
        background: `linear-gradient(135deg, ${C.accentDark} 0%, ${C.navySoft} 58%, ${C.accent} 100%)`,
        color: "#fff",
        boxShadow: "0 14px 30px rgba(13,34,64,0.16)",
        marginBottom: 6,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.72)",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: 6,
        }}>Executive Summary</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>
          {meta.title || "Untitled Workflow"}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.82)" }}>
          {meta.description || "Capture the purpose, ownership, and operating context for this workflow so leaders can review the map quickly."}
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: -4,
      }}>Overview</div>
      <Field label="Board Title">
        <input value={meta.title} onChange={(e) => updateMeta({ title: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Governance Lifecycle v2" />
      </Field>
      <Field label="Description / Purpose">
        <textarea value={meta.description} onChange={(e) => updateMeta({ description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="What is this workflow about? What problem does it solve?" />
      </Field>
      <Field label="Initiative / Project">
        <input value={meta.initiative} onChange={(e) => updateMeta({ initiative: e.target.value })} style={inputStyle} className="wfm-input" placeholder="AI Governance Portal, CMS Dashboard…" />
      </Field>
      <Field label="Department">
        <input value={meta.department} onChange={(e) => updateMeta({ department: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Quality, Informatics, Analytics…" />
      </Field>
      <Divider />
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: -4, marginTop: 4,
      }}>People</div>
      <Field label="Owner / Facilitator">
        <input value={meta.owner} onChange={(e) => updateMeta({ owner: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Who owns this workflow?" />
      </Field>
      <Field label="Participants / Stakeholders">
        <textarea value={meta.participants} onChange={(e) => updateMeta({ participants: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="Names, roles, or teams involved" />
      </Field>
      <Divider />
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: -4, marginTop: 4,
      }}>Metadata</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Version">
          <input value={meta.version} onChange={(e) => updateMeta({ version: e.target.value })} style={{ ...inputStyle, width: 80, fontFamily: "'JetBrains Mono', monospace" }} className="wfm-input" placeholder="1.0" />
        </Field>
        <Field label="Board Status">
          <select value={meta.boardStatus} onChange={(e) => updateMeta({ boardStatus: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} className="wfm-select">
            {BOARD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Created">
          <input type="date" value={meta.createdDate} onChange={(e) => updateMeta({ createdDate: e.target.value })} style={{ ...inputStyle, fontSize: 13 }} className="wfm-input" />
        </Field>
        <Field label="Modified">
          <span style={{
            fontSize: 13, color: C.textMuted, padding: "10px 0",
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
          }}>{meta.modifiedDate}</span>
        </Field>
      </div>
      <Field label="Tags">
        <input value={meta.tags} onChange={(e) => updateMeta({ tags: e.target.value })} style={inputStyle} className="wfm-input" placeholder="governance, quality, CMS, prototype…" />
      </Field>
      <Divider />
      <div style={{
        display: "flex", gap: 16, padding: "4px 2px",
        fontSize: 12, color: C.textMuted, fontWeight: 500,
      }}>
        <StatItem label="Steps" value={stats.cards} />
        <StatItem label="Links" value={stats.conns} />
        <StatItem label="Lanes" value={stats.lanes} />
        <StatItem label="Cols" value={stats.cols} />
      </div>
    </>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        fontSize: 20, fontWeight: 700, color: C.text,
        fontFamily: FONT_SERIF, fontStyle: "italic",
      }}>{value}</span>
      <span style={{
        fontSize: 10, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.08em",
        fontWeight: 600,
      }}>{label}</span>
    </div>
  );
}

/* ══════ TITLE BLOCK (collapsible on-canvas header) ══════ */
function TitleBlock({ meta, totalW, stats, collapsed, onToggle }) {
  const tone = boardStatusTone(meta.boardStatus);
  const h = collapsed ? TITLE_BLOCK_COLLAPSED : TITLE_BLOCK_EXPANDED;

  // Both states share the same dark bar layout, expanded just adds description
  return (
    <div style={{
      position: "absolute", top: 0, left: 0,
      width: totalW, height: h,
      background: `linear-gradient(90deg, ${C.accentDark} 0%, ${C.navySoft} 100%)`,
      borderBottom: `2px solid ${C.accentDark}`,
      display: "flex", alignItems: "center",
      fontFamily: FONT_SANS,
      zIndex: 7,
      boxShadow: "0 4px 16px rgba(16,35,59,0.08)",
      overflow: "hidden",
      transition: `height 0.2s ${EASE}`,
      padding: "0 20px",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase", letterSpacing: "0.1em",
        flexShrink: 0,
      }}>BSWH</span>
      <span style={{
        fontSize: 15, fontWeight: 700, color: "#fff",
        letterSpacing: "-0.02em",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        flex: 1, minWidth: 0, marginLeft: 14,
      }}>{meta.title || "Untitled Workflow"}</span>
      {!collapsed && meta.description && (
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.55)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 300, flexShrink: 1, marginRight: 8,
          fontStyle: "italic",
        }}>{meta.description}</span>
      )}
      <span style={{
        fontSize: 10, fontWeight: 700, color: tone.color,
        background: tone.bg, border: `1px solid ${tone.border}`,
        padding: "2px 8px", borderRadius: 12,
        textTransform: "uppercase", letterSpacing: "0.06em",
        flexShrink: 0, marginLeft: 8,
      }}>{meta.boardStatus}</span>
      <span style={{
        fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)",
        fontFamily: "'JetBrains Mono', monospace",
        flexShrink: 0, marginLeft: 10,
      }}>v{meta.version}</span>
      <span style={{
        fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)",
        fontFamily: "'JetBrains Mono', monospace",
        flexShrink: 0, marginLeft: 10,
      }}>{stats.cards} steps</span>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.8)",
          borderRadius: 6, padding: "3px 10px",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: FONT_SANS,
          flexShrink: 0, marginLeft: 12,
          transition: `all 0.15s ${EASE}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
      >{collapsed ? "▾" : "▴"}</button>
    </div>
  );
}

/* ══════ CONNECTOR TYPE PICKER ══════ */
function ConnectorTypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = CONNECTOR_TYPES.find(c => c.key === value) || CONNECTOR_TYPES[0];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="wfm-btn"
        style={{
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          color: C.text,
          padding: "7px 12px",
          borderRadius: 9,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: FONT_SANS,
        }}
      >
        <ConnectorPreview type={current} />
        <span>{current.label}</span>
        <span style={{ fontSize: 9, color: C.textFaint, marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 198 }}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)",
            minWidth: 220, zIndex: 199,
          }}>
            {CONNECTOR_TYPES.map(ct => (
              <button
                key={ct.key}
                onClick={() => { onChange(ct.key); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 7,
                  background: value === ct.key ? C.accentSoft : "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: FONT_SANS, textAlign: "left",
                  transition: `background 0.15s ${EASE}`,
                }}
                onMouseEnter={(e) => { if (value !== ct.key) e.currentTarget.style.background = C.surfaceSoft; }}
                onMouseLeave={(e) => { if (value !== ct.key) e.currentTarget.style.background = "transparent"; }}
              >
                <ConnectorPreview type={ct} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{ct.label}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{ct.desc}</div>
                </div>
                {value === ct.key && <span style={{ color: C.accent, fontWeight: 800, fontSize: 14 }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ConnectorPreview({ type }) {
  return (
    <svg width="28" height="10" style={{ flexShrink: 0 }}>
      <line
        x1={2} y1={5} x2={22} y2={5}
        stroke={type.color}
        strokeWidth={type.width}
        strokeLinecap="round"
        strokeDasharray={type.dash === "none" ? "0" : type.dash}
      />
      <polygon points={`22,1 28,5 22,9`} fill={type.color} />
    </svg>
  );
}

/* ══════ CONNECTION POPUP ══════ */
function ConnectionPopup({ conn, onChangeType, onChangeLabel, onDelete, onClose }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: 80, right: 24, zIndex: 90,
        background: C.surface, border: `1.5px solid ${C.border}`,
        borderRadius: 14, padding: 14, width: 280,
        boxShadow: "0 16px 34px rgba(16,35,59,0.16), 0 4px 10px rgba(16,35,59,0.05)",
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: C.textFaint,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>Connector Details</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: C.textFaint,
          cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1,
        }}>✕</button>
      </div>

      <div style={{
        fontSize: 10, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 6,
      }}>Type</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
        {CONNECTOR_TYPES.map(ct => {
          const active = (conn.type || "flow") === ct.key;
          return (
            <button
              key={ct.key}
              onClick={() => onChangeType(ct.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", borderRadius: 7,
                background: active ? C.accentSoft : "transparent",
                border: `1.5px solid ${active ? C.accent + "55" : "transparent"}`,
                cursor: "pointer", fontFamily: FONT_SANS, textAlign: "left",
                transition: `all 0.15s ${EASE}`,
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surfaceSoft; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <ConnectorPreview type={ct} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>{ct.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{
        fontSize: 10, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 6,
      }}>Label (optional)</div>
      <input
        value={conn.label || ""}
        onChange={(e) => onChangeLabel(e.target.value)}
        placeholder="e.g. if approved"
        style={{
          ...inputStyle, marginBottom: 12,
          fontSize: 13,
        }}
      />

      <button
        onClick={onDelete}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = C.redSoft; e.currentTarget.style.color = C.red; }}
        style={{
          width: "100%",
          padding: "8px 14px", borderRadius: 8,
          border: `1.5px solid ${C.red}`, background: C.redSoft,
          color: C.red, fontWeight: 700, fontSize: 12,
          cursor: "pointer", fontFamily: FONT_SANS,
          transition: `all 0.2s ${EASE}`,
          letterSpacing: "-0.01em",
        }}
      >Delete Connection</button>
    </div>
  );
}


/* ══════ MINIMAP ══════ */
function Minimap({ totalW, totalH, pan, zoom, canvasRef, cards, lanes, cols, cardPos, laneTopOf, laneHeightOf, colLeft, colWidthOf, titleBlockH, onNav }) {
  const MAP_W = 180;
  const MAP_H = 120;
  const scale = Math.min(MAP_W / (totalW + 60), MAP_H / (totalH + 60));

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / scale;
    const my = (e.clientY - rect.top) / scale;
    if (!canvasRef.current) return;
    const cr = canvasRef.current.getBoundingClientRect();
    onNav({
      x: -(mx - (cr.width / zoom) / 2),
      y: -(my - (cr.height / zoom) / 2),
    });
  };

  // Viewport rect
  let vpX = 0, vpY = 0, vpW = MAP_W, vpH = MAP_H;
  if (canvasRef.current) {
    const cr = canvasRef.current.getBoundingClientRect();
    vpX = (-pan.x) * scale;
    vpY = (-pan.y) * scale;
    vpW = (cr.width / zoom) * scale;
    vpH = (cr.height / zoom) * scale;
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: "absolute", bottom: 14, right: 14, zIndex: 150,
        width: MAP_W, height: MAP_H,
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(16,35,59,0.12)",
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <svg width={MAP_W} height={MAP_H} style={{ display: "block" }}>
        {/* Lane backgrounds */}
        {lanes.map(lane => {
          const lt = laneTopOf(lane.id);
          const lh = laneHeightOf(lane.id);
          const tint = LANE_TINTS[lane.color % 5];
          return (
            <rect key={lane.id}
              x={LABEL_W * scale} y={lt * scale}
              width={(totalW - LABEL_W) * scale} height={lh * scale}
              fill={tint.accent} opacity={0.08}
            />
          );
        })}
        {/* Cards as small dots */}
        {cards.map(card => {
          const p = cardPos(card);
          const lane = lanes.find(l => l.id === card.laneId);
          const tint = LANE_TINTS[(lane?.color || 0) % 5];
          return (
            <rect key={card.id}
              x={p.x * scale} y={p.y * scale}
              width={CARD_W * scale} height={CARD_H * scale}
              rx={2} fill={tint.accent} opacity={0.6}
            />
          );
        })}
        {/* Viewport rectangle */}
        <rect
          x={Math.max(0, vpX)} y={Math.max(0, vpY)}
          width={vpW} height={vpH}
          fill="none"
          stroke={C.accent} strokeWidth={1.5}
          rx={2} opacity={0.7}
        />
      </svg>
    </div>
  );
}

/* ══════ STRUCTURE MENU ══════ */
function StructureMenu({ fields, onApply, onClose }) {
  const [colField, setColField] = useState("status");
  const [rowField, setRowField] = useState("sourceSystem");
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 299,
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 12, padding: 16, width: 260,
      boxShadow: "0 12px 32px rgba(16,35,59,0.16)",
      fontFamily: FONT_SANS,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        Organize Board
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        Columns (group by)
      </div>
      <select
        value={colField} onChange={(e) => setColField(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12, fontSize: 13, cursor: "pointer" }}
      >
        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        Rows (group by)
      </div>
      <select
        value={rowField} onChange={(e) => setRowField(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14, fontSize: 13, cursor: "pointer" }}
      >
        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onApply(colField, rowField)}
          style={{
            flex: 1, padding: "9px 14px", borderRadius: 9,
            background: C.accent, border: "none", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >Apply</button>
        <button
          onClick={onClose}
          style={{
            padding: "9px 14px", borderRadius: 9,
            background: C.surfaceSoft, border: `1.5px solid ${C.border}`,
            color: C.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

function CardDetailPanel({ card, cols, lanes, conns, updateCard, snap, onDelete }) {
  return (
    <>
      <div style={{
        padding: "14px 16px",
        borderRadius: 14,
        background: `linear-gradient(135deg, ${C.surfaceTint} 0%, ${C.surfaceSoft} 100%)`,
        border: `1px solid ${C.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
        marginBottom: 6,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Step Summary
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.accentDark, letterSpacing: "-0.03em", marginBottom: 4 }}>
          {card.title || "Unnamed Step"}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
          Use this panel to brief stakeholders on ownership, systems, risks, and decision points for the selected workflow step.
        </div>
      </div>
      <Field label="Step Name">
        <input value={card.title} onChange={(e) => updateCard({ title: e.target.value })} style={inputStyle} className="wfm-input" placeholder="e.g. Triage & Scope" autoFocus />
      </Field>
      <Field label="Status">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {STATUS_LIST.map(s => {
            const active = card.status === s.key;
            return (
              <button
                key={s.key}
                onClick={() => { snap(); updateCard({ status: s.key }); }}
                className={`wfm-pill ${active ? "wfm-pill-active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 11px", borderRadius: 20,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${active ? s.color : C.border}`,
                  background: active ? s.bg : C.surface,
                  color: active ? s.color : C.textMuted,
                  fontFamily: FONT_SANS,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Priority">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {PRIORITY_LIST.map(p => {
            const active = card.priority === p.key;
            return (
              <button
                key={p.key}
                onClick={() => { snap(); updateCard({ priority: p.key }); }}
                className={`wfm-pill ${active ? "wfm-pill-active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 20,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${active ? p.color : C.border}`,
                  background: active ? p.color + "12" : C.surface,
                  color: active ? p.color : C.textMuted,
                  fontFamily: FONT_SANS,
                }}
              >
                <span style={{ fontSize: 12, lineHeight: 1 }}>{p.icon}</span>
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Divider />
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: -4,
      }}>Context</div>
      <Field label="Source System(s)">
        <input value={card.sourceSystem} onChange={(e) => updateCard({ sourceSystem: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Epic, Snowflake, MIDAS, CMS API…" />
      </Field>
      <Field label="Key SMEs / Owners">
        <input value={card.smes} onChange={(e) => updateCard({ smes: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Names or roles, comma-separated" />
      </Field>
      <Field label="Process / Method">
        <textarea value={card.process} onChange={(e) => updateCard({ process: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="Manual, automated, hybrid?" />
      </Field>
      <Divider />
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textFaint,
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: -4,
      }}>Details</div>
      <Field label="Key Data Elements / CDEs">
        <input value={card.dataElements} onChange={(e) => updateCard({ dataElements: e.target.value })} style={inputStyle} className="wfm-input" placeholder="Encounter ID, NPI, Measure Score…" />
      </Field>
      <Field label="Decisions / Gates">
        <textarea value={card.decisions} onChange={(e) => updateCard({ decisions: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="Go/no-go criteria?" />
      </Field>
      <Field label="Risks / Open Questions">
        <textarea value={card.risks} onChange={(e) => updateCard({ risks: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="Data quality gaps, dependencies…" />
      </Field>
      <Field label="Notes">
        <textarea value={card.notes} onChange={(e) => updateCard({ notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} className="wfm-textarea" placeholder="Meeting notes, follow-ups…" />
      </Field>
      <Divider />
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Column">
          <select value={card.colId} onChange={(e) => { snap(); updateCard({ colId: e.target.value }); }} style={{ ...inputStyle, cursor: "pointer" }} className="wfm-select">
            {cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Lane">
          <select value={card.laneId} onChange={(e) => { snap(); updateCard({ laneId: e.target.value }); }} style={{ ...inputStyle, cursor: "pointer" }} className="wfm-select">
            {lanes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>
        {conns.filter(c => c.from === card.id || c.to === card.id).length} connection(s) · <kbd style={kbdStyle}>Delete</kbd> to remove
      </div>
      <button
        onClick={onDelete}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.red;
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.redSoft;
          e.currentTarget.style.color = C.red;
        }}
        style={{
          padding: "10px 16px", borderRadius: 10,
          border: `1.5px solid ${C.red}`, background: C.redSoft,
          color: C.red, fontWeight: 700, fontSize: 13,
          cursor: "pointer", marginTop: 4, textAlign: "center",
          fontFamily: FONT_SANS,
          transition: `all 0.2s ${EASE}`,
          letterSpacing: "-0.01em",
        }}
      >Delete Step</button>
    </>
  );
}
