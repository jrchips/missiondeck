import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_NOTES = [
  { id:'n1', title:'ALS Launch Strategy', content:`# ALS Launch Strategy\n\nAmerican Lapidary School key priorities:\n\n## Phase 1 - Legal & Financial\n- LLC filed ✓\n- EIN obtained ✓\n- Business bank account ✓\n\n## Phase 2 - Compliance\n- OSHA silica plan\n- General liability insurance\n- DPOS application\n\n## Phase 3 - Facility\n- Location identified\n- Lease signed\n- Ventilation installed\n\n## Marketing\n- Build waitlist to 50+\n- YouTube channel for tutorials\n- Facebook Page engagement`, updated:'2026-06-20' },
  { id:'n2', title:'Job Search Notes', content:`# USAJOBS Search Notes\n\n## Target Roles\n- IT Specialist (GS-9 to GS-12)\n- Program Analyst\n- Management Analyst\n\n## Agencies Targeting\n- DHS\n- DoD\n- VA\n- CBP\n\n## Application Tracker\nSee Kanban board for status of each application.\n\n## Resume Keywords\nCybersecurity, FISMA, NIST, cloud, Python, project management`, updated:'2026-06-19' },
  { id:'n3', title:'Make.com Automation Ideas', content:`# Make.com Automation Ideas\n\n## Active\n- Video caption generator\n- Job search daily digest\n- Social post scheduler\n\n## Ideas\n- ALS waitlist email sequence\n- Invoice generator\n- YouTube → Facebook cross-post\n- Expense tracker Slack alert`, updated:'2026-06-18' },
]

let nextNoteId = 300

function parseMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h4 style="color:var(--torch);font-size:15px;margin:10px 0 4px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:var(--teal);font-size:16px;margin:12px 0 5px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:var(--torch);font-size:18px;margin:0 0 8px">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,.4);padding:1px 5px;font-family:var(--mono)">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0 2px 16px">$1</li>')
    .replace(/^(.+)$/gm, (line) => line.startsWith('<') ? line : `<p style="margin:3px 0">${line}</p>`)
    .replace(/\n/g, '')
}

export default function Library() {
  const [notes, setNotes] = useLocalStorage('md-notes', DEFAULT_NOTES)
  const [activeId, setActiveId] = useState(notes[0]?.id ?? null)
  const [editing, setEditing] = useState(false)
  const [preview, setPreview] = useState(true)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [search, setSearch] = useState('')

  const active = notes.find(n => n.id === activeId)

  const selectNote = (id) => {
    setActiveId(id)
    setEditing(false)
    setPreview(true)
  }

  const startEdit = () => {
    if (!active) return
    setEditContent(active.content)
    setEditTitle(active.title)
    setEditing(true)
    setPreview(false)
  }

  const saveEdit = () => {
    setNotes(prev => prev.map(n => n.id === activeId
      ? { ...n, title:editTitle, content:editContent, updated:new Date().toISOString().slice(0,10) }
      : n
    ))
    setEditing(false)
    setPreview(true)
  }

  const newNote = () => {
    const id = String(++nextNoteId)
    const note = { id, title:'New Note', content:'# New Note\n\nStart writing...', updated:new Date().toISOString().slice(0,10) }
    setNotes(prev => [...prev, note])
    setActiveId(id)
    setEditContent(note.content)
    setEditTitle(note.title)
    setEditing(true)
    setPreview(false)
  }

  const deleteNote = (id) => {
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id)
      if (activeId === id) setActiveId(remaining[0]?.id ?? null)
      return remaining
    })
    setEditing(false)
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:0, height:'calc(100vh - 160px)' }}>
      {/* Sidebar */}
      <div style={{ borderRight:'2px solid var(--room-border)', padding:'0 12px 0 0', overflowY:'auto' }}>
        <div style={{ marginBottom:10 }}>
          <input className="input" style={{ fontSize:14, padding:'6px 10px' }}
            placeholder="Search notes..." value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button className="btn primary" style={{ width:'100%', marginBottom:10, fontSize:15 }} onClick={newNote}>
          + New Note
        </button>

        {filtered.map(n => (
          <div key={n.id}
            onClick={() => selectNote(n.id)}
            style={{
              padding:'10px 12px', marginBottom:4, cursor:'pointer',
              background: activeId === n.id ? 'rgba(244,162,30,.1)' : 'rgba(0,0,0,.2)',
              border:`2px solid ${activeId === n.id ? 'var(--torch)' : 'transparent'}`,
              transition:'all .12s',
            }}
          >
            <div style={{ fontSize:14, color: activeId === n.id ? 'var(--torch)' : 'var(--text)',
              marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {n.title}
            </div>
            <div style={{ fontSize:12, color:'var(--text-dim)' }}>{n.updated}</div>
          </div>
        ))}
      </div>

      {/* Editor/Viewer */}
      <div style={{ paddingLeft:16, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {active ? (
          <>
            {/* Toolbar */}
            <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
              {editing ? (
                <>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ fontFamily:'var(--pixel)', fontSize:9, color:'var(--torch)', background:'transparent',
                      border:'none', borderBottom:'2px solid var(--torch)', outline:'none', flex:1, padding:'2px 4px' }}
                  />
                  <button className="btn sm primary" onClick={saveEdit}>Save</button>
                  <button className="btn sm" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn sm" style={{ color:'var(--text-dim)' }}
                    onClick={() => setPreview(p => !p)}>
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontFamily:'var(--pixel)', fontSize:9, color:'var(--torch)', flex:1 }}>
                    {active.title}
                  </span>
                  <button className="btn sm" onClick={startEdit}>✏ Edit</button>
                  <button className="btn sm danger" onClick={() => deleteNote(active.id)}>Delete</button>
                </>
              )}
            </div>

            {/* Content */}
            <div style={{ flex:1, overflow:'auto' }}>
              {editing && !preview ? (
                <textarea
                  className="textarea"
                  style={{ width:'100%', height:'100%', minHeight:'unset', fontSize:16, lineHeight:1.7 }}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  autoFocus
                />
              ) : (
                <div
                  style={{ fontSize:17, lineHeight:1.8, color:'var(--text)' }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(editing ? editContent : active.content) }}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ color:'var(--text-dim)', fontSize:18, textAlign:'center', marginTop:60 }}>
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  )
}
