import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from './hooks/useIsMobile'

const DW = 1200
const DH = 720

const ROOMS = [
  { id:'armory',  name:'Armory',          icon:'🛡', desc:'Quick Links',    x:50,  y:50,  w:192, h:148 },
  { id:'scholar', name:"Scholar's Sanctum",icon:'📜', desc:'Assignment Drafts', x:436, y:48,  w:200, h:148 },
  { id:'war',     name:'War Room',         icon:'⚔', desc:'Kanban Board',   x:50,  y:282, w:198, h:156 },
  { id:'forge',   name:'Forge',            icon:'🔨', desc:'ALS Checklist',  x:50,  y:524, w:192, h:148 },
  { id:'command', name:'Command Center',   icon:'⚡', desc:'Agent Status',   x:436, y:254, w:256, h:196, isCenter:true },
  { id:'office',  name:'Office',           icon:'📅', desc:'Calendar',       x:742, y:50,  w:200, h:148 },
  { id:'library', name:'Library',          icon:'📚', desc:'Notes',          x:742, y:472, w:200, h:148 },
  { id:'vault',   name:'Vault',            icon:'🪙', desc:'Expenses',       x:480, y:530, w:156, h:118 },
  { id:'tavern',  name:'Tavern',           icon:'🎮', desc:'Break Zone',     x:1006,y:268, w:174, h:156 },
]

const ROOM_COLORS = {
  command: { primary:'#ffd060', glow:'rgba(255,208,96,0.4)',  bg:'rgba(255,208,96,0.05)'  },
  scholar: { primary:'#8fa8ff', glow:'rgba(143,168,255,0.4)', bg:'rgba(143,168,255,0.05)' },
  war:     { primary:'#ff6060', glow:'rgba(255,96,96,0.35)',  bg:'rgba(255,96,96,0.04)'   },
  office:  { primary:'#40d4c0', glow:'rgba(64,212,192,0.35)', bg:'rgba(64,212,192,0.04)'  },
  library: { primary:'#c080ff', glow:'rgba(192,128,255,0.4)', bg:'rgba(192,128,255,0.05)' },
  armory:  { primary:'#d0d8e8', glow:'rgba(208,216,232,0.3)', bg:'rgba(208,216,232,0.03)' },
  forge:   { primary:'#ff9040', glow:'rgba(255,144,64,0.4)',  bg:'rgba(255,144,64,0.04)'  },
  vault:   { primary:'#40e8ff', glow:'rgba(64,232,255,0.35)', bg:'rgba(64,232,255,0.04)'  },
  tavern:  { primary:'#f4a21e', glow:'rgba(244,162,30,0.4)',  bg:'rgba(244,162,30,0.04)'  },
}

const CORRIDORS = [
  'M 146 198 L 146 282',            // armory → war
  'M 146 438 L 146 524',            // war → forge
  'M 248 360 L 436 352',            // war → command
  'M 692 352 L 1006 346',           // command → tavern
  'M 536 196 L 536 254',            // scholar → command
  'M 636 122 L 742 122',            // scholar → office
  'M 242 122 L 436 122',            // armory → scholar
  'M 840 198 L 840 472',            // office → library
  'M 692 400 L 762 400 L 762 472',  // command → library
  'M 564 450 L 564 530',            // command → vault
  'M 636 562 L 742 532',            // vault → library
]

const TORCHES = [
  { x:146, y:240 },
  { x:146, y:481 },
  { x:342, y:356 },
  { x:536, y:225 },
  { x:339, y:122 },
  { x:689, y:122 },
  { x:840, y:335 },
  { x:564, y:490 },
  { x:727, y:400 },
]

// Ancient seals at corridor junctions
const SEALS = [
  { cx:146, cy:360, r:22 },
  { cx:342, cy:356, r:18 },
  { cx:536, cy:225, r:20 },
  { cx:689, cy:122, r:16 },
  { cx:762, cy:436, r:18 },
  { cx:564, cy:490, r:16 },
  { cx:840, cy:335, r:20 },
]

// Soul wisps – floating soul-blue particles
const WISPS = [
  { x:300, y:185, delay:'0s',   dur:'4.2s' },
  { x:880, y:390, delay:'1.3s', dur:'5.1s' },
  { x:660, y:200, delay:'0.7s', dur:'3.8s' },
  { x:195, y:470, delay:'2.1s', dur:'4.7s' },
  { x:960, y:490, delay:'0.4s', dur:'5.5s' },
  { x:340, y:650, delay:'1.8s', dur:'4.1s' },
  { x:700, y:635, delay:'3.0s', dur:'3.6s' },
  { x:98,  y:355, delay:'1.5s', dur:'4.9s' },
  { x:620, y:440, delay:'2.6s', dur:'4.4s' },
  { x:1090,y:420, delay:'0.9s', dur:'5.3s' },
]

// Glowing mineral veins in the stone
const VEINS = [
  { d:'M 280 145 Q 315 158 325 185',         color:'#8fa8ff' },
  { d:'M 895 210 Q 918 235 908 265',         color:'#c080ff' },
  { d:'M 375 510 Q 400 530 392 558',         color:'#8fa8ff' },
  { d:'M 130 628 Q 152 645 142 668',         color:'#c080ff' },
  { d:'M 1050 180 Q 1075 200 1065 230',      color:'#ffd060' },
  { d:'M 1050 540 Q 1072 562 1060 590',      color:'#8fa8ff' },
  { d:'M 375 155 Q 405 142 425 160',         color:'#8fa8ff' },
]

// Geo diamond collectibles
const GEO = [
  { x:265, y:205 }, { x:905, y:155 }, { x:382, y:625 },
  { x:685, y:510 }, { x:118, y:445 }, { x:958, y:560 },
  { x:705, y:195 }, { x:195, y:590 }, { x:1080, y:320 },
  { x:415, y:685 }, { x:630, y:680 },
]

// Carved wall panels in large empty areas
const PANELS = [
  { x:285, y:62,  w:120, h:58 },
  { x:655, y:310, w:50,  h:60 },
  { x:862, y:60,  w:110, h:55 },
  { x:862, y:490, w:110, h:55 },
  { x:1072,y:78,  w:90,  h:110 },
  { x:1072,y:522, w:90,  h:110 },
  { x:285, y:655, w:120, h:50  },
]

// Scholar rune sparks near top-center
const SCHOLAR_RUNES = [
  { x:408, y:128 }, { x:658, y:86 },  { x:490, y:34 },
  { x:578, y:218 }, { x:418, y:210 }, { x:648, y:168 },
]

const DUST = Array.from({ length: 16 }, (_, i) => ({
  id:i, x: 70 + (i*87)%1060, y: 50 + (i*67)%620,
  delay:(i*0.6).toFixed(2), dur:(3.5+(i*0.28)%4.2).toFixed(2),
}))

function DungeonInterior({ onEnterRoom, hovered, setHovered }) {
  return (
    <>
      {/* Deep void floor */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:`#050308`,
        backgroundImage:`
          radial-gradient(ellipse 80% 60% at 50% 50%, #0c0a18 0%, #050308 75%),
          radial-gradient(ellipse 35% 25% at 20% 30%, rgba(143,168,255,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 28% 22% at 80% 68%, rgba(255,208,96,0.03) 0%, transparent 55%),
          radial-gradient(ellipse 20% 18% at 50% 16%, rgba(143,168,255,0.05) 0%, transparent 50%)
        `,
      }} />

      {/* Very subtle stone grid */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.35,
        backgroundImage:`
          repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(30,26,56,0.6) 47px, rgba(30,26,56,0.6) 48px),
          repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(30,26,56,0.6) 47px, rgba(30,26,56,0.6) 48px)
        `,
      }} />

      <svg style={{ position:'absolute', inset:0, overflow:'visible' }} width={DW} height={DH}>
        <defs>
          {/* Torch halo gradients */}
          {TORCHES.map((_,i) => (
            <radialGradient key={i} id={`tg${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffd060" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffd060" stopOpacity="0" />
            </radialGradient>
          ))}
          {/* Soul wisp glow */}
          <radialGradient id="soulWisp" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#8fa8ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8fa8ff" stopOpacity="0" />
          </radialGradient>
          {/* Vignette */}
          <radialGradient id="vig" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="100%" stopColor="#050308" stopOpacity="0.75" />
          </radialGradient>
        </defs>

        {/* ── CORRIDORS ── 4 passes for depth */}
        {CORRIDORS.map((d,i) => (
          <path key={`co${i}`} d={d} fill="none" stroke="#161228" strokeWidth="62" strokeLinecap="square" />
        ))}
        {CORRIDORS.map((d,i) => (
          <path key={`cm${i}`} d={d} fill="none" stroke="#0f0d1e" strokeWidth="48" strokeLinecap="square" />
        ))}
        {CORRIDORS.map((d,i) => (
          <path key={`cf${i}`} d={d} fill="none" stroke="#08061a" strokeWidth="34" strokeLinecap="square" />
        ))}
        {/* Faint soul-blue centre line */}
        {CORRIDORS.map((d,i) => (
          <path key={`cs${i}`} d={d} fill="none" stroke="rgba(143,168,255,0.045)" strokeWidth="14" strokeLinecap="square" />
        ))}

        {/* ── MINERAL VEINS ── */}
        {VEINS.map((v,i) => (
          <g key={`v${i}`}>
            <path d={v.d} fill="none" stroke={v.color} strokeWidth="2"
              strokeLinecap="round" opacity="0.12" />
            <path d={v.d} fill="none" stroke={v.color} strokeWidth="1"
              strokeLinecap="round"
              style={{ strokeOpacity:0.35, animation:`crackGlow ${3.2+i*0.65}s ease-in-out ${i*0.42}s infinite` }} />
            <path d={v.d} fill="none" stroke="#e0eaff" strokeWidth="0.4"
              strokeLinecap="round" opacity="0.5" />
          </g>
        ))}

        {/* ── CARVED WALL PANELS ── */}
        {PANELS.map((p,i) => (
          <g key={`p${i}`} opacity="0.38">
            <rect x={p.x} y={p.y} width={p.w} height={p.h}
              fill="rgba(20,17,42,0.6)" stroke="#2a2448" strokeWidth="1" />
            <rect x={p.x+5} y={p.y+5} width={p.w-10} height={p.h-10}
              fill="none" stroke="#1e1a38" strokeWidth="0.7" />
            <line x1={p.x+p.w/2} y1={p.y+10}  x2={p.x+p.w/2} y2={p.y+p.h-10} stroke="#251f42" strokeWidth="0.6" />
            <line x1={p.x+10}    y1={p.y+p.h/2} x2={p.x+p.w-10} y2={p.y+p.h/2} stroke="#251f42" strokeWidth="0.6" />
            <circle cx={p.x+p.w/2} cy={p.y+p.h/2} r={3.5} fill="#1a1630" stroke="#2e2858" strokeWidth="0.6" />
          </g>
        ))}

        {/* ── ANCIENT SEALS at corridor junctions ── */}
        {SEALS.map((s,i) => (
          <g key={`s${i}`} style={{ animation:`runeGlow ${4.2+i*0.55}s ease-in-out ${i*0.35}s infinite` }}>
            <circle cx={s.cx} cy={s.cy} r={s.r}      fill="none" stroke="rgba(143,168,255,0.28)" strokeWidth="1" />
            <circle cx={s.cx} cy={s.cy} r={s.r*0.62} fill="none" stroke="rgba(143,168,255,0.18)" strokeWidth="0.8" />
            <line x1={s.cx-s.r} y1={s.cy}    x2={s.cx+s.r} y2={s.cy}    stroke="rgba(143,168,255,0.18)" strokeWidth="0.7" />
            <line x1={s.cx}     y1={s.cy-s.r} x2={s.cx}     y2={s.cy+s.r} stroke="rgba(143,168,255,0.18)" strokeWidth="0.7" />
            {/* Diagonal cross-hair */}
            <line x1={s.cx-s.r*0.55} y1={s.cy-s.r*0.55} x2={s.cx+s.r*0.55} y2={s.cy+s.r*0.55} stroke="rgba(143,168,255,0.12)" strokeWidth="0.5" />
            <line x1={s.cx+s.r*0.55} y1={s.cy-s.r*0.55} x2={s.cx-s.r*0.55} y2={s.cy+s.r*0.55} stroke="rgba(143,168,255,0.12)" strokeWidth="0.5" />
            <circle cx={s.cx} cy={s.cy} r={2.5} fill="rgba(143,168,255,0.55)" />
          </g>
        ))}

        {/* ── GEO DIAMONDS ── */}
        {GEO.map((g,i) => (
          <g key={`g${i}`} transform={`translate(${g.x},${g.y})`}
            style={{ animation:`runeGlow ${2.8+i*0.38}s ease-in-out ${i*0.55}s infinite` }}>
            <path d="M 0 -6 L 5 0 L 0 6 L -5 0 Z"  fill="rgba(143,168,255,0.22)" stroke="rgba(143,168,255,0.6)" strokeWidth="0.6" />
            <path d="M 0 -3.5 L 3 0 L 0 3.5 L -3 0 Z" fill="rgba(175,196,255,0.55)" />
          </g>
        ))}

        {/* ── SCHOLAR RUNE SPARKS ── */}
        {SCHOLAR_RUNES.map((r,i) => (
          <g key={`sr${i}`}
            style={{ animation:`runeGlow ${2.5+i*0.7}s ease-in-out ${i*0.45}s infinite` }}>
            <circle cx={r.x} cy={r.y} r={1.8} fill="rgba(143,168,255,0.65)" />
            <circle cx={r.x} cy={r.y} r={3.5} fill="none" stroke="rgba(143,168,255,0.25)" strokeWidth="0.6" />
          </g>
        ))}

        {/* ── SOUL WISPS ── */}
        {WISPS.map((w,i) => (
          <g key={`w${i}`} style={{ animation:`soulFloat ${w.dur} ease-in-out ${w.delay} infinite` }}>
            <ellipse cx={w.x} cy={w.y} rx={7}   ry={10} fill="rgba(143,168,255,0.1)" />
            <ellipse cx={w.x} cy={w.y} rx={3.5}  ry={5.5} fill="rgba(143,168,255,0.38)" />
            <ellipse cx={w.x} cy={w.y} rx={1.5}  ry={2.5} fill="rgba(215,225,255,0.85)" />
          </g>
        ))}

        {/* ── TORCH HALOS ── */}
        {TORCHES.map((t,i) => (
          <ellipse key={`th${i}`} cx={t.x} cy={t.y} rx={72} ry={65}
            fill={`url(#tg${i})`}
            style={{ animation:`torchFlicker ${1.4+i*0.14}s ease-in-out ${(i*0.18).toFixed(2)}s infinite` }} />
        ))}

        {/* ── TORCH FLAMES ── */}
        {TORCHES.map((t,i) => (
          <g key={`tf${i}`}
            style={{ animation:`torchFlicker ${1.2+i*0.11}s ease-in-out ${(i*0.09).toFixed(2)}s infinite`, transformOrigin:`${t.x}px ${t.y}px` }}>
            {/* Wall sconce */}
            <rect x={t.x-7} y={t.y+7} width={14} height={8}  fill="#1e1a38" rx="1.5" />
            <rect x={t.x-9} y={t.y+12} width={18} height={3} fill="#16143a" rx="1" />
            {/* Flame */}
            <ellipse cx={t.x}   cy={t.y}    rx={9}  ry={14} fill="#7a2e00" opacity={0.85} />
            <ellipse cx={t.x}   cy={t.y+2}  rx={6}  ry={10} fill="#cc5500" opacity={0.9} />
            <ellipse cx={t.x-1} cy={t.y}    rx={3.5} ry={7} fill="#f4a21e" />
            <ellipse cx={t.x}   cy={t.y-3}  rx={2.2} ry={4.5} fill="#ffd060" opacity={0.9} />
            <ellipse cx={t.x}   cy={t.y-6}  rx={1.2} ry={3}   fill="#fff8d0" opacity={0.8} />
          </g>
        ))}

        {/* ── DUST PARTICLES ── */}
        {DUST.map(p => (
          <circle key={p.id} cx={p.x} cy={p.y} r={1.1} fill="#5a5080" opacity={0.5}
            style={{ animation:`dustFloat ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
        ))}

        {/* ── EDGE VIGNETTE ── */}
        <rect x={0} y={0} width={DW} height={DH} fill="url(#vig)" pointerEvents="none" />

        {/* ── OUTER WALL BORDER ── */}
        <rect x={2} y={2} width={DW-4} height={DH-4}
          fill="none" stroke="#16143a" strokeWidth="4" />
        <rect x={8} y={8} width={DW-16} height={DH-16}
          fill="none" stroke="#0e0c28" strokeWidth="1.5" />

        {/* ── CORNER RUNES ── */}
        {[
          [18, 18], [DW-18, 18], [18, DH-18], [DW-18, DH-18],
        ].map(([cx,cy],i) => (
          <g key={`cr${i}`} opacity="0.5">
            <path d={`M ${cx} ${cy-14} L ${cx+8} ${cy} L ${cx} ${cy+14} L ${cx-8} ${cy} Z`}
              fill="none" stroke="#3a3060" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={3} fill="#2a2448" />
          </g>
        ))}
      </svg>

      {/* ── ROOM BOXES ── */}
      {ROOMS.map(room => (
        <RoomBox
          key={room.id} room={room}
          hovered={hovered === room.id}
          onEnter={() => onEnterRoom(room.id)}
          onHover={v => setHovered(v ? room.id : null)}
        />
      ))}
    </>
  )
}

export default function DungeonMap({ onEnterRoom, activeRoom }) {
  const isMobile = useIsMobile()
  const [scale, setScale] = useState(1)
  const [hovered, setHovered] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (isMobile) return
    const calc = () => {
      const sx = window.innerWidth  / DW
      const sy = window.innerHeight / DH
      setScale(Math.min(sx, sy))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile || !scrollRef.current) return
    const cmdCX = 436 + 128
    const cmdCY = 254 + 98
    scrollRef.current.scrollLeft = Math.max(0, cmdCX - window.innerWidth  / 2)
    scrollRef.current.scrollTop  = Math.max(0, cmdCY - window.innerHeight / 2)
  }, [isMobile])

  if (isMobile) {
    return (
      <div ref={scrollRef} style={{
        position:'fixed', inset:0, overflow:'auto',
        background:'#050308', WebkitOverflowScrolling:'touch',
        scrollbarWidth:'none', msOverflowStyle:'none',
      }}>
        <style>{`::-webkit-scrollbar{display:none}`}</style>

        {/* Drag hint */}
        <div style={{
          position:'fixed', bottom:26, left:'50%', transform:'translateX(-50%)',
          fontFamily:"'Cinzel', serif", fontSize:9, fontWeight:600,
          color:'rgba(255,208,96,0.35)', letterSpacing:'0.2em',
          pointerEvents:'none', zIndex:5, whiteSpace:'nowrap',
          animation:'statusBlink 3.5s ease-in-out infinite',
        }}>
          ✦ DRAG TO EXPLORE ✦
        </div>

        {/* Title */}
        <div style={{
          position:'fixed', top:8, left:'50%', transform:'translateX(-50%)',
          background:'rgba(5,3,8,0.88)', backdropFilter:'blur(8px)',
          border:'1px solid #221e3a', padding:'6px 18px',
          fontFamily:"'Cinzel', serif", fontSize:11, fontWeight:700,
          color:'var(--torch)', letterSpacing:'0.18em', zIndex:10, whiteSpace:'nowrap',
          textShadow:'0 0 16px rgba(255,208,96,0.5)',
        }}>
          MISSIONDECK
        </div>

        <div style={{ position:'relative', width:DW, height:DH }}>
          <DungeonInterior onEnterRoom={onEnterRoom} activeRoom={activeRoom} hovered={hovered} setHovered={setHovered} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'#050308',
      overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {/* Desktop title */}
      <div style={{
        position:'absolute', top:16, left:'50%', transform:'translateX(-50%)',
        fontFamily:"'Cinzel', serif", fontSize:15, fontWeight:700,
        color:'var(--torch)', letterSpacing:'0.22em', zIndex:10,
        textShadow:'0 0 22px rgba(255,208,96,0.6), 0 0 50px rgba(255,208,96,0.25)',
        pointerEvents:'none',
      }}>
        ✦ MISSION DECK ✦
      </div>

      <div style={{
        position:'relative', width:DW, height:DH,
        transformOrigin:'center center',
        transform:`scale(${scale})`,
      }}>
        <DungeonInterior onEnterRoom={onEnterRoom} activeRoom={activeRoom} hovered={hovered} setHovered={setHovered} />
      </div>
    </div>
  )
}

function RoomBox({ room, hovered, onEnter, onHover }) {
  const { x, y, w, h, isCenter } = room
  const accent = ROOM_COLORS[room.id] || ROOM_COLORS.command

  const borderColor = hovered
    ? accent.primary
    : isCenter
    ? `${accent.primary}99`
    : '#221e3a'

  const boxShadow = hovered
    ? `0 0 28px ${accent.glow}, 0 0 55px ${accent.glow.replace('0.4','0.15').replace('0.35','0.12').replace('0.3','0.1')}, inset 0 0 18px ${accent.glow.replace('0.4','0.07').replace('0.35','0.06').replace('0.3','0.05')}`
    : isCenter
    ? undefined
    : 'none'

  const animation = isCenter && !hovered ? 'glowPulse 3.5s ease-in-out infinite' : undefined

  return (
    <div
      onClick={onEnter}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position:'absolute', left:x, top:y, width:w, height:h,
        background:`#07061a`,
        backgroundImage: hovered
          ? `radial-gradient(ellipse at center, ${accent.bg.replace('0.05','0.1').replace('0.04','0.08').replace('0.03','0.06')} 0%, transparent 70%)`
          : isCenter
          ? `radial-gradient(ellipse at center, ${accent.bg} 0%, transparent 70%)`
          : 'none',
        border:`2px solid ${borderColor}`,
        boxShadow, animation,
        cursor:'pointer',
        transition:'border-color .22s cubic-bezier(0.4,0,0.2,1), box-shadow .22s cubic-bezier(0.4,0,0.2,1)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:5, userSelect:'none', overflow:'hidden',
      }}
    >
      {/* Stone texture */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`
          repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.007) 23px, rgba(255,255,255,0.007) 24px),
          repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,255,255,0.007) 23px, rgba(255,255,255,0.007) 24px)
        `,
      }} />

      {/* Inner glow edge when hovered */}
      {hovered && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          boxShadow:`inset 0 0 30px ${accent.glow.replace('0.4','0.12').replace('0.35','0.1').replace('0.3','0.08')}`,
        }} />
      )}

      {/* Corner rune brackets */}
      {[
        { top:5, left:5,    borderTop:`1px solid`, borderLeft:`1px solid`   },
        { top:5, right:5,   borderTop:`1px solid`, borderRight:`1px solid`  },
        { bottom:5, left:5,  borderBottom:`1px solid`, borderLeft:`1px solid`  },
        { bottom:5, right:5, borderBottom:`1px solid`, borderRight:`1px solid` },
      ].map((s, i) => (
        <div key={i} style={{
          position:'absolute', width:10, height:10, ...s,
          borderColor: hovered ? `${accent.primary}80` : '#2a2448',
          transition:'border-color .22s',
        }} />
      ))}

      <span style={{
        fontSize: isCenter ? 28 : 22, lineHeight:1,
        filter: hovered ? `drop-shadow(0 0 10px ${accent.primary})` : 'none',
        transition:'filter .22s',
      }}>
        {room.icon}
      </span>

      <span style={{
        fontFamily:"'Cinzel', serif",
        fontSize: isCenter ? 12 : 10,
        fontWeight:600,
        color: hovered ? accent.primary : (isCenter ? `${accent.primary}cc` : '#9890b8'),
        textAlign:'center', lineHeight:1.4, letterSpacing:'0.1em',
        textShadow: hovered ? `0 0 14px ${accent.primary}` : 'none',
        transition:'color .22s, text-shadow .22s',
        padding:'0 6px',
      }}>
        {room.name.toUpperCase()}
      </span>

      <span style={{
        fontSize:12,
        fontFamily:"'Crimson Pro', serif",
        fontStyle:'italic',
        color: hovered ? '#8880a8' : '#3e3860',
        transition:'color .22s',
      }}>
        {room.desc}
      </span>

      {hovered && (
        <div style={{
          position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)',
          fontFamily:"'Cinzel', serif", fontSize:8, fontWeight:600,
          color:accent.primary, letterSpacing:'0.18em', whiteSpace:'nowrap',
          animation:'slideUp .15s ease-out', opacity:0.9,
        }}>
          ✦ ENTER ✦
        </div>
      )}
    </div>
  )
}
