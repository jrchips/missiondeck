// Pre-computed static data (outside components so it never re-allocates)

const BOOK_COLORS = [
  '#2e1850','#0e2840','#28154a','#0e2030','#321428',
  '#24223e','#122038','#2a2040','#20283e','#1c0e3a',
  '#301618','#221414','#182828','#281e1e','#1c2240',
]

function bookColor(i) { return BOOK_COLORS[Math.abs(i) % BOOK_COLORS.length] }

function shelfRow(x0, x1, yPlank, seed) {
  const out = []
  let bx = x0, bi = 0
  while (bx < x1 - 4) {
    const w = 5 + ((bi * 17 + seed) % 8)
    const h = 50 + ((bi * 13 + seed * 2) % 44)
    if (bx + w > x1) break
    out.push({ x: bx, y: yPlank - h, w, h, c: bookColor(bi + seed) })
    bx += w + 1; bi++
  }
  return out
}

const SHELF_Y = [96, 212, 328, 444, 560, 676, 792]
const LEFT_BOOKS  = SHELF_Y.flatMap((y, i) => shelfRow(2,   72,   y, i * 31 + 5))
const RIGHT_BOOKS = SHELF_Y.flatMap((y, i) => shelfRow(1368, 1438, y, i * 29 + 11))

const LIB_DUST = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x:  60 + ((i * 97 +  7) % 1320),
  y:  40 + ((i * 113 + 7) % 820),
  r:  0.6 + ((i * 37) % 14) / 18,
  delay: `${((i * 0.43) % 5).toFixed(2)}s`,
  dur:   `${(3.5 + ((i * 0.35) % 4.5)).toFixed(2)}s`,
}))

const CMD_SPARKS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x:  80 + ((i * 107 + 13) % 1280),
  y:  60 + ((i * 131 + 13) % 780),
  delay: `${((i * 0.38) % 5).toFixed(2)}s`,
  dur:   `${(3.0 + ((i * 0.42) % 4.5)).toFixed(2)}s`,
}))

const TAV_DUST = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x:  100 + ((i * 83 + 11) % 1240),
  y:   80 + ((i * 97 + 11) % 720),
  r:   0.7 + ((i * 31) % 12) / 16,
  delay: `${((i * 0.5) % 5).toFixed(2)}s`,
  dur:   `${(4.0 + ((i * 0.4) % 4.0)).toFixed(2)}s`,
}))

const TAV_SMOKE = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x:  610 + ((i * 43) % 220),
  y:  700 + ((i * 19) % 70),
  rx: 7 + ((i * 7) % 16),
  ry: 13 + ((i * 11) % 20),
  delay: `${((i * 0.7) % 6).toFixed(2)}s`,
  dur:   `${(5.5 + ((i * 0.5) % 3.5)).toFixed(2)}s`,
}))

// ── Torch flame helper (re-used in Library + Tavern) ──────────────
function TorchFlame({ cx, cy, scaleX = 1, phaseOffset = 0 }) {
  const p = phaseOffset.toFixed(2)
  return (
    <g>
      {/* Sconce bracket */}
      <rect x={cx - 8 * scaleX} y={cy + 8} width={16} height={9} fill="#1c1838" rx="2" />
      <rect x={cx - 10 * scaleX} y={cy + 14} width={20} height={3} fill="#161430" rx="1" />
      {/* Flame layers, each with slightly different flicker timing */}
      <ellipse cx={cx} cy={cy}    rx={9}   ry={14} fill="#7a2e00" opacity={0.85}
        style={{ animation: `torchFlicker ${(1.8 + phaseOffset * 0.4).toFixed(1)}s ease-in-out ${p}s infinite` }} />
      <ellipse cx={cx} cy={cy+2}  rx={6}   ry={10} fill="#cc5500"
        style={{ animation: `torchFlicker ${(1.5 + phaseOffset * 0.3).toFixed(1)}s ease-in-out ${(+p + 0.1).toFixed(2)}s infinite` }} />
      <ellipse cx={cx} cy={cy}    rx={3.5} ry={7}  fill="#f4a21e"
        style={{ animation: `torchFlicker ${(1.3 + phaseOffset * 0.2).toFixed(1)}s ease-in-out ${(+p + 0.2).toFixed(2)}s infinite` }} />
      <ellipse cx={cx} cy={cy-3}  rx={2.2} ry={4.5} fill="#ffd060" opacity={0.9}
        style={{ animation: `torchFlicker ${(1.2 + phaseOffset * 0.15).toFixed(1)}s ease-in-out ${(+p + 0.3).toFixed(2)}s infinite` }} />
      <ellipse cx={cx} cy={cy-7}  rx={1.2} ry={3}   fill="#fff8d0" opacity={0.8}
        style={{ animation: `torchFlicker ${(1.1).toFixed(1)}s ease-in-out ${(+p + 0.4).toFixed(2)}s infinite` }} />
    </g>
  )
}

// ── LIBRARY BACKDROP ──────────────────────────────────────────────
export function LibraryBackdrop() {
  return (
    <>
      {/* Layered ambient atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 75% 50% at 50% 0%,   rgba(18,12,38,0.95) 0%, transparent 100%),
          radial-gradient(ellipse 25% 60% at  7% 48%,  rgba(255,200,80,0.09) 0%, transparent 65%),
          radial-gradient(ellipse 25% 60% at 93% 48%,  rgba(255,200,80,0.09) 0%, transparent 65%),
          radial-gradient(ellipse 45% 35% at 50% 55%,  rgba(143,168,255,0.04) 0%, transparent 55%),
          radial-gradient(ellipse 65% 35% at 50% 100%, rgba(5,3,8,0.75) 0%, transparent 100%)
        `,
      }} />

      {/* Left shelf depth shadow */}
      <div style={{
        position: 'absolute', top: 55, left: 0, bottom: 0, width: 80,
        background: 'linear-gradient(90deg, rgba(4,3,14,0.82) 0%, rgba(4,3,14,0.45) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Right shelf depth shadow */}
      <div style={{
        position: 'absolute', top: 55, right: 0, bottom: 0, width: 80,
        background: 'linear-gradient(270deg, rgba(4,3,14,0.82) 0%, rgba(4,3,14,0.45) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        width="100%" height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Ceiling stone arch ── */}
        <path
          d="M 0 125 L 0 95 Q 200 22 420 78 Q 580 30 720 24 Q 860 30 1020 78 Q 1240 22 1440 95 L 1440 125 Z"
          fill="rgba(7,5,20,0.78)"
        />
        <path
          d="M 0 98 Q 200 25 420 80 Q 580 32 720 26 Q 860 32 1020 80 Q 1240 25 1440 98"
          fill="none" stroke="rgba(42,34,74,0.65)" strokeWidth="2.5"
        />
        {/* Keystone */}
        <polygon points="704,26 720,10 736,26" fill="rgba(32,26,60,0.7)" />
        <rect x="711" y="10" width="18" height="5" fill="rgba(44,36,78,0.55)" rx="1" />

        {/* ── LEFT bookshelf ── */}
        {/* Vertical shelf side-panel */}
        <rect x={0} y={55} width={4} height={845} fill="rgba(18,14,32,0.9)" />
        {/* Shelf plank boards */}
        {SHELF_Y.map(y => (
          <rect key={y} x={0} y={y} width={75} height={4} fill="rgba(18,14,32,0.95)" />
        ))}
        {/* Book spines */}
        {LEFT_BOOKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} opacity={0.88} />
        ))}
        {/* Occasional highlighted spine (slightly lighter) */}
        {[0, 7, 18, 31, 44].map(idx => LEFT_BOOKS[idx] && (
          <rect key={`hl${idx}`} x={LEFT_BOOKS[idx].x} y={LEFT_BOOKS[idx].y}
            width={LEFT_BOOKS[idx].w} height={LEFT_BOOKS[idx].h}
            fill="none" stroke="rgba(143,120,200,0.25)" strokeWidth="0.8" />
        ))}

        {/* ── RIGHT bookshelf ── */}
        <rect x={1436} y={55} width={4} height={845} fill="rgba(18,14,32,0.9)" />
        {SHELF_Y.map(y => (
          <rect key={y} x={1365} y={y} width={75} height={4} fill="rgba(18,14,32,0.95)" />
        ))}
        {RIGHT_BOOKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} opacity={0.88} />
        ))}

        {/* ── Left wall torch + halo ── */}
        <ellipse cx={72} cy={56} rx={80} ry={90}
          fill="rgba(255,208,96,0.1)"
          style={{ animation: 'torchFlicker 1.9s ease-in-out infinite' }} />
        <TorchFlame cx={72} cy={50} phaseOffset={0} />

        {/* ── Right wall torch + halo ── */}
        <ellipse cx={1368} cy={56} rx={80} ry={90}
          fill="rgba(255,208,96,0.1)"
          style={{ animation: 'torchFlicker 2.1s ease-in-out 0.2s infinite' }} />
        <TorchFlame cx={1368} cy={50} phaseOffset={0.2} />

        {/* ── Light shafts from torches ── */}
        <path d="M 72 58 L 340 200 L 340 130 Z" fill="rgba(255,208,96,0.018)" />
        <path d="M 1368 58 L 1100 200 L 1100 130 Z" fill="rgba(255,208,96,0.018)" />

        {/* ── Floor knowledge seal (very subtle, sits behind content) ── */}
        <circle cx={720} cy={530} r={210} fill="none" stroke="rgba(143,168,255,0.04)" strokeWidth="1.5" />
        <circle cx={720} cy={530} r={148} fill="none" stroke="rgba(143,168,255,0.03)" strokeWidth="1" />
        <circle cx={720} cy={530} r={80}  fill="none" stroke="rgba(143,168,255,0.025)" strokeWidth="0.8" />
        <line x1={510} y1={530} x2={930} y2={530} stroke="rgba(143,168,255,0.025)" strokeWidth="0.8" />
        <line x1={720} y1={320} x2={720} y2={740} stroke="rgba(143,168,255,0.025)" strokeWidth="0.8" />
        {/* Diagonal runes of the seal */}
        {[45, 135, 225, 315].map(deg => {
          const r = 210, a = deg * Math.PI / 180
          return (
            <line key={deg}
              x1={720 + Math.cos(a) * 80}  y1={530 + Math.sin(a) * 80}
              x2={720 + Math.cos(a) * 210} y2={530 + Math.sin(a) * 210}
              stroke="rgba(143,168,255,0.02)" strokeWidth="0.6" />
          )
        })}

        {/* ── Floating dust motes ── */}
        {LIB_DUST.map(d => (
          <circle key={d.id} cx={d.x} cy={d.y} r={d.r}
            fill="rgba(200,175,240,0.5)"
            style={{ animation: `dustFloat ${d.dur} ease-in-out ${d.delay} infinite` }} />
        ))}

        {/* ── Bottom floor edge ── */}
        <rect x={0} y={896} width={1440} height={4} fill="rgba(12,10,26,0.8)" />
        <line x1={80} y1={892} x2={1360} y2={892} stroke="rgba(28,22,50,0.5)" strokeWidth="1" />
      </svg>
    </>
  )
}

// ── COMMAND CENTER BACKDROP ───────────────────────────────────────
const CMD_CONDUITS = [
  'M 0 0 L 580 450',    // top-left → center
  'M 1440 0 L 860 450', // top-right → center
  'M 0 900 L 600 450',  // bottom-left → center
  'M 1440 900 L 840 450', // bottom-right → center
]
const CMD_CIRCUIT_NODES = [
  [210,210],[380,160],[720,210],[1060,160],[1230,210],
  [140,680],[430,740],[720,710],[1010,740],[1300,680],
  [100,440],[380,395],[720,440],[1060,395],[1340,440],
  [560,300],[880,300],[560,600],[880,600],
]

export function CommandBackdrop() {
  return (
    <>
      {/* Radiance glow at top + soul ambient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 32% at 50% 5%,   rgba(255,208,96,0.14) 0%, transparent 100%),
          radial-gradient(ellipse 85% 55% at 50% 50%,  rgba(143,168,255,0.04) 0%, transparent 100%),
          radial-gradient(ellipse 28% 28% at 12% 82%,  rgba(58,212,192,0.06)  0%, transparent 60%),
          radial-gradient(ellipse 28% 28% at 88% 82%,  rgba(58,212,192,0.06)  0%, transparent 60%),
          radial-gradient(ellipse 65% 28% at 50% 100%, rgba(5,3,8,0.65)       0%, transparent 100%)
        `,
      }} />

      {/* Blueprint grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45,
        backgroundImage: `
          linear-gradient(rgba(143,168,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(143,168,255,0.07) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        width="100%" height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Energy conduits from corners → center ── */}
        {CMD_CONDUITS.map((d, i) => (
          <path key={i} d={d} fill="none"
            stroke={i < 2 ? 'rgba(58,212,192,0.1)' : 'rgba(143,168,255,0.07)'}
            strokeWidth={i < 2 ? 1.5 : 1}
          />
        ))}
        {/* Brighter inner segments near center */}
        {CMD_CONDUITS.map((d, i) => {
          // Approximated inner third points
          const segs = [
            'M 387 300 L 580 450', 'M 1053 300 L 860 450',
            'M 400 600 L 600 450', 'M 1040 600 L 840 450',
          ]
          return (
            <path key={`ci${i}`} d={segs[i]} fill="none"
              stroke={i < 2 ? 'rgba(58,212,192,0.2)' : 'rgba(143,168,255,0.14)'}
              strokeWidth="1.5"
            />
          )
        })}

        {/* ── Horizontal sweep line ── */}
        <line x1={0} y1={450} x2={1440} y2={450}
          stroke="rgba(143,168,255,0.06)" strokeWidth="1" />

        {/* ── Tech corner brackets ── */}
        {[
          'M 22 22 L 22 65 L 65 65',
          'M 1418 22 L 1418 65 L 1375 65',
          'M 22 878 L 22 835 L 65 835',
          'M 1418 878 L 1418 835 L 1375 835',
        ].map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="rgba(58,212,192,0.32)" strokeWidth="2" />
            <path d={d.replace(/22/g, '28').replace(/65/g, '59').replace(/878/g,'872').replace(/835/g,'841').replace(/1418/g,'1412').replace(/1375/g,'1381')}
              fill="none" stroke="rgba(58,212,192,0.14)" strokeWidth="0.8" />
          </g>
        ))}

        {/* ── Measurement ticks along top edge ── */}
        {Array.from({ length: 18 }, (_, i) => (
          <g key={i}>
            <line x1={80 + i * 76} y1={54} x2={80 + i * 76} y2={66}
              stroke="rgba(143,168,255,0.22)" strokeWidth="0.8" />
            <line x1={118 + i * 76} y1={58} x2={118 + i * 76} y2={66}
              stroke="rgba(143,168,255,0.1)" strokeWidth="0.5" />
          </g>
        ))}
        {/* Along bottom */}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={80 + i * 76} y1={834} x2={80 + i * 76} y2={846}
            stroke="rgba(143,168,255,0.18)" strokeWidth="0.8" />
        ))}

        {/* ── Radiance core orb at top-center ── */}
        <circle cx={720} cy={44} r={5} fill="rgba(255,208,96,0.9)"
          style={{ animation: 'runeGlow 2.4s ease-in-out infinite' }} />
        <circle cx={720} cy={44} r={11} fill="none" stroke="rgba(255,208,96,0.4)" strokeWidth="1.2"
          style={{ animation: 'runeGlow 2.4s ease-in-out 0.18s infinite' }} />
        <circle cx={720} cy={44} r={20} fill="none" stroke="rgba(255,208,96,0.22)" strokeWidth="0.8"
          style={{ animation: 'runeGlow 2.4s ease-in-out 0.36s infinite' }} />
        <circle cx={720} cy={44} r={33} fill="none" stroke="rgba(255,208,96,0.12)" strokeWidth="0.6"
          style={{ animation: 'runeGlow 2.4s ease-in-out 0.54s infinite' }} />
        {/* Spokes from core */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <line key={i}
              x1={720} y1={44}
              x2={720 + Math.cos(a) * 42} y2={44 + Math.sin(a) * 42}
              stroke="rgba(255,208,96,0.18)" strokeWidth="0.8"
              style={{ animation: `runeGlow 2.4s ease-in-out ${(i * 0.14).toFixed(2)}s infinite` }}
            />
          )
        })}

        {/* ── Circuit junction nodes ── */}
        {CMD_CIRCUIT_NODES.map(([x, y], i) => (
          <g key={i}
            style={{ animation: `runeGlow ${1.8 + i * 0.18}s ease-in-out ${(i * 0.12).toFixed(2)}s infinite` }}>
            <circle cx={x} cy={y} r={4}   fill="none" stroke="rgba(143,168,255,0.2)" strokeWidth="0.8" />
            <circle cx={x} cy={y} r={2}   fill="rgba(143,168,255,0.3)" />
          </g>
        ))}

        {/* ── Diagonal grid lines (45°) faint ── */}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i}
            x1={-100 + i * 200} y1={0} x2={i * 200 + 800} y2={900}
            stroke="rgba(143,168,255,0.025)" strokeWidth="0.7"
          />
        ))}

        {/* ── Soul spark particles ── */}
        {CMD_SPARKS.map(d => (
          <circle key={d.id} cx={d.x} cy={d.y} r={1.3}
            fill="rgba(143,168,255,0.5)"
            style={{ animation: `soulFloat ${d.dur} ease-in-out ${d.delay} infinite` }} />
        ))}
      </svg>
    </>
  )
}

// ── TAVERN BACKDROP ───────────────────────────────────────────────
export function TavernBackdrop() {
  return (
    <>
      {/* Warm fireplace ambient light */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 55% at 50% 100%, rgba(255,130,20,0.2)  0%, transparent 100%),
          radial-gradient(ellipse 75% 65% at 50% 100%, rgba(255,200,80,0.12) 0%, transparent 100%),
          radial-gradient(ellipse 22% 40% at 10% 48%,  rgba(255,170,50,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 22% 40% at 90% 48%,  rgba(255,170,50,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 70% 28% at 50% 0%,   rgba(7,5,18,0.85)     0%, transparent 100%)
        `,
      }} />

      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        width="100%" height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Stone arch ceiling ── */}
        <path
          d="M 0 0 L 0 120 Q 360 38 720 34 Q 1080 38 1440 120 L 1440 0 Z"
          fill="rgba(7,5,18,0.82)"
        />
        <path
          d="M 0 123 Q 360 40 720 37 Q 1080 40 1440 123"
          fill="none" stroke="rgba(34,28,60,0.65)" strokeWidth="2.5"
        />
        {/* Arch crown stone */}
        <polygon points="706,36 720,18 734,36" fill="rgba(28,24,52,0.7)" />

        {/* ── Stone side walls ── */}
        <rect x={0}    y={0} width={88}  height={900} fill="rgba(6,4,16,0.55)" />
        <rect x={1352} y={0} width={88}  height={900} fill="rgba(6,4,16,0.55)" />
        {/* Wall edge lines */}
        <line x1={88}   y1={118} x2={88}   y2={900} stroke="rgba(28,22,52,0.65)" strokeWidth="1.5" />
        <line x1={1352} y1={118} x2={1352} y2={900} stroke="rgba(28,22,52,0.65)" strokeWidth="1.5" />
        {/* Horizontal stone courses */}
        {[200, 350, 500, 650, 800].map(y => (
          <g key={y}>
            <line x1={0} y1={y} x2={88} y2={y} stroke="rgba(22,18,42,0.5)" strokeWidth="0.8" />
            <line x1={1352} y1={y} x2={1440} y2={y} stroke="rgba(22,18,42,0.5)" strokeWidth="0.8" />
          </g>
        ))}

        {/* ── Left lantern ── */}
        {/* Chain */}
        <line x1={76} y1={35} x2={76} y2={56} stroke="rgba(40,35,65,0.7)" strokeWidth="1.2" />
        {/* Lantern body */}
        <rect x={62} y={56} width={28} height={34} fill="rgba(18,15,34,0.95)" rx="3" />
        <rect x={66} y={60} width={20} height={26} fill="rgba(255,160,30,0.13)" rx="1" />
        {/* Lantern cap */}
        <path d="M 60 56 L 62 48 L 90 48 L 92 56 Z" fill="rgba(20,17,38,0.9)" />
        {/* Flame */}
        <ellipse cx={76} cy={73} rx={5}   ry={9} fill="#8b3a00" opacity={0.8}
          style={{ animation: 'torchFlicker 1.8s ease-in-out infinite' }} />
        <ellipse cx={76} cy={74} rx={3.5} ry={7} fill="#cc5500"
          style={{ animation: 'torchFlicker 1.5s ease-in-out 0.1s infinite' }} />
        <ellipse cx={76} cy={71} rx={2}   ry={5} fill="#f4a21e"
          style={{ animation: 'torchFlicker 1.3s ease-in-out 0.2s infinite' }} />
        <ellipse cx={76} cy={68} rx={1.2} ry={3} fill="#ffd060"
          style={{ animation: 'torchFlicker 1.2s ease-in-out 0.3s infinite' }} />
        {/* Lantern glow halo */}
        <ellipse cx={76} cy={73} rx={60} ry={70}
          fill="rgba(255,200,80,0.09)"
          style={{ animation: 'torchFlicker 1.8s ease-in-out infinite' }} />

        {/* ── Right lantern (mirror) ── */}
        <line x1={1364} y1={35} x2={1364} y2={56} stroke="rgba(40,35,65,0.7)" strokeWidth="1.2" />
        <rect x={1350} y={56} width={28} height={34} fill="rgba(18,15,34,0.95)" rx="3" />
        <rect x={1354} y={60} width={20} height={26} fill="rgba(255,160,30,0.13)" rx="1" />
        <path d="M 1348 56 L 1350 48 L 1378 48 L 1380 56 Z" fill="rgba(20,17,38,0.9)" />
        <ellipse cx={1364} cy={73} rx={5}   ry={9} fill="#8b3a00" opacity={0.8}
          style={{ animation: 'torchFlicker 1.9s ease-in-out 0.15s infinite' }} />
        <ellipse cx={1364} cy={74} rx={3.5} ry={7} fill="#cc5500"
          style={{ animation: 'torchFlicker 1.6s ease-in-out 0.25s infinite' }} />
        <ellipse cx={1364} cy={71} rx={2}   ry={5} fill="#f4a21e"
          style={{ animation: 'torchFlicker 1.4s ease-in-out 0.35s infinite' }} />
        <ellipse cx={1364} cy={68} rx={1.2} ry={3} fill="#ffd060"
          style={{ animation: 'torchFlicker 1.3s ease-in-out 0.45s infinite' }} />
        <ellipse cx={1364} cy={73} rx={60} ry={70}
          fill="rgba(255,200,80,0.09)"
          style={{ animation: 'torchFlicker 1.9s ease-in-out 0.15s infinite' }} />

        {/* ── Fireplace at bottom center ── */}
        {/* Outer arch */}
        <path d="M 558 900 L 558 778 Q 558 712 626 706 Q 720 692 814 706 Q 882 712 882 778 L 882 900 Z"
          fill="rgba(5,3,10,0.92)" />
        {/* Arch outline */}
        <path d="M 558 900 L 558 778 Q 558 712 626 706 Q 720 692 814 706 Q 882 712 882 778 L 882 900"
          fill="none" stroke="rgba(38,30,65,0.8)" strokeWidth="3" />
        {/* Inner hearth recess */}
        <path d="M 580 900 L 580 785 Q 580 735 636 728 Q 720 716 804 728 Q 860 735 860 785 L 860 900 Z"
          fill="rgba(180,70,8,0.1)" />
        {/* Mantle lintel */}
        <rect x={545} y={700} width={350} height={14} fill="rgba(20,16,38,0.9)" rx="2" />

        {/* Fire glow – layered animated ellipses */}
        <ellipse cx={720} cy={885} rx={115} ry={28} fill="rgba(255,110,15,0.22)"
          style={{ animation: 'torchFlicker 1.0s ease-in-out infinite' }} />
        <ellipse cx={720} cy={865} rx={80}  ry={36} fill="rgba(255,165,30,0.16)"
          style={{ animation: 'torchFlicker 0.85s ease-in-out 0.08s infinite' }} />
        <ellipse cx={720} cy={838} rx={52}  ry={42} fill="rgba(255,200,60,0.11)"
          style={{ animation: 'torchFlicker 1.1s ease-in-out 0.15s infinite' }} />
        <ellipse cx={718} cy={808} rx={32}  ry={36} fill="rgba(255,220,100,0.08)"
          style={{ animation: 'torchFlicker 1.3s ease-in-out 0.22s infinite' }} />
        <ellipse cx={720} cy={775} rx={18}  ry={28} fill="rgba(255,240,160,0.06)"
          style={{ animation: 'torchFlicker 1.5s ease-in-out 0.3s infinite' }} />

        {/* ── Rising smoke wisps ── */}
        {TAV_SMOKE.map(s => (
          <ellipse key={s.id} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry}
            fill="rgba(85,75,108,0.13)"
            style={{ animation: `soulFloat ${s.dur} ease-in-out ${s.delay} infinite` }} />
        ))}

        {/* ── Stone floor lines ── */}
        <line x1={88} y1={886} x2={1352} y2={886} stroke="rgba(24,20,44,0.6)" strokeWidth="1.5" />
        <line x1={88} y1={876} x2={558}  y2={876} stroke="rgba(20,16,38,0.45)" strokeWidth="0.8" />
        <line x1={882} y1={876} x2={1352} y2={876} stroke="rgba(20,16,38,0.45)" strokeWidth="0.8" />
        {/* Floor flagstone joints */}
        {[280, 520, 760, 1000, 1220].map(x => (
          <line key={x} x1={x} y1={876} x2={x} y2={900} stroke="rgba(18,14,36,0.4)" strokeWidth="0.7" />
        ))}

        {/* ── Wall rune medallions ── */}
        {[[210, 450], [1230, 450]].map(([x, y]) => (
          <g key={x} style={{ animation: 'runeGlow 5s ease-in-out infinite' }}>
            <circle cx={x} cy={y} r={55} fill="none" stroke="rgba(28,22,52,0.35)" strokeWidth="1.2" />
            <circle cx={x} cy={y} r={38} fill="none" stroke="rgba(28,22,52,0.25)" strokeWidth="0.8" />
            <line x1={x-55} y1={y} x2={x+55} y2={y} stroke="rgba(28,22,52,0.2)" strokeWidth="0.6" />
            <line x1={x} y1={y-55} x2={x} y2={y+55} stroke="rgba(28,22,52,0.2)" strokeWidth="0.6" />
            <circle cx={x} cy={y} r={6} fill="rgba(244,162,30,0.15)" />
          </g>
        ))}

        {/* ── Ambient warm dust ── */}
        {TAV_DUST.map(d => (
          <circle key={d.id} cx={d.x} cy={d.y} r={d.r}
            fill="rgba(200,160,100,0.35)"
            style={{ animation: `dustFloat ${d.dur} ease-in-out ${d.delay} infinite` }} />
        ))}
      </svg>
    </>
  )
}
