import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useIsMobile } from '../hooks/useIsMobile'

const CATEGORIES = ['Tools & Equipment', 'Education', 'Business Expense', 'Inventory', 'Software', 'Other']

const DEFAULT_EXPENSES = [
  { id:'v1', date:'2026-05-12', item:'LLC Filing Fee',          amount:150, category:'Business Expense' },
  { id:'v2', date:'2026-05-20', item:'Vite Pro subscription',   amount:20,  category:'Software' },
  { id:'v3', date:'2026-06-01', item:'Lapidary rough opal (1 lb)', amount:85, category:'Inventory' },
  { id:'v4', date:'2026-06-10', item:'UMGC Textbooks',          amount:120, category:'Education' },
  { id:'v5', date:'2026-06-15', item:'Grinding wheel set',      amount:210, category:'Tools & Equipment' },
]

const DEFAULT_OPALS = [
  { id:'o1', date:'2026-06-01', desc:'Ethiopian Welo Rough (1 lb)', cost:85,  origin:'Ethiopia', grade:'Precious', notes:'Crystal base, high play' },
  { id:'o2', date:'2026-06-08', desc:'Australian Coober Pedy (50g)', cost:140, origin:'Australia', grade:'Precious', notes:'White base, blue flash' },
]

let nextVId = 500

export default function Vault() {
  const isMobile = useIsMobile()
  const [expenses, setExpenses] = useLocalStorage('md-expenses', DEFAULT_EXPENSES)
  const [opals, setOpals] = useLocalStorage('md-opals', DEFAULT_OPALS)
  const [tab, setTab] = useState('expenses')
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), item: '', amount: '', category: 'Business Expense' })
  const [opalForm, setOpalForm] = useState({ date: '', desc: '', cost: '', origin: '', grade: 'Precious', notes: '' })
  const [adding, setAdding] = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const addExpense = () => {
    if (!form.item.trim() || !form.amount) return
    setExpenses(prev => [...prev, { id: String(++nextVId), ...form, amount: parseFloat(form.amount) }])
    setForm(f => ({ ...f, item: '', amount: '' }))
    setAdding(false)
  }

  const addOpal = () => {
    if (!opalForm.desc.trim()) return
    setOpals(prev => [...prev, { id: String(++nextVId), ...opalForm, cost: parseFloat(opalForm.cost) || 0 }])
    setOpalForm({ date: '', desc: '', cost: '', origin: '', grade: 'Precious', notes: '' })
    setAdding(false)
  }

  const filtered = filterCat === 'All' ? expenses : expenses.filter(e => e.category === filterCat)
  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = CATEGORIES.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['expenses', 'opals'].map(t => (
          <button key={t} className="btn"
            style={{ borderColor: tab === t ? 'var(--torch)' : 'var(--room-border)',
              color: tab === t ? 'var(--torch)' : 'var(--text-dim)', fontSize: 15 }}
            onClick={() => { setTab(t); setAdding(false) }}>
            {t === 'expenses' ? '💰 Expenses' : '💎 Opals'}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <div>
          {/* Totals */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${Math.min(byCategory.length + 1, 5)}, 1fr)`,
            gap: 8, marginBottom: 14,
          }}>
            <div className="card" style={{ borderColor: 'var(--teal)', textAlign: 'center', padding: '10px 8px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Total</div>
              <div style={{ fontFamily: 'var(--pixel)', fontSize: 13, color: 'var(--teal)' }}>
                ${grandTotal.toFixed(2)}
              </div>
            </div>
            {byCategory.map(c => (
              <div key={c.cat} className="card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                  {c.cat.split(' ')[0]}
                </div>
                <div style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: 'var(--yellow)' }}>
                  ${c.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Filter — horizontal scroll on mobile */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
            {['All', ...CATEGORIES].map(c => (
              <button key={c} className="btn sm"
                style={{ borderColor: filterCat === c ? 'var(--torch)' : 'var(--room-border)',
                  color: filterCat === c ? 'var(--torch)' : 'var(--text-dim)', fontSize: 12, whiteSpace: 'nowrap' }}
                onClick={() => setFilterCat(c)}>{c}</button>
            ))}
          </div>

          {/* Expense list — cards on mobile, table on desktop */}
          {isMobile ? (
            <div>
              {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <div key={e.id} className="card" style={{ marginBottom: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{e.item}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>{e.date} · {e.category}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: 'var(--teal)', whiteSpace: 'nowrap' }}>
                    ${e.amount.toFixed(2)}
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
                    onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))}>✕</button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ color: 'var(--text-dim)', fontSize: 16, padding: 12 }}>No expenses in this category</div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--room-border)' }}>
                    {['Date', 'Item', 'Amount', 'Category', ''].map(h => (
                      <th key={h} style={{ padding: '6px 10px', color: 'var(--text-dim)', fontFamily: 'var(--pixel)', fontSize: 7, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--room-border)' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{e.date}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text)' }}>{e.item}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--teal)', whiteSpace: 'nowrap', fontFamily: 'var(--pixel)', fontSize: 12 }}>${e.amount.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span className="badge dim" style={{ fontSize: 11 }}>{e.category}</span>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
                          onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add form */}
          {adding ? (
            <div className="card">
              <div className="section-label">Add Expense</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 8 }}>
                  <input className="input" style={{ fontSize: 14 }} type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  <input className="input" style={{ fontSize: 14 }} type="number" placeholder="Amount $" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <input className="input" style={{ fontSize: 14 }} placeholder="Item description" value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addExpense()} autoFocus />
                <select className="select" style={{ fontSize: 14 }} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn sm primary" onClick={addExpense}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" style={{ fontSize: 15 }} onClick={() => setAdding(true)}>+ Add Expense</button>
          )}
        </div>
      )}

      {tab === 'opals' && (
        <div>
          {opals.map(o => (
            <div key={o.id} className="card" style={{ marginBottom: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{o.desc}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{o.date}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{o.origin}</span>
                    <span className="badge teal" style={{ fontSize: 11 }}>{o.grade}</span>
                  </div>
                  {o.notes && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{o.notes}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: 'var(--teal)' }}>${(o.cost || 0).toFixed(2)}</span>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}
                    onClick={() => setOpals(prev => prev.filter(x => x.id !== o.id))}>✕</button>
                </div>
              </div>
            </div>
          ))}

          {adding ? (
            <div className="card">
              <div className="section-label">Log Opal Purchase</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="input" style={{ fontSize: 14 }} type="date" value={opalForm.date}
                    onChange={e => setOpalForm(f => ({ ...f, date: e.target.value }))} />
                  <input className="input" style={{ fontSize: 14 }} type="number" placeholder="Cost $"
                    value={opalForm.cost} onChange={e => setOpalForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
                <input className="input" style={{ fontSize: 14 }} placeholder="Description" value={opalForm.desc}
                  onChange={e => setOpalForm(f => ({ ...f, desc: e.target.value }))} autoFocus />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="input" style={{ fontSize: 14 }} placeholder="Origin country"
                    value={opalForm.origin} onChange={e => setOpalForm(f => ({ ...f, origin: e.target.value }))} />
                  <select className="select" style={{ fontSize: 14 }} value={opalForm.grade}
                    onChange={e => setOpalForm(f => ({ ...f, grade: e.target.value }))}>
                    <option>Precious</option><option>Common</option><option>Fire</option><option>Crystal</option>
                  </select>
                </div>
                <input className="input" style={{ fontSize: 14 }} placeholder="Notes"
                  value={opalForm.notes} onChange={e => setOpalForm(f => ({ ...f, notes: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addOpal()} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn sm primary" onClick={addOpal}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" style={{ fontSize: 15 }} onClick={() => setAdding(true)}>+ Log Opal</button>
          )}
        </div>
      )}
    </div>
  )
}
