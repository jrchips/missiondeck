import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_LINKS = [
  { id:'l1', name:'YouTube Studio',      url:'https://studio.youtube.com',         icon:'🎬', color:'#ff0000' },
  { id:'l2', name:'Make.com',            url:'https://www.make.com',               icon:'⚙️', color:'#6636cd' },
  { id:'l3', name:'Gmail',               url:'https://mail.google.com',            icon:'📧', color:'#ea4335' },
  { id:'l4', name:'UMGC',               url:'https://my.umgc.edu',                icon:'🎓', color:'#ffd700' },
  { id:'l5', name:'USAJOBS',             url:'https://www.usajobs.gov',            icon:'💼', color:'#1b5e8c' },
  { id:'l6', name:'Facebook Page',       url:'https://www.facebook.com',           icon:'📘', color:'#1877f2' },
  { id:'l7', name:'Claude',              url:'https://claude.ai',                  icon:'🤖', color:'#cc785c' },
  { id:'l8', name:'Vercel Dashboard',    url:'https://vercel.com/dashboard',       icon:'▲',  color:'#ffffff' },
  { id:'l9', name:'Google Cloud Console',url:'https://console.cloud.google.com',   icon:'☁️', color:'#4285f4' },
]

let nextLinkId = 400

export default function Armory() {
  const [links, setLinks] = useLocalStorage('md-links', DEFAULT_LINKS)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', url:'', icon:'🔗', color:'var(--teal)' })

  const addLink = () => {
    if (!form.name.trim() || !form.url.trim()) return
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`
    setLinks(prev => [...prev, { id:String(++nextLinkId), ...form, url }])
    setForm({ name:'', url:'', icon:'🔗', color:'var(--teal)' })
    setAdding(false)
  }

  const deleteLink = (id) => setLinks(prev => prev.filter(l => l.id !== id))

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:18 }}>
        <div className="section-label">Quick Launch — click to open in new tab</div>
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',
        gap:12,
        marginBottom:18,
      }}>
        {links.map(link => (
          <div key={link.id} style={{ position:'relative' }}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:10, padding:'20px 12px',
                background:'var(--room-bg)',
                border:`2px solid var(--room-border)`,
                textDecoration:'none',
                transition:'all .18s',
                cursor:'pointer',
                minHeight:120,
                justifyContent:'center',
                outline: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = link.color || 'var(--torch)'
                e.currentTarget.style.boxShadow = `0 0 18px ${link.color || 'var(--torch)'}44`
                e.currentTarget.style.background = `${link.color || 'var(--torch)'}0a`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--room-border)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.background = 'var(--room-bg)'
              }}
            >
              <span style={{ fontSize:32 }}>{link.icon}</span>
              <span style={{ fontFamily:'var(--pixel)', fontSize:6.5,
                color:'var(--text)', textAlign:'center', lineHeight:1.6 }}>
                {link.name.toUpperCase()}
              </span>
              <span style={{
                fontFamily:'var(--pixel)', fontSize:6,
                color: link.color || 'var(--teal)',
              }}>
                ↗ OPEN
              </span>
            </a>
            <button
              onClick={() => deleteLink(link.id)}
              style={{
                position:'absolute', top:4, right:4,
                background:'transparent', border:'none', color:'var(--text-dim)',
                cursor:'pointer', fontSize:13, lineHeight:1, padding:2,
                opacity:.5, transition:'opacity .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '.5'}
            >✕</button>
          </div>
        ))}

        {/* Add new */}
        {adding ? (
          <div className="card" style={{ gridColumn:'1 / -1' }}>
            <div className="section-label">Add Quick Link</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8, alignItems:'end' }}>
              <div>
                <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:4 }}>Name</div>
                <input className="input" style={{ fontSize:15 }} placeholder="Site name"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} autoFocus />
              </div>
              <div>
                <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:4 }}>URL</div>
                <input className="input" style={{ fontSize:15 }} placeholder="https://..."
                  value={form.url} onChange={e => setForm(f => ({ ...f, url:e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addLink()} />
              </div>
              <div>
                <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:4 }}>Icon</div>
                <input className="input" style={{ fontSize:20, width:60, textAlign:'center' }}
                  value={form.icon} onChange={e => setForm(f => ({ ...f, icon:e.target.value }))} />
              </div>
              <div style={{ display:'flex', gap:6, paddingBottom:2 }}>
                <button className="btn sm primary" onClick={addLink}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="btn"
            style={{ minHeight:120, borderStyle:'dashed', color:'var(--text-dim)', fontSize:28 }}
            onClick={() => setAdding(true)}
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}
