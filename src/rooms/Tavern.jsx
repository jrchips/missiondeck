import { useState, useEffect, useRef } from 'react'
import { playTickSound, playSuccessSound } from '../sounds'

const MODES = [
  { label:'Focus',      work:25, break:5  },
  { label:'Long Focus', work:50, break:10 },
  { label:'Quick',      work:15, break:3  },
]

// Simple Snake game
function SnakeGame({ onClose }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const [score, setScore] = useState(0)
  const [dead, setDead] = useState(false)

  const CELL = 16, COLS = 20, ROWS = 16
  const W = CELL * COLS, H = CELL * ROWS

  const reset = () => {
    stateRef.current = {
      snake: [{ x:10, y:8 }],
      dir: { x:1, y:0 },
      nextDir: { x:1, y:0 },
      food: { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) },
      score: 0,
      tick: 0,
    }
    setScore(0)
    setDead(false)
  }

  useEffect(() => {
    reset()
    const onKey = (e) => {
      if (!stateRef.current) return
      const map = {
        ArrowUp:    { x:0,  y:-1 },
        ArrowDown:  { x:0,  y:1  },
        ArrowLeft:  { x:-1, y:0  },
        ArrowRight: { x:1,  y:0  },
        w: { x:0, y:-1 }, s: { x:0, y:1 }, a: { x:-1, y:0 }, d: { x:1, y:0 },
      }
      const nd = map[e.key]
      if (!nd) return
      const cur = stateRef.current.dir
      if (nd.x === -cur.x && nd.y === -cur.y) return // no 180
      stateRef.current.nextDir = nd
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frameCount = 0

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop)
      frameCount++
      const s = stateRef.current
      if (!s || dead) { draw(ctx, stateRef.current); return }

      if (frameCount % 8 !== 0) { draw(ctx, s); return }

      s.dir = s.nextDir
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setDead(true)
        playTickSound()
        return
      }

      s.snake.unshift(head)
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score++
        setScore(s.score)
        playTickSound()
        s.food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }
      } else {
        s.snake.pop()
      }

      draw(ctx, s)
    }

    const draw = (ctx, s) => {
      if (!s) return
      ctx.fillStyle = '#07070e'
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = '#0d0d1e'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, H); ctx.stroke()
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y*CELL); ctx.lineTo(W, y*CELL); ctx.stroke()
      }

      // Food
      ctx.fillStyle = '#f4a21e'
      ctx.shadowColor = '#f4a21e'
      ctx.shadowBlur = 8
      ctx.fillRect(s.food.x*CELL+2, s.food.y*CELL+2, CELL-4, CELL-4)
      ctx.shadowBlur = 0

      // Snake
      s.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#00ffcc' : '#00d4aa'
        if (i > 0) ctx.fillStyle = `hsl(170,100%,${Math.max(30,55 - i)}%)`
        ctx.shadowColor = '#00d4aa'
        ctx.shadowBlur = i === 0 ? 12 : 0
        ctx.fillRect(seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2)
      })
      ctx.shadowBlur = 0
    }

    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [dead])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <span style={{ fontFamily:'var(--pixel)', fontSize:8, color:'var(--torch)' }}>
          SCORE: {score}
        </span>
        <button className="btn sm" onClick={reset}>↺ RESET</button>
        <button className="btn sm" onClick={onClose}>✕ CLOSE</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        style={{ border:'2px solid var(--room-border)', display:'block' }} />
      {dead && (
        <div style={{ fontFamily:'var(--pixel)', fontSize:10, color:'var(--red)', textAlign:'center' }}>
          GAME OVER — Score: {score}
          <br />
          <button className="btn primary" style={{ marginTop:10, fontSize:12 }} onClick={reset}>
            TRY AGAIN
          </button>
        </div>
      )}
      <div style={{ fontSize:13, color:'var(--text-dim)' }}>Arrow keys or WASD to move</div>
    </div>
  )
}

export default function Tavern() {
  const [modeIdx, setModeIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState('work') // 'work' | 'break'
  const [secs, setSecs] = useState(MODES[0].work * 60)
  const [cycles, setCycles] = useState(0)
  const [game, setGame] = useState(null)
  const intervalRef = useRef(null)

  const mode = MODES[modeIdx]
  const total = phase === 'work' ? mode.work * 60 : mode.break * 60
  const pct = Math.round(((total - secs) / total) * 100)

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const start = () => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          playSuccessSound()
          clearInterval(intervalRef.current)
          setRunning(false)
          setPhase(p => {
            const next = p === 'work' ? 'break' : 'work'
            setSecs(next === 'work' ? mode.work*60 : mode.break*60)
            if (p === 'break') setCycles(c => c+1)
            return next
          })
          return 0
        }
        if (s % 60 === 0) playTickSound()
        return s - 1
      })
    }, 1000)
  }

  const pause = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setPhase('work')
    setSecs(mode.work * 60)
  }

  const changeMode = (i) => {
    setModeIdx(i)
    clearInterval(intervalRef.current)
    setRunning(false)
    setPhase('work')
    setSecs(MODES[i].work * 60)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  if (game === 'snake') return <SnakeGame onClose={() => setGame(null)} />

  return (
    <div style={{ maxWidth:700, margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom:30 }}>
        <div className="section-label" style={{ marginBottom:18, justifyContent:'center', display:'flex' }}>
          Pomodoro Timer
        </div>

        {/* Mode selector */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:22 }}>
          {MODES.map((m, i) => (
            <button key={i} className="btn"
              style={{ borderColor:modeIdx===i?'var(--torch)':'var(--room-border)', color:modeIdx===i?'var(--torch)':'var(--text-dim)', fontSize:15 }}
              onClick={() => changeMode(i)}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Phase indicator */}
        <div style={{ fontFamily:'var(--pixel)', fontSize:9,
          color: phase === 'work' ? 'var(--red)' : 'var(--teal)',
          marginBottom:12, letterSpacing:2 }}>
          {phase === 'work' ? '⚡ FOCUS TIME' : '☕ BREAK TIME'}
        </div>

        {/* Timer display */}
        <div style={{
          fontFamily:'var(--pixel)', fontSize:56, color: phase==='work' ? 'var(--torch)' : 'var(--teal)',
          textShadow:`0 0 30px ${phase==='work' ? 'rgba(244,162,30,.5)' : 'rgba(0,212,170,.5)'}`,
          marginBottom:16, lineHeight:1,
          animation: running && secs <= 60 ? 'statusBlink .5s ease-in-out infinite' : 'none',
        }}>
          {fmt(secs)}
        </div>

        {/* Progress ring */}
        <div className="progress-bar" style={{ maxWidth:360, margin:'0 auto 20px', height:8 }}>
          <div className="progress-fill"
            style={{ width:`${pct}%`, background: phase==='work' ? 'var(--torch)' : 'var(--teal)' }} />
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:24 }}>
          {running ? (
            <button className="btn primary" style={{ fontSize:20, padding:'10px 28px' }} onClick={pause}>
              ⏸ PAUSE
            </button>
          ) : (
            <button className="btn primary" style={{ fontSize:20, padding:'10px 28px' }} onClick={start}>
              {secs === (phase==='work' ? mode.work*60 : mode.break*60) ? '▶ START' : '▶ RESUME'}
            </button>
          )}
          <button className="btn" style={{ fontSize:20, padding:'10px 20px' }} onClick={reset}>
            ↺ RESET
          </button>
        </div>

        <div style={{ fontSize:15, color:'var(--text-dim)' }}>
          Cycles completed today: <span style={{ color:'var(--teal)', fontFamily:'var(--pixel)', fontSize:12 }}>{cycles}</span>
        </div>
        <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:4 }}>
          Work {mode.work}min → Break {mode.break}min
        </div>
      </div>

      {/* Games section */}
      <div style={{ borderTop:'2px solid var(--room-border)', paddingTop:22 }}>
        <div className="section-label" style={{ marginBottom:14 }}>Decompression Zone</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
          <button className="btn"
            style={{ padding:'18px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}
            onClick={() => setGame('snake')}>
            <span style={{ fontSize:28 }}>🐍</span>
            <span style={{ fontFamily:'var(--pixel)', fontSize:6, color:'var(--teal)' }}>SNAKE</span>
          </button>

          <div className="btn" style={{ padding:'18px 12px', display:'flex', flexDirection:'column',
            alignItems:'center', gap:8, opacity:.4, cursor:'not-allowed' }}>
            <span style={{ fontSize:28 }}>🧩</span>
            <span style={{ fontFamily:'var(--pixel)', fontSize:6, color:'var(--text-dim)' }}>COMING SOON</span>
          </div>

          <div className="btn" style={{ padding:'18px 12px', display:'flex', flexDirection:'column',
            alignItems:'center', gap:8, opacity:.4, cursor:'not-allowed' }}>
            <span style={{ fontSize:28 }}>🎯</span>
            <span style={{ fontFamily:'var(--pixel)', fontSize:6, color:'var(--text-dim)' }}>COMING SOON</span>
          </div>
        </div>
      </div>
    </div>
  )
}
