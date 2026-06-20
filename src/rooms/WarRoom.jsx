import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useIsMobile } from '../hooks/useIsMobile'

const COLS = ['Backlog', 'In Progress', 'Done']
const PRIORITY = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--teal)' }

const DEFAULT_CARDS = [
  { id:'1', col:'Backlog',     title:'Set up Make.com video pipeline', priority:'high',   due:'2026-06-25' },
  { id:'2', col:'Backlog',     title:'Write ALS business plan section', priority:'medium', due:'2026-06-30' },
  { id:'3', col:'In Progress', title:'UMGC Week 2 assignments',         priority:'high',   due:'2026-06-22' },
  { id:'4', col:'In Progress', title:'MissionDeck dungeon build',        priority:'high',   due:'2026-06-20' },
  { id:'5', col:'Done',        title:'LLC filed for ALS',               priority:'high',   due:'2026-05-01' },
  { id:'6', col:'Done',        title:'EIN obtained',                    priority:'medium', due:'2026-05-10' },
]

let nextId = 100

export default function WarRoom() {
  const isMobile = useIsMobile()
  const [cards, setCards] = useLocalStorage('md-kanban', DEFAULT_CARDS)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [adding, setAdding] = useState(null)
  const [form, setForm] = useState({ title: '', priority: 'medium', due: '' })
  const [mobileMoveId, setMobileMoveId] = useState(null)

  const dropOnCol = (col) => {
    if (!dragging || dragging.col === col) { setDragging(null); setDragOver(null); return }
    setCards(prev => prev.map(c => c.id === dragging.id ? { ...c, col } : c))
    setDragging(null)
    setDragOver(null)
  }

  const moveCard = (id, col) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, col } : c))
    setMobileMoveId(null)
  }

  const addCard = (col) => {
    if (!form.title.trim()) return
    setCards(prev => [...prev, { id: String(++nextId), col, ...form }])
    setForm({ title: '', priority: 'medium', due: '' })
    setAdding(null)
  }

  const deleteCard = (id) => setCards(prev => prev.filter(c => c.id !== id))

  const ColHeader = ({ col }) => {
    const count = cards.filter(c => c.col === col).length
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--pixel)', fontSize: 7,
          color: col === 'Done' ? 'var(--teal)' : col === 'In Progress' ? 'var(--yellow)' : 'var(--text-dim)',
        }}>
          {col.toUpperCase()}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{count}</span>
      </div>
    )
  }

  const CardItem = ({ card }) => (
    <div
      draggable={!isMobile}
      onDragStart={() => !isMobile && setDragging(card)}
      onDragEnd={() => { setDragging(null); setDragOver(null) }}
      style={{
        background: 'var(--room-bg)',
        borderLeft: `3px solid ${PRIORITY[card.priority] || 'var(--text-dim)'}`,
        padding: '9px 9px 9px 11px',
        cursor: isMobile ? 'default' : 'grab',
        opacity: dragging?.id === card.id ? 0.4 : 1,
        marginBottom: 6, position: 'relative',
      }}
    >
      <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 5, paddingRight: 20 }}>
        {card.title}
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={`badge ${card.priority === 'high' ? 'red' : card.priority === 'medium' ? 'yellow' : 'teal'}`}
          style={{ fontSize: 11 }}>
          {card.priority}
        </span>
        {card.due && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{card.due}</span>}

        {/* Mobile: move buttons */}
        {isMobile && mobileMoveId === card.id && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {COLS.filter(c => c !== card.col).map(c => (
              <button key={c} className="btn sm"
                style={{ fontSize: 11, borderColor: 'var(--teal)', color: 'var(--teal)' }}
                onClick={() => moveCard(card.id, c)}>
                → {c}
              </button>
            ))}
            <button className="btn sm" style={{ fontSize: 11 }} onClick={() => setMobileMoveId(null)}>✕</button>
          </div>
        )}
      </div>
      <button
        onClick={() => isMobile ? setMobileMoveId(mobileMoveId === card.id ? null : card.id) : deleteCard(card.id)}
        style={{
          position: 'absolute', top: 6, right: 6, background: 'transparent', border: 'none',
          color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, lineHeight: 1,
        }}
      >
        {isMobile ? '⋮' : '✕'}
      </button>
      {isMobile && mobileMoveId !== card.id && (
        <button
          onClick={() => deleteCard(card.id)}
          style={{ position: 'absolute', bottom: 6, right: 6, background: 'transparent', border: 'none',
            color: 'var(--red)', cursor: 'pointer', fontSize: 12, lineHeight: 1, opacity: 0.6 }}
        >✕</button>
      )}
    </div>
  )

  const AddForm = ({ col }) => adding === col ? (
    <div style={{ background: 'var(--room-bg)', border: '2px solid var(--torch)', padding: 10, marginTop: 6 }}>
      <input className="input" style={{ marginBottom: 6, fontSize: 15 }}
        placeholder="Card title..." value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && addCard(col)} autoFocus />
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <select className="select" style={{ fontSize: 14 }} value={form.priority}
          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input className="input" style={{ fontSize: 14 }} type="date" value={form.due}
          onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm primary" onClick={() => addCard(col)}>Add</button>
        <button className="btn sm" onClick={() => setAdding(null)}>Cancel</button>
      </div>
    </div>
  ) : (
    <button
      className="btn" style={{ fontSize: 15, width: '100%', textAlign: 'center', color: 'var(--text-dim)', borderStyle: 'dashed', marginTop: 6 }}
      onClick={() => setAdding(col)}>
      + Add
    </button>
  )

  if (isMobile) {
    // Mobile: stacked single-column view, one section per column
    return (
      <div>
        <div style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-dim)' }}>
          Tap ⋮ on a card to move it between columns.
        </div>
        {COLS.map(col => (
          <div key={col} style={{ marginBottom: 20 }}>
            <div style={{ borderBottom: '2px solid var(--room-border)', paddingBottom: 6, marginBottom: 10 }}>
              <ColHeader col={col} />
            </div>
            {cards.filter(c => c.col === col).map(card => <CardItem key={card.id} card={card} />)}
            <AddForm col={col} />
          </div>
        ))}
      </div>
    )
  }

  // Desktop: 3-column drag-and-drop
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-dim)' }}>
        Drag cards between columns.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, height: 'calc(100vh - 180px)' }}>
        {COLS.map(col => (
          <div
            key={col}
            onDragOver={e => { e.preventDefault(); setDragOver(col) }}
            onDrop={() => dropOnCol(col)}
            onDragLeave={() => setDragOver(null)}
            style={{
              background: 'rgba(0,0,0,.28)',
              border: `2px solid ${dragOver === col ? 'var(--torch)' : 'var(--room-border)'}`,
              padding: 10, display: 'flex', flexDirection: 'column', overflowY: 'auto',
              transition: 'border-color .15s',
            }}
          >
            <ColHeader col={col} />
            {cards.filter(c => c.col === col).map(card => <CardItem key={card.id} card={card} />)}
            <AddForm col={col} />
          </div>
        ))}
      </div>
    </div>
  )
}
