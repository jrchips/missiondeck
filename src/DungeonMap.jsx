import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from './hooks/useIsMobile'

const DW = 1200
const DH = 720

const ROOMS = [
  { id:'armory',  name:'Armory',         icon:'🛡', desc:'Quick Links',    x:50,  y:50,  w:192, h:148 },
  { id:'war',     name:'War Room',        icon:'⚔', desc:'Kanban Board',   x:50,  y:282, w:198, h:156 },
  { id:'forge',   name:'Forge',           icon:'🔨', desc:'ALS Checklist',  x:50,  y:524, w:192, h:148 },
  { id:'command', name:'Command Center',  icon:'⚡', desc:'Agent Status',   x:436, y:254, w:256, h:196, isCenter:true },
  { id:'office',  name:'Office',          icon:'📅', desc:'Calendar',       x:742, y:50,  w:200, h:148 },
  { id:'library', name:'Library',         icon:'📚', desc:'Notes',          x:742, y:472, w:200, h:148 },
  { id:'vault',   name:'Vault',           icon:'🪙', desc:'Expenses',       x:480, y:530, w:156, h:118 },
  { id:'tavern',  name:'Tavern',          icon:'🎮', desc:'Break Zone',     x:1006,y:268, w:174, h:156 },
]

const CORRIDORS = [
  'M 146 198 L 146 282',
  'M 146 438 L 146 524',
  'M 248 360 L 436 352',
  'M 692 352 L 1006 346',
  'M 582 254 L 582 124 L 742 124',
  'M 840 198 L 840 472',
  'M 692 400 L 762 400 L 762 472',
  'M 564 450 L 564 530',
  'M 742 532 L 636 562',
]

const TORCHES = [
  { x:146, y:240 }, { x:146, y:481 }, { x:342, y:356 },
  { x:582, y:189 }, { x:662, y:124 }, { x:840, y:335 },
  { x:727, y:400 }, { x:564, y:490 }, { x:849, y:346 },
]

const DUST = Array.from({ length: 14 }, (_, i) => ({
  id: i, x: 80 + (i * 83) % 1040, y: 60 + (i * 61) % 600,
  delay: (i * 0.65).toFixed(2), dur: (3.5 + (i * 0.31) % 3.8).toFixed(2),
}))

// The raw dungeon interior — shared by both mobile and desktop renders
function DungeonInterior({ onEnterRoom, activeRoom, hovered, setHovered }) {
  return (
    <>
      {/* Stone floor */}
      <div style={{
        position: 'absolute', inset: 0, background: '#07070e',
        backgroundImage: `
          radial-gradient(ellipse 60% 50% at 50% 50%, #0e0e22 0%, transparent 70%),
          repeating-linear-gradient(0deg, transparent, transparent 39px, #0d0d1e 39px, #0d0d1e 40px),
          repeating-linear-gradient(90deg, transparent, transparent 39px, #0d0d1e 39px, #0d0d1e 40px)
        `,
        pointerEvents: 'none',
      }} />

      <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }} width={DW} height={DH}>
        <defs>
          {TORCHES.map((_, i) => (
            <radialGradient key={i} id={`tg${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f4a21e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f4a21e" stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        {CORRIDORS.map((d, i) => (
          <path key={`cw${i}`} d={d} fill="none" stroke="#1a1a3a" strokeWidth="54" strokeLinecap="square" strokeLinejoin="miter" />
        ))}
        {CORRIDORS.map((d, i) => (
          <path key={`cf${i}`} d={d} fill="none" stroke="#0b0b1e" strokeWidth="40" strokeLinecap="square" strokeLinejoin="miter" />
        ))}
        {TORCHES.map((t, i) => (
          <ellipse key={`ta${i}`} cx={t.x} cy={t.y} rx={58} ry={55}
            fill={`url(#tg${i})`}
            style={{ animation: `torchFlicker ${1.4 + i * 0.13}s ease-in-out ${(i * 0.17).toFixed(2)}s infinite` }}
          />
        ))}
        {TORCHES.map((t, i) => (
          <g key={`tf${i}`}
            style={{ animation: `torchFlicker ${1.2 + i * 0.11}s ease-in-out ${(i * 0.09).toFixed(2)}s infinite`, transformOrigin: `${t.x}px ${t.y}px` }}>
            <rect x={t.x - 5} y={t.y + 5} width={10} height={6} fill="#3a3a5a" rx="1" />
            <ellipse cx={t.x} cy={t.y} rx={7} ry={11} fill="#cc6600" opacity={0.9} />
            <ellipse cx={t.x} cy={t.y + 2} rx={4} ry={7} fill="#f4a21e" opacity={0.95} />
            <ellipse cx={t.x} cy={t.y - 3} rx={2} ry={4} fill="#ffeeaa" opacity={0.9} />
          </g>
        ))}
        {DUST.map(p => (
          <circle key={p.id} cx={p.x} cy={p.y} r={1.2} fill="#6666a0" opacity={0.6}
            style={{ animation: `dustFloat ${p.dur}s ease-in-out ${p.delay}s infinite` }}
          />
        ))}
      </svg>

      {ROOMS.map(room => (
        <RoomBox
          key={room.id} room={room}
          hovered={hovered === room.id}
          onEnter={() => onEnterRoom(room.id)}
          onHover={(v) => setHovered(v ? room.id : null)}
        />
      ))}

      <CornerDecor x={8} y={8} />
      <CornerDecor x={DW - 8} y={8} flipX />
      <CornerDecor x={8} y={DH - 8} flipY />
      <CornerDecor x={DW - 8} y={DH - 8} flipX flipY />
    </>
  )
}

export default function DungeonMap({ onEnterRoom, activeRoom }) {
  const isMobile = useIsMobile()
  const [scale, setScale] = useState(1)
  const [hovered, setHovered] = useState(null)
  const scrollRef = useRef(null)

  // Desktop scale calculation
  useEffect(() => {
    if (isMobile) return
    const calc = () => {
      const sx = window.innerWidth / DW
      const sy = window.innerHeight / DH
      setScale(Math.min(sx, sy))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [isMobile])

  // Mobile: scroll to center on Command Center after mount
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return
    const cmdCX = 436 + 128  // center x of Command Center
    const cmdCY = 254 + 98   // center y
    scrollRef.current.scrollLeft = Math.max(0, cmdCX - window.innerWidth / 2)
    scrollRef.current.scrollTop  = Math.max(0, cmdCY - window.innerHeight / 2)
  }, [isMobile])

  if (isMobile) {
    return (
      <div
        ref={scrollRef}
        style={{
          position: 'fixed', inset: 0,
          overflow: 'auto',
          background: '#07070e',
          WebkitOverflowScrolling: 'touch',
          // hide scrollbars
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`::-webkit-scrollbar{display:none}`}</style>

        {/* Drag hint */}
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--pixel)', fontSize: 6, color: 'rgba(244,162,30,.4)',
          letterSpacing: 2, pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap',
          animation: 'statusBlink 3s ease-in-out infinite',
        }}>
          ← DRAG TO EXPLORE →
        </div>

        {/* Title badge (fixed so it's always visible) */}
        <div style={{
          position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(7,7,14,.85)', backdropFilter: 'blur(6px)',
          border: '1px solid #1a1a3a', padding: '5px 14px',
          fontFamily: 'var(--pixel)', fontSize: 7, color: 'var(--torch)',
          letterSpacing: 2, zIndex: 10, whiteSpace: 'nowrap',
          textShadow: '0 0 10px rgba(244,162,30,.5)',
        }}>
          ⚔ MISSIONDECK ⚔
        </div>

        {/* Full-size dungeon (not scaled, scrollable) */}
        <div style={{ position: 'relative', width: DW, height: DH }}>
          <DungeonInterior
            onEnterRoom={onEnterRoom}
            activeRoom={activeRoom}
            hovered={hovered}
            setHovered={setHovered}
          />
        </div>
      </div>
    )
  }

  // Desktop: scale-to-fit
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#07070e',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--pixel)', fontSize: 9, color: 'var(--torch)',
        letterSpacing: 3, zIndex: 10, textShadow: '0 0 18px rgba(244,162,30,.6)',
        pointerEvents: 'none',
      }}>
        ⚔ MISSION DECK DUNGEON ⚔
      </div>

      <div style={{
        position: 'relative', width: DW, height: DH,
        transformOrigin: 'center center',
        transform: `scale(${scale})`,
      }}>
        <DungeonInterior
          onEnterRoom={onEnterRoom}
          activeRoom={activeRoom}
          hovered={hovered}
          setHovered={setHovered}
        />
      </div>
    </div>
  )
}

function RoomBox({ room, hovered, onEnter, onHover }) {
  const { x, y, w, h, isCenter } = room

  const borderColor = isCenter
    ? (hovered ? '#00ffcc' : 'var(--teal)')
    : (hovered ? 'var(--torch)' : 'var(--room-border)')

  const boxShadow = isCenter
    ? (hovered
        ? '0 0 40px rgba(0,212,170,.7), 0 0 80px rgba(0,212,170,.3), inset 0 0 30px rgba(0,212,170,.12)'
        : undefined)
    : (hovered
        ? '0 0 25px rgba(244,162,30,.5), 0 0 50px rgba(244,162,30,.2), inset 0 0 20px rgba(244,162,30,.06)'
        : undefined)

  const animation = isCenter && !hovered ? 'glowPulse 3s ease-in-out infinite' : undefined

  return (
    <div
      onClick={onEnter}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        background: isCenter ? '#12123a' : '#10102a',
        border: `3px solid ${borderColor}`,
        boxShadow, animation, cursor: 'pointer',
        transition: 'border-color .18s, box-shadow .18s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 5, userSelect: 'none', overflow: 'hidden',
      }}
    >
      {/* Stone texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,.012) 19px, rgba(255,255,255,.012) 20px),
          repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,.012) 19px, rgba(255,255,255,.012) 20px)
        `,
      }} />

      {/* Corner brackets */}
      {[
        { top:4, left:4,  borderTop:'2px', borderLeft:'2px'  },
        { top:4, right:4, borderTop:'2px', borderRight:'2px' },
        { bottom:4, left:4,  borderBottom:'2px', borderLeft:'2px'  },
        { bottom:4, right:4, borderBottom:'2px', borderRight:'2px' },
      ].map((s, i) => {
        const c = isCenter ? 'var(--teal)' : '#4a4a7a'
        const style = { position:'absolute', width:10, height:10, ...Object.fromEntries(
          Object.entries(s).map(([k,v]) => k.startsWith('border') ? [`border${k.replace('border','')}`===k ? k : k, `${v} solid ${c}`] : [k, v])
        ) }
        // Simpler: just hardcode the four corners
        return null
      })}
      <div style={{ position:'absolute', top:4, left:4,   width:10, height:10, borderTop:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}`, borderLeft:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}` }} />
      <div style={{ position:'absolute', top:4, right:4,  width:10, height:10, borderTop:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}`, borderRight:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}` }} />
      <div style={{ position:'absolute', bottom:4, left:4,  width:10, height:10, borderBottom:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}`, borderLeft:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}` }} />
      <div style={{ position:'absolute', bottom:4, right:4, width:10, height:10, borderBottom:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}`, borderRight:`2px solid ${isCenter?'var(--teal)':'#4a4a7a'}` }} />

      <span style={{ fontSize: isCenter ? 26 : 20 }}>{room.icon}</span>

      <span style={{
        fontFamily: 'var(--pixel)', fontSize: isCenter ? 8 : 7,
        color: hovered ? (isCenter ? '#00ffcc' : 'var(--torch)') : (isCenter ? 'var(--teal)' : 'var(--text)'),
        textAlign: 'center', lineHeight: 1.6,
        textShadow: hovered ? `0 0 10px ${isCenter ? 'var(--teal)' : 'var(--torch)'}` : 'none',
        transition: 'color .18s',
      }}>
        {room.name.toUpperCase()}
      </span>

      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
        {room.desc}
      </span>

      {hovered && (
        <div style={{
          position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--pixel)', fontSize: 6,
          color: isCenter ? 'var(--teal)' : 'var(--torch)',
          letterSpacing: 1, whiteSpace: 'nowrap',
          animation: 'slideUp .15s ease-out',
        }}>
          [ ENTER ]
        </div>
      )}
    </div>
  )
}

function CornerDecor({ x, y, flipX, flipY }) {
  const sx = flipX ? -1 : 1
  const sy = flipY ? -1 : 1
  return (
    <svg style={{ position: 'absolute', left: x - (flipX ? 24 : 0), top: y - (flipY ? 24 : 0), pointerEvents: 'none' }} width={24} height={24}>
      <g transform={`scale(${sx},${sy}) translate(${flipX ? -24 : 0},${flipY ? -24 : 0})`}>
        <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#2a2a5a" strokeWidth="2" />
        <rect x={0} y={0} width={4} height={4} fill="#3a3a6a" />
      </g>
    </svg>
  )
}
