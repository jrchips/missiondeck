import { useLocalStorage } from '../hooks/useLocalStorage'

const DEFAULT_CHECKLIST = [
  { id:'f1',  done:true,  label:'LLC filed',                             category:'legal' },
  { id:'f2',  done:true,  label:'EIN obtained',                          category:'legal' },
  { id:'f3',  done:true,  label:'Business bank account opened',          category:'financial' },
  { id:'f4',  done:false, label:'OSHA silica exposure plan written',     category:'compliance' },
  { id:'f5',  done:false, label:'General liability insurance quoted',    category:'financial' },
  { id:'f6',  done:false, label:'General liability insurance purchased', category:'financial' },
  { id:'f7',  done:false, label:'Facility identified',                   category:'facility' },
  { id:'f8',  done:false, label:'Lease signed',                          category:'facility' },
  { id:'f9',  done:false, label:'Ventilation system installed',          category:'facility' },
  { id:'f10', done:false, label:'DPOS application submitted',            category:'licensing' },
  { id:'f11', done:false, label:'DPOS inspection passed',                category:'licensing' },
  { id:'f12', done:false, label:'SAA approval for GI Bill',              category:'licensing' },
  { id:'f13', done:false, label:'Equipment inventory purchased',         category:'facility' },
  { id:'f14', done:false, label:'Insurance certificate on file',         category:'compliance' },
  { id:'f15', done:false, label:'First class scheduled',                 category:'operations' },
]

const CATEGORY_COLORS = {
  legal:      'var(--teal)',
  financial:  'var(--yellow)',
  compliance: 'var(--torch)',
  facility:   '#9b8fe8',
  licensing:  'var(--red)',
  operations: '#00c4d4',
}

const CATEGORY_LABELS = {
  legal:'Legal', financial:'Financial', compliance:'Compliance',
  facility:'Facility', licensing:'Licensing', operations:'Operations',
}

export default function Forge() {
  const [items, setItems] = useLocalStorage('md-forge', DEFAULT_CHECKLIST)

  const toggle = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, done:!i.done } : i))

  const done = items.filter(i => i.done).length
  const total = items.length
  const pct = Math.round((done / total) * 100)

  const nextAction = items.find(i => !i.done)

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      {/* Header stats */}
      <div className="card" style={{ marginBottom:18, borderColor:'var(--teal)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:'var(--pixel)', fontSize:9, color:'var(--teal)', marginBottom:4 }}>
              ALS LAUNCH CHECKLIST
            </div>
            <div style={{ fontSize:16, color:'var(--text-dim)' }}>
              American Lapidary School — Critical Path
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--pixel)', fontSize:22, color: pct === 100 ? '#00ff88' : pct > 50 ? 'var(--yellow)' : 'var(--torch)' }}>
              {pct}%
            </div>
            <div style={{ fontSize:14, color:'var(--text-dim)' }}>{done} of {total} done</div>
          </div>
        </div>
        <div className="progress-bar" style={{ height:16 }}>
          <div className="progress-fill" style={{ width:`${pct}%` }} />
        </div>
        {nextAction && (
          <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(244,162,30,.08)', border:'1px solid rgba(244,162,30,.25)' }}>
            <div style={{ fontSize:12, color:'var(--torch)', fontFamily:'var(--pixel)', marginBottom:4 }}>
              ► NEXT ACTION
            </div>
            <div style={{ fontSize:16, color:'var(--text)' }}>{nextAction.label}</div>
          </div>
        )}
      </div>

      {/* Grouped checklist */}
      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat)
        const catDone = catItems.filter(i => i.done).length
        return (
          <div key={cat} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:4, height:16, background:CATEGORY_COLORS[cat] }} />
              <span className="section-label" style={{ color:CATEGORY_COLORS[cat], margin:0 }}>
                {CATEGORY_LABELS[cat].toUpperCase()}
              </span>
              <span style={{ fontSize:13, color:'var(--text-dim)' }}>
                {catDone}/{catItems.length}
              </span>
            </div>

            {catItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 12px', marginBottom:4,
                  background: item.done ? 'rgba(0,212,170,.06)' : 'rgba(0,0,0,.25)',
                  border:`2px solid ${item.done ? 'rgba(0,212,170,.3)' : 'var(--room-border)'}`,
                  cursor:'pointer', transition:'all .15s',
                }}
                onMouseEnter={e => { if (!item.done) e.currentTarget.style.borderColor = CATEGORY_COLORS[cat] }}
                onMouseLeave={e => { if (!item.done) e.currentTarget.style.borderColor = 'var(--room-border)' }}
              >
                {/* Pixel checkbox */}
                <div style={{
                  width:18, height:18, border:`2px solid ${item.done ? 'var(--teal)' : CATEGORY_COLORS[cat]}`,
                  background: item.done ? 'var(--teal)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'all .15s',
                }}>
                  {item.done && <span style={{ color:'#07070e', fontSize:14, fontWeight:'bold', lineHeight:1 }}>✓</span>}
                </div>

                <span style={{
                  fontSize:17, color: item.done ? 'var(--text-dim)' : 'var(--text)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  flex:1, transition:'all .15s',
                }}>
                  {item.label}
                </span>

                {item.done && (
                  <span className="badge green" style={{ fontSize:11 }}>DONE</span>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
