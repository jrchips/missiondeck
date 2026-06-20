import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_AGENTS = [
  {
    id: 'video',
    name: 'Video Uploader',
    icon: '🎬',
    status: 'idle',
    lastRun: '2026-06-19 14:32',
    detail: '3 videos pending',
    caption: 'Caption ready — click to copy',
    captionText: '🔥 New video drop! Check out our latest lapidary tutorial. Like & subscribe for more gem-cutting content! #lapidary #gemstone #DIY',
  },
  {
    id: 'caption',
    name: 'Caption Creator',
    icon: '✍️',
    status: 'idle',
    lastRun: '2026-06-20 08:10',
    detail: 'Ready',
    caption: '',
    captionText: '',
  },
  {
    id: 'jobsearch',
    name: 'Job Search',
    icon: '🔍',
    status: 'running',
    lastRun: '2026-06-20 06:00',
    detail: '12 new matches found',
    caption: 'Latest: IT Specialist GS-11 @ DHS',
    captionText: '',
  },
  {
    id: 'waitlist',
    name: 'Waitlist Tracker',
    icon: '📋',
    status: 'idle',
    lastRun: '2026-06-20 09:00',
    detail: '7 signups',
    caption: 'Goal: 50 signups',
    captionText: '',
    count: 7,
    goal: 50,
  },
]

const STATUS_LABELS = { running:'RUNNING', idle:'IDLE', error:'ERROR' }
const STATUS_DOT = { running:'green', idle:'gray', error:'red' }

export default function CommandCenter() {
  const [agents, setAgents] = useLocalStorage('md-agents', DEFAULT_AGENTS)
  const [copied, setCopied] = useState(null)
  const [editingCount, setEditingCount] = useState(false)
  const [countInput, setCountInput] = useState('')

  const setStatus = (id, status) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const copyCaption = (agent) => {
    if (!agent.captionText) return
    navigator.clipboard.writeText(agent.captionText).then(() => {
      setCopied(agent.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const waitlist = agents.find(a => a.id === 'waitlist')
  const pct = waitlist ? Math.round((waitlist.count / waitlist.goal) * 100) : 0

  const saveCount = () => {
    const n = parseInt(countInput)
    if (!isNaN(n) && n >= 0) {
      setAgents(prev => prev.map(a => a.id === 'waitlist' ? { ...a, count: n, detail: `${n} signups` } : a))
    }
    setEditingCount(false)
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:22 }}>
        <div className="section-label">Agent Status Dashboard</div>
      </div>

      <div style={{ display:'grid', gap:16, gridTemplateColumns:'1fr 1fr' }}>
        {agents.map(agent => (
          <div key={agent.id} className="card" style={{
            borderColor: agent.status === 'running' ? 'var(--teal)' : agent.status === 'error' ? 'var(--red)' : 'var(--room-border)',
            boxShadow: agent.status === 'running' ? '0 0 20px rgba(0,212,170,.2)' : agent.status === 'error' ? '0 0 20px rgba(230,57,70,.2)' : 'none',
            transition:'all .3s',
          }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span className={`status-dot ${STATUS_DOT[agent.status]}`} />
              <span style={{ fontSize:20 }}>{agent.icon}</span>
              <span style={{ fontFamily:'var(--pixel)', fontSize:7, color:'var(--text)', flex:1 }}>
                {agent.name.toUpperCase()}
              </span>
              <span style={{ fontSize:11, color:
                agent.status === 'running' ? 'var(--teal)' :
                agent.status === 'error' ? 'var(--red)' : 'var(--text-dim)',
                fontFamily:'var(--pixel)',
              }}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>

            {/* Last run */}
            <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:6 }}>
              Last run: {agent.lastRun}
            </div>

            {/* Waitlist special UI */}
            {agent.id === 'waitlist' ? (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:16, color:'var(--teal)' }}>{agent.count} / {agent.goal} signups</span>
                  <span style={{ fontFamily:'var(--pixel)', fontSize:8, color:pct >= 100 ? '#00ff88' : 'var(--yellow)' }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-bar" style={{ marginBottom:10 }}>
                  <div className="progress-fill" style={{ width:`${Math.min(pct,100)}%` }} />
                </div>
                {editingCount ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="input" style={{ fontSize:15, padding:'5px 8px' }}
                      type="number" min="0" value={countInput}
                      onChange={e => setCountInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveCount()}
                      autoFocus
                    />
                    <button className="btn sm primary" onClick={saveCount}>Save</button>
                  </div>
                ) : (
                  <button className="btn sm" onClick={() => { setCountInput(String(agent.count)); setEditingCount(true) }}>
                    Update Count
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize:16, color:'var(--text)', marginBottom:8 }}>{agent.detail}</div>
                {agent.captionText && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:6 }}>{agent.caption}</div>
                    <button
                      className={`btn sm ${copied === agent.id ? 'primary' : ''}`}
                      onClick={() => copyCaption(agent)}
                    >
                      {copied === agent.id ? '✓ COPIED!' : '📋 Copy Caption'}
                    </button>
                  </div>
                )}
                {!agent.captionText && agent.caption && (
                  <div style={{ fontSize:14, color:'var(--teal)' }}>{agent.caption}</div>
                )}
              </div>
            )}

            {/* Status controls */}
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              {['running','idle','error'].map(s => (
                <button
                  key={s}
                  className="btn sm"
                  style={{ borderColor: agent.status === s ? (s==='running'?'var(--teal)':s==='error'?'var(--red)':'var(--text-dim)') : undefined,
                    fontSize:12 }}
                  onClick={() => setStatus(agent.id, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System summary */}
      <div className="card" style={{ marginTop:16 }}>
        <div className="section-label">System Summary</div>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          {[
            { label:'Running', count: agents.filter(a=>a.status==='running').length, color:'var(--teal)' },
            { label:'Idle',    count: agents.filter(a=>a.status==='idle').length,    color:'var(--text-dim)' },
            { label:'Error',   count: agents.filter(a=>a.status==='error').length,   color:'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--pixel)', fontSize:20, color:s.color }}>{s.count}</div>
              <div style={{ fontSize:14, color:'var(--text-dim)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--pixel)', fontSize:20, color:'var(--yellow)' }}>
              {waitlist?.count ?? 0}
            </div>
            <div style={{ fontSize:14, color:'var(--text-dim)' }}>Waitlist</div>
          </div>
        </div>
      </div>
    </div>
  )
}
