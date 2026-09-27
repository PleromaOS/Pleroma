// The small drawings on the word answers (W46, locked: "stacked with drawings").
//
// Deliberately simple, flat shapes: they are read before the words, so the
// client barely has to read. Gold marks the part that differs between the
// answers of one question (the bar that is filled, the line that moves).
// Placeholders until the photo and illustration pass; an unknown key draws
// nothing and the card still works (W46 rule).

const G = "var(--gold)", INK = "currentColor", DIM = "var(--line-strong)";

const bars = (n: number) => (
  <>{[0, 1, 2].map((i) => <rect key={i} x={8 + i * 9} y={10} width={6} height={22} rx={1.5} fill={i < n ? G : DIM} />)}</>
);
const head = <path d="M10 34 V18 a10 10 0 0 1 20 0 V34" fill="none" stroke={INK} strokeWidth={1.6} />;
const lineAt = (y: number) => <line x1={6} y1={y} x2={34} y2={y} stroke={G} strokeWidth={2.4} strokeLinecap="round" />;
// How much hair is left: more short strokes = more hair. Strokes, not shades,
// so the meaning holds in the dark theme too (a darker fill turns lighter there).
const strokes = (n: number) => (
  <><rect x={8} y={8} width={24} height={24} rx={4} fill="none" stroke={DIM} strokeWidth={1.4} />
    {Array.from({ length: n }, (_, i) => {
      const cols = 4, x = 12 + (i % cols) * 5.4, y = 13 + Math.floor(i / cols) * 5;
      return <line key={i} x1={x} y1={y} x2={x + 1.6} y2={y + 3.2} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
    })}</>
);
const fringe = (len: number) => (<>{head}<path d={`M10 18 Q20 ${10 + len} 30 18`} fill="none" stroke={G} strokeWidth={2.4} /><rect x={12} y={14} width={16} height={len} rx={2} fill={G} opacity={0.5} /></>);

const D: Record<string, React.ReactNode> = {
  "effort-1": bars(1), "effort-2": bars(2), "effort-3": bars(3),
  "height-1": bars(1), "height-2": bars(2), "height-3": bars(3),
  "layers-1": bars(1), "layers-2": bars(3),
  keep: <path d="M10 21 l7 7 l13 -15" fill="none" stroke={G} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />,
  change: <><path d="M9 15 h20 l-5 -5 M31 25 h-20 l5 5" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></>,
  // Sides, seen from the side: dark = hair, light = skin.
  "side-faded": <><defs><linearGradient id="dfade" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={INK} stopOpacity={0} /><stop offset="1" stopColor={INK} stopOpacity={1} /></linearGradient></defs><rect x={9} y={6} width={22} height={28} rx={4} fill="url(#dfade)" /></>,
  "side-tapered": <><rect x={9} y={6} width={22} height={28} rx={4} fill={INK} /><rect x={9} y={27} width={22} height={7} fill={G} opacity={0.7} /></>,
  "side-hardline": <><rect x={9} y={6} width={22} height={12} rx={3} fill={INK} /><rect x={9} y={20} width={22} height={14} rx={3} fill={INK} opacity={0.25} />{lineAt(19)}</>,
  "side-long": <rect x={9} y={6} width={22} height={28} rx={4} fill={INK} />,
  // How close: from skin (no strokes) to darker (many).
  "shade-1": strokes(0), "shade-2": strokes(4), "shade-3": strokes(8), "shade-4": strokes(16),
  // Where the fade starts: the line moves up the head.
  "height-low": <>{head}{lineAt(29)}</>, "height-mid": <>{head}{lineAt(23)}</>, "height-high": <>{head}{lineAt(16)}</>,
  "height-drop": <>{head}<path d="M8 20 Q22 20 26 30 L34 30" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" /></>,
  "fade-classic": <>{head}{lineAt(24)}</>,
  "fade-drop": <>{head}<path d="M6 22 H20 Q26 22 28 30 H34" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" /></>,
  "fade-burst": <>{head}<path d="M12 30 A8 8 0 0 1 28 30" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" /></>,
  // Edges
  "line-sharp": <><rect x={8} y={8} width={24} height={14} rx={2} fill={INK} />{lineAt(23)}</>,
  "line-soft": <><defs><linearGradient id="dsoft" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stopColor={INK} stopOpacity={1} /><stop offset="1" stopColor={INK} stopOpacity={0} /></linearGradient></defs><rect x={8} y={8} width={24} height={20} rx={2} fill="url(#dsoft)" /></>,
  "line-natural": <path d="M8 8 H32 V20 Q28 26 24 21 Q20 27 16 21 Q12 26 8 21 Z" fill={INK} />,
  "neck-tapered": <><defs><linearGradient id="dneck" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stopColor={INK} stopOpacity={1} /><stop offset="1" stopColor={INK} stopOpacity={0} /></linearGradient></defs><rect x={10} y={6} width={20} height={28} rx={3} fill="url(#dneck)" /></>,
  "neck-square": <><rect x={10} y={6} width={20} height={20} rx={1} fill={INK} />{lineAt(27)}</>,
  "neck-round": <path d="M10 6 H30 V20 A10 10 0 0 1 10 20 Z" fill={INK} />,
  "neck-v": <path d="M10 6 H30 V18 L20 30 L10 18 Z" fill={INK} />,
  // Beard
  stubble: <>{[12, 18, 24, 15, 21, 27, 12, 18, 24].map((x, i) => <circle key={i} cx={x + (i > 5 ? 2 : 0)} cy={16 + Math.floor(i / 3) * 6} r={1.4} fill={INK} />)}</>,
  grow: <path d="M20 32 V10 M12 18 L20 10 L28 18" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />,
  shorter: <path d="M20 8 V30 M12 22 L20 30 L28 22" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />,
  shape: <><circle cx={13} cy={27} r={4} fill="none" stroke={INK} strokeWidth={1.8} /><circle cx={27} cy={27} r={4} fill="none" stroke={INK} strokeWidth={1.8} /><path d="M15 24 L28 9 M25 24 L12 9" stroke={G} strokeWidth={2.2} strokeLinecap="round" /></>,
  shave: <><rect x={8} y={12} width={24} height={9} rx={2} fill={INK} /><line x1={8} y1={24} x2={32} y2={24} stroke={G} strokeWidth={2.4} strokeLinecap="round" /><rect x={18} y={21} width={4} height={12} rx={2} fill={INK} opacity={0.6} /></>,
  "beard-square": <path d="M8 8 V24 Q8 30 14 30 H26 Q32 30 32 24 V8" fill="none" stroke={G} strokeWidth={3} />,
  "beard-round": <path d="M8 8 V20 A12 12 0 0 0 32 20 V8" fill="none" stroke={G} strokeWidth={3} />,
  "beard-tapered": <path d="M8 8 V18 L20 33 L32 18 V8" fill="none" stroke={G} strokeWidth={3} strokeLinejoin="round" />,
  "beard-natural": <path d="M8 8 V20 Q10 32 20 32 Q30 32 32 20 V8" fill="none" stroke={G} strokeWidth={3} strokeDasharray="3 2" />,
  blend: <><defs><linearGradient id="dblend" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={INK} /><stop offset=".5" stopColor={INK} stopOpacity={0.25} /><stop offset="1" stopColor={INK} /></linearGradient></defs><rect x={12} y={6} width={16} height={28} rx={3} fill="url(#dblend)" /></>,
  separate: <><rect x={12} y={6} width={16} height={11} rx={3} fill={INK} /><rect x={12} y={23} width={16} height={11} rx={3} fill={INK} /></>,
  // Cut details
  "top-same": <rect x={8} y={14} width={24} height={14} rx={3} fill={INK} />,
  "top-longer": <path d="M8 28 V20 H14 V12 H26 V20 H32 V28 Z" fill={INK} />,
  "part-none": <>{head}</>, "part-side": <>{head}<line x1={15} y1={9} x2={15} y2={20} stroke={G} strokeWidth={2.4} /></>,
  "part-middle": <>{head}<line x1={20} y1={8} x2={20} y2={20} stroke={G} strokeWidth={2.4} /></>,
  "fringe-1": fringe(4), "fringe-2": fringe(8), "fringe-3": fringe(12),
  "fringe-straight": <>{head}{lineAt(20)}</>,
  spiked: <path d="M8 30 L12 12 L16 26 L20 8 L24 26 L28 12 L32 30 Z" fill={INK} />,
  curl: <path d="M10 26 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0" fill="none" stroke={G} strokeWidth={2.4} strokeLinecap="round" />,
  "texture-messy": <path d="M8 28 l4 -10 l3 8 l3 -12 l4 10 l3 -8 l3 9 l4 -7 V28 Z" fill={INK} />,
  "back-collar": <><rect x={12} y={6} width={16} height={20} rx={3} fill={INK} />{lineAt(27)}</>,
  "back-below": <><rect x={12} y={6} width={16} height={28} rx={3} fill={INK} />{lineAt(24)}</>,
  "shape-round": <circle cx={20} cy={20} r={12} fill={INK} />,
  "shape-angular": <rect x={8} y={8} width={24} height={24} rx={2} fill={INK} />,
  "finish-wet": <><rect x={8} y={10} width={24} height={20} rx={3} fill={INK} /><path d="M12 15 Q18 12 24 15" fill="none" stroke={G} strokeWidth={2} strokeLinecap="round" /></>,
  "finish-matte": <rect x={8} y={10} width={24} height={20} rx={3} fill={INK} opacity={0.7} />,
  "swept-back": <path d="M8 26 Q12 10 32 12" fill="none" stroke={G} strokeWidth={3} strokeLinecap="round" />,
  "blow-dried": <path d="M8 28 Q10 10 20 10 Q30 10 32 28" fill="none" stroke={G} strokeWidth={3} strokeLinecap="round" />,
};

export function Drawing({ name }: { name?: string }) {
  const art = name ? D[name] : undefined;
  if (!art) return null;
  return <svg viewBox="0 0 40 40" aria-hidden="true">{art}</svg>;
}

export const hasDrawing = (name?: string) => !!(name && D[name]);
