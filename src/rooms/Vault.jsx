import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CATEGORIES = ['Tools & Equipment','Education','Business Expense','Inventory','Software','Other']

const DEFAULT_EXPENSES = [
  { id:'v1', date:'2026-05-12', item:'LLC Filing Fee', amount:150, category:'Business Expense' },
  { id:'v2', date:'2026-05-20', item:'Vite Pro subscription', amount:20, category:'Software' },
  { id:'v3', date:'2026-06-01', item:'Lapidary rough opal (1 lb)', amount:85, category:'Inventory' },
  { id:'v4', date:'2026-06-10', item:'UMGC Textbooks', amount:120, category:'Education' },
  { id:'v5', date:'2026-06-15', item:'Grinding wheel set', amount:210, category:'Tools & Equipment' },
]

const DEFAULT_OPALS = [
  { id:'o1', date:'2026-06-01', desc:'Ethiopian Welo Rough (1 lb)', cost:85, origin:'Ethiopia', grade:'Precious', notes:'Crystal base, high play' },
  { id:'o2', date:'2026-06-08', desc:'Australian Coober Pedy (50g)', cost:140, origin:'Australia', grade:'Precious', notes:'White base, blue flash' },
]

let nextVId = 500

export default function Vault() {
  const [expenses, setExpenses] = useLocalStorage('md-expenses', DEFAULT_EXPENSES)
  const [opals, setOpals] = useLocalStorage('md-opals', DEFAULT_OPALS)
  const [tab, setTab] = useState('expenses')
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), item:'', amount:'', category:'Business Expense' })
  const [opalForm, setOpalForm] = useState({ date:'', desc:'', cost:'', origin:'', grade:'Precious', notes:'' })
  const [adding, setAdding] = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const addExpense = () => {
    if (!form.item.trim() || !form.amount) return
    setExpenses(prev => [...prev, { id:String(++nextVId), ...form, amount:parseFloat(form.amount) }])
    setForm(f => ({ ...f, item:'', amount:'' }))
    setAdding(false)
  }

  const delExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id))

  const addOpal = () => {
    if (!opalForm.desc.trim()) return
    setOpals(prev => [...prev, { id:String(++nextVId), ...opalForm, cost:parseFloat(opalForm.cost)||0 }])
    setOpalForm({ date:'', desc:'', cost:'', origin:'', grade:'Precious', notes:'' })
    setAdding(false)
  }

  const delOpal = (id) => setOpals(prev => prev.filter(o => o.id !== id))

  const filtered = filterCat === 'All' ? expenses : expenses.filter(e => e.category === filterCat)
  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const byCategory = CATEGORIES.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0)

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        {['expenses','opals'].map(t => (
          <button key={t} className="btn"
            style={{ borderColor: tab===t ? 'var(--torch)' : 'var(--room-border)',
              color: tab===t ? 'var(--torch)' : 'var(--text-dim)', fontSize:16 }}
            onClick={() => { setTab(t); setAdding(false) }}>
            {t === 'expenses' ? '💰 Expenses' : '💎 Opal Inventory'}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <div>
          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8, marginBottom:16 }}>
            <div className="card" style={{ borderColor:'var(--teal)', textAlign:'center' }}>
              <div style={{ fontSize:14, color:'var(--text-dim)' }}>Total Spent</div>
              <div style={{ fontFamily:'var(--pixel)', fontSize:16, color:'var(--teal)' }}>
                ${expenses.reduce((s,e)=>s+e.amount,0).toFixed(2)}
              </div>
            </div>
            {byCategory.map(c => (
              <div key={c.cat} className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4 }}>{c.cat}</div>
                <div style={{ fontFamily:'var(--pixel)', fontSize:12, color:'var(--yellow)' }}>
                  ${c.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:14, color:'var(--text-dim)' }}>Filter:</span>
            {['All',...CATEGORIES].map(c => (
              <button key={c} className="btn sm"
                style={{ borderColor:filterCat===c?'var(--torch)':'var(--room-border)',
                  color:filterCat===c?'var(--torch)':'var(--text-dim)', fontSize:12 }}
                onClick={() => setFilterCat(c)}>{c}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto', marginBottom:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:16 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--room-border)' }}>
                  {['Date','Item','Amount','Category',''].map(h => (
                    <th key={h} style={{ padding:'6px 10px', color:'var(--text-dim)', fontFamily:'var(--pixel)',
                      fontSize:7, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a,b)=>b.date.localeCompare(a.date)).map(e => (
                  <tr key={e.id} style={{ borderBottom:'1px solid var(--room-border)' }}>
                    <td style={{ padding:'7px 10px', color:'var(--text-dim)', whiteSpace:'nowrap' }}>{e.date}</td>
                    <td style={{ padding:'7px 10px', color:'var(--text)' }}>{e.item}</td>
                    <td style={{ padding:'7px 10px', color:'var(--teal)', whiteSpace:'nowrap', fontFamily:'var(--pixel)', fontSize:12 }}>
                      ${e.amount.toFixed(2)}
                    </td>
                    <td style={{ padding:'7px 10px' }}>
                      <span className="badge dim" style={{ fontSize:11 }}>{e.category}</span>
                    </td>
                    <td style={{ padding:'7px 10px' }}>
                      <button style={{ background:'transparent',border:'none',color:'var(--text-dim)',cursor:'pointer',fontSize:14 }}
                        onClick={() => delExpense(e.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filterCat !== 'All' && filtered.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop:'2px solid var(--teal)' }}>
                    <td colSpan={2} style={{ padding:'7px 10px', color:'var(--text-dim)', fontFamily:'var(--pixel)', fontSize:7 }}>SUBTOTAL</td>
                    <td style={{ padding:'7px 10px', color:'var(--teal)', fontFamily:'var(--pixel)', fontSize:12 }}>${total.toFixed(2)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Add expense */}
          {adding ? (
            <div className="card">
              <div className="section-label">Add Expense</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                <input className="input" style={{ fontSize:14 }} type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
                <input className="input" style={{ fontSize:14 }} placeholder="Item description" value={form.item}
                  onChange={e => setForm(f => ({ ...f, item:e.target.value }))} autoFocus />
                <input className="input" style={{ fontSize:14 }} type="number" placeholder="Amount" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount:e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addExpense()} />
                <select className="select" style={{ fontSize:14 }} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn sm primary" onClick={addExpense}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" onClick={() => setAdding(true)}>+ Add Expense</button>
          )}
        </div>
      )}

      {tab === 'opals' && (
        <div>
          <div style={{ overflowX:'auto', marginBottom:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:16 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--room-border)' }}>
                  {['Date','Description','Cost','Origin','Grade','Notes',''].map(h => (
                    <th key={h} style={{ padding:'6px 10px', color:'var(--text-dim)', fontFamily:'var(--pixel)', fontSize:7, textAlign:'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opals.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid var(--room-border)' }}>
                    <td style={{ padding:'7px 10px', color:'var(--text-dim)' }}>{o.date}</td>
                    <td style={{ padding:'7px 10px', color:'var(--text)' }}>{o.desc}</td>
                    <td style={{ padding:'7px 10px', color:'var(--teal)', fontFamily:'var(--pixel)', fontSize:12 }}>${(o.cost||0).toFixed(2)}</td>
                    <td style={{ padding:'7px 10px', color:'var(--text-dim)' }}>{o.origin}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span className="badge teal" style={{ fontSize:11 }}>{o.grade}</span>
                    </td>
                    <td style={{ padding:'7px 10px', color:'var(--text-dim)', fontSize:14 }}>{o.notes}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <button style={{ background:'transparent',border:'none',color:'var(--text-dim)',cursor:'pointer',fontSize:14 }}
                        onClick={() => delOpal(o.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {adding ? (
            <div className="card">
              <div className="section-label">Log Opal Purchase</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <input className="input" style={{ fontSize:14 }} type="date"
                  value={opalForm.date} onChange={e => setOpalForm(f => ({ ...f, date:e.target.value }))} />
                <input className="input" style={{ fontSize:14 }} placeholder="Description"
                  value={opalForm.desc} onChange={e => setOpalForm(f => ({ ...f, desc:e.target.value }))} autoFocus />
                <input className="input" style={{ fontSize:14 }} type="number" placeholder="Cost $"
                  value={opalForm.cost} onChange={e => setOpalForm(f => ({ ...f, cost:e.target.value }))} />
                <input className="input" style={{ fontSize:14 }} placeholder="Origin country"
                  value={opalForm.origin} onChange={e => setOpalForm(f => ({ ...f, origin:e.target.value }))} />
                <select className="select" style={{ fontSize:14 }} value={opalForm.grade}
                  onChange={e => setOpalForm(f => ({ ...f, grade:e.target.value }))}>
                  <option>Precious</option><option>Common</option><option>Fire</option><option>Crystal</option>
                </select>
                <input className="input" style={{ fontSize:14 }} placeholder="Notes"
                  value={opalForm.notes} onChange={e => setOpalForm(f => ({ ...f, notes:e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addOpal()} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn sm primary" onClick={addOpal}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" onClick={() => setAdding(true)}>+ Log Opal</button>
          )}
        </div>
      )}
    </div>
  )
}
