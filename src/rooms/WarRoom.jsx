import { useState, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const COLS = ['Backlog', 'In Progress', 'Done']
const PRIORITY = { high:'var(--red)', medium:'var(--yellow)', low:'var(--teal)' }

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
  const [cards, setCards] = useLocalStorage('md-kanban', DEFAULT_CARDS)
  const [dragging, setDragging] = useState(null) // { id, fromCol }
  const [dragOver, setDragOver] = useState(null) // col name
  const [adding, setAdding] = useState(null)     // col name
  const [form, setForm] = useState({ title:'', priority:'medium', due:'' })

  const startDrag = (card) => setDragging(card)

  const dropOnCol = (col) => {
    if (!dragging || dragging.col === col) { setDragging(null); setDragOver(null); return }
    setCards(prev => prev.map(c => c.id === dragging.id ? { ...c, col } : c))
    setDragging(null)
    setDragOver(null)
  }

  const addCard = (col) => {
    if (!form.title.trim()) return
    setCards(prev => [...prev, { id: String(++nextId), col, ...form }])
    setForm({ title:'', priority:'medium', due:'' })
    setAdding(null)
  }

  const deleteCard = (id) => setCards(prev => prev.filter(c => c.id !== id))

  return (
    <div style={{ height:'100%' }}>
      <div style={{ marginBottom:16 }}>
        <span className="section-label">Kanban Board — drag cards between columns</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, height:'calc(100vh - 160px)' }}>
        {COLS.map(col => {
          const colCards = cards.filter(c => c.col === col)
          return (
            <div
              key={col}
              onDragOver={e => { e.preventDefault(); setDragOver(col) }}
              onDrop={() => dropOnCol(col)}
              onDragLeave={() => setDragOver(null)}
              style={{
                background:'rgba(0,0,0,.3)',
                border:`2px solid ${dragOver === col ? 'var(--torch)' : 'var(--room-border)'}`,
                padding:10,
                display:'flex', flexDirection:'column', gap:8,
                overflowY:'auto',
                transition:'border-color .15s',
              }}
            >
              {/* Column header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontFamily:'var(--pixel)', fontSize:7, color:
                  col==='Done' ? 'var(--teal)' : col==='In Progress' ? 'var(--yellow)' : 'var(--text-dim)',
                }}>
                  {col.toUpperCase()}
                </span>
                <span style={{ fontSize:13, color:'var(--text-dim)' }}>{colCards.length}</span>
              </div>

              {/* Cards */}
              {colCards.map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => startDrag(card)}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  style={{
                    background:'var(--room-bg)',
                    borderLeft:`3px solid ${PRIORITY[card.priority] || 'var(--text-dim)'}`,
                    padding:'10px 10px 10px 12px',
                    cursor:'grab',
                    opacity: dragging?.id === card.id ? .4 : 1,
                    transition:'opacity .15s',
                    position:'relative',
                  }}
                >
                  <div style={{ fontSize:16, color:'var(--text)', marginBottom:6, paddingRight:22 }}>
                    {card.title}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span className={`badge ${card.priority==='high'?'red':card.priority==='medium'?'yellow':'teal'}`}
                      style={{ fontSize:11 }}>
                      {card.priority}
                    </span>
                    {card.due && (
                      <span style={{ fontSize:12, color:'var(--text-dim)' }}>{card.due}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCard(card.id)}
                    style={{ position:'absolute', top:6, right:6, background:'transparent', border:'none',
                      color:'var(--text-dim)', cursor:'pointer', fontSize:14, lineHeight:1 }}
                  >✕</button>
                </div>
              ))}

              {/* Add card */}
              {adding === col ? (
                <div style={{ background:'var(--room-bg)', border:'2px solid var(--torch)', padding:10 }}>
                  <input className="input" style={{ marginBottom:6, fontSize:15 }}
                    placeholder="Card title..." value={form.title}
                    onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCard(col)}
                    autoFocus
                  />
                  <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <select className="select" style={{ fontSize:14 }}
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority:e.target.value }))}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input className="input" style={{ fontSize:14 }} type="date"
                      value={form.due}
                      onChange={e => setForm(f => ({ ...f, due:e.target.value }))} />
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn sm primary" onClick={() => addCard(col)}>Add</button>
                    <button className="btn sm" onClick={() => setAdding(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn"
                  style={{ fontSize:16, width:'100%', textAlign:'center', color:'var(--text-dim)', borderStyle:'dashed' }}
                  onClick={() => setAdding(col)}
                >
                  + Add Card
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
