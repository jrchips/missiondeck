import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useIsMobile } from '../hooks/useIsMobile'

const DEFAULT_AGENTS = [
  {
    id: 'video',
    name: 'Video Uploader',
    icon: '🎬',
    status: 'idle',
    lastRun: '2026-06-19 14:32',
    detail: '3 videos pending',
    captionText: '',
  },
  {
    id: 'caption',
    name: 'Caption Creator',
    icon: '✍️',
    status: 'idle',
    lastRun: '2026-06-20 08:10',
    detail: 'Ready',
    captionText: '',
  },
  {
    id: 'jobsearch',
    name: 'Job Search',
    icon: '🔍',
    status: 'idle',
    lastRun: '2026-06-20 06:00',
    detail: '12 new matches found',
    captionText: 'IT Specialist GS-11 @ DHS — closes 2026-06-30\nProgram Analyst GS-09 @ VA — closes 2026-07-05\nManagement Analyst GS-11 @ CBP — closes 2026-07-12',
  },
  {
    id: 'waitlist',
    name: 'Waitlist Tracker',
    icon: '📋',
    status: 'idle',
    lastRun: '2026-06-20 09:00',
    detail: '7 signups',
    captionText: '',
    count: 7,
    goal: 50,
  },
]

const STATUS_COLORS = { running: 'var(--teal)', idle: 'var(--text-dim)', error: 'var(--red)' }
const STATUS_DOT    = { running: 'green', idle: 'gray', error: 'red' }

export default function CommandCenter() {
  const isMobile = useIsMobile()
  const [agents, setAgents] = useLocalStorage('md-agents', DEFAULT_AGENTS)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [copied, setCopied] = useState(null)

  const startEdit = (agent) => {
    setEditId(agent.id)
    setEditForm({ ...agent })
  }

  const saveEdit = () => {
    setAgents(prev => prev.map(a => a.id === editId ? { ...a, ...editForm } : a))
    setEditId(null)
  }

  const cancelEdit = () => setEditId(null)

  const copyText = (id, text) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const nudgeCount = (id, delta) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a
      const next = Math.max(0, (a.count ?? 0) + delta)
      return { ...a, count: next, detail: `${next} signups` }
    }))
  }

  const waitlist = agents.find(a => a.id === 'waitlist')
  const pct = waitlist ? Math.min(100, Math.round((waitlist.count / waitlist.goal) * 100)) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Make.com info bar */}
      <div style={{
        background: 'rgba(0,212,170,.06)', border: '1px solid rgba(0,212,170,.2)',
        padding: '10px 14px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 14, color: 'var(--teal)' }}>⚡</span>
        <span style={{ fontSize: 15, color: 'var(--text-dim)', flex: 1 }}>
          Agent data is manually updated. Connect Make.com → Paste results into each card below.
        </span>
        <span style={{ fontFamily: 'var(--pixel)', fontSize: 6, color: 'rgba(0,212,170,.5)' }}>
          WEBHOOK COMING SOON
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 14,
      }}>
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            editing={editId === agent.id}
            editForm={editForm}
            onEdit={() => startEdit(agent)}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onFormChange={(k, v) => setEditForm(f => ({ ...f, [k]: v }))}
            onCopy={(text) => copyText(agent.id, text)}
            copied={copied === agent.id}
            onNudge={(delta) => nudgeCount(agent.id, delta)}
            pct={agent.id === 'waitlist' ? pct : null}
          />
        ))}
      </div>

      {/* System summary */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="section-label">System Summary</div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Running', count: agents.filter(a => a.status === 'running').length, color: 'var(--teal)' },
            { label: 'Idle',    count: agents.filter(a => a.status === 'idle').length,    color: 'var(--text-dim)' },
            { label: 'Error',   count: agents.filter(a => a.status === 'error').length,   color: 'var(--red)' },
            { label: 'Waitlist', count: waitlist?.count ?? 0,                             color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--pixel)', fontSize: 20, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent, editing, editForm, onEdit, onSave, onCancel, onFormChange, onCopy, copied, onNudge, pct }) {
  const borderColor = agent.status === 'running' ? 'var(--teal)' : agent.status === 'error' ? 'var(--red)' : 'var(--room-border)'

  if (editing) {
    return (
      <div className="card" style={{ borderColor: 'var(--torch)' }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          {agent.icon} Edit {agent.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Status</div>
            <select className="select" style={{ fontSize: 15 }}
              value={editForm.status}
              onChange={e => onFormChange('status', e.target.value)}>
              <option value="running">Running</option>
              <option value="idle">Idle</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Last run</div>
            <input className="input" style={{ fontSize: 15 }} value={editForm.lastRun ?? ''}
              onChange={e => onFormChange('lastRun', e.target.value)} placeholder="2026-06-20 14:00" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Status detail</div>
            <input className="input" style={{ fontSize: 15 }} value={editForm.detail ?? ''}
              onChange={e => onFormChange('detail', e.target.value)} placeholder="e.g. 3 videos pending" />
          </div>
          {agent.id !== 'waitlist' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
                {agent.id === 'jobsearch' ? 'Job digest (one per line)' : 'Caption / Output from Make.com'}
              </div>
              <textarea className="textarea" style={{ fontSize: 14, minHeight: 90 }}
                value={editForm.captionText ?? ''}
                onChange={e => onFormChange('captionText', e.target.value)}
                placeholder="Paste Make.com output here..." />
            </div>
          )}
          {agent.id === 'waitlist' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Goal</div>
              <input className="input" style={{ fontSize: 15 }} type="number"
                value={editForm.goal ?? 50}
                onChange={e => onFormChange('goal', parseInt(e.target.value) || 50)} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button className="btn sm primary" onClick={onSave}>💾 Save</button>
            <button className="btn sm" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{
      borderColor,
      boxShadow: agent.status === 'running' ? '0 0 18px rgba(0,212,170,.18)' : agent.status === 'error' ? '0 0 18px rgba(230,57,70,.18)' : 'none',
      transition: 'all .3s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <span className={`status-dot ${STATUS_DOT[agent.status]}`} />
        <span style={{ fontSize: 18 }}>{agent.icon}</span>
        <span style={{ fontFamily: 'var(--pixel)', fontSize: 7, color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>
          {agent.name.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: STATUS_COLORS[agent.status], fontFamily: 'var(--pixel)' }}>
          {agent.status.toUpperCase()}
        </span>
        <button
          onClick={onEdit}
          title="Edit"
          style={{ background: 'transparent', border: '1px solid var(--room-border)', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: 13, padding: '2px 7px', lineHeight: 1, transition: 'all .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--torch)'; e.currentTarget.style.color = 'var(--torch)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--room-border)'; e.currentTarget.style.color = 'var(--text-dim)' }}
        >
          ✏
        </button>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>
        Last run: {agent.lastRun}
      </div>

      {/* Waitlist special */}
      {agent.id === 'waitlist' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 16, color: 'var(--teal)' }}>
              {agent.count} / {agent.goal} signups
            </span>
            <span style={{ fontFamily: 'var(--pixel)', fontSize: 8, color: pct >= 100 ? '#00ff88' : 'var(--yellow)' }}>
              {pct}%
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 10, height: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn sm" style={{ fontSize: 16, padding: '3px 12px' }} onClick={() => onNudge(-1)}>−</button>
            <span style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: 'var(--teal)', minWidth: 30, textAlign: 'center' }}>
              {agent.count}
            </span>
            <button className="btn sm primary" style={{ fontSize: 16, padding: '3px 12px' }} onClick={() => onNudge(1)}>+</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 10 }}>{agent.detail}</div>

          {agent.captionText ? (
            <div>
              <div style={{
                background: 'rgba(0,0,0,.35)', border: '1px solid var(--room-border)',
                padding: '9px 12px', marginBottom: 9, fontSize: 13,
                color: 'var(--text-dim)', maxHeight: 80, overflowY: 'auto',
                whiteSpace: 'pre-line', lineHeight: 1.6,
              }}>
                {agent.captionText}
              </div>
              <button
                className={`btn sm ${copied ? 'primary' : ''}`}
                onClick={() => onCopy(agent.captionText)}
                style={{ fontSize: 13 }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Output'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No output yet — click ✏ to paste Make.com results
            </div>
          )}
        </div>
      )}
    </div>
  )
}
