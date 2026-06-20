import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const DEFAULT_EVENTS = [
  { id:'e1', date:'2026-06-22', title:'CMIS 141 - Week 2 Discussion Due', color:'var(--teal)' },
  { id:'e2', date:'2026-06-24', title:'HIST 157 - Quiz 2', color:'var(--yellow)' },
  { id:'e3', date:'2026-06-26', title:'CMIS 141 - Assignment 2 Due', color:'var(--teal)' },
  { id:'e4', date:'2026-06-28', title:'ALS: Insurance Quote Deadline', color:'var(--red)' },
  { id:'e5', date:'2026-07-04', title:'Independence Day (No Class)', color:'var(--text-dim)' },
  { id:'e6', date:'2026-07-08', title:'HIST 157 - Midterm Exam', color:'var(--red)' },
  { id:'e7', date:'2026-07-10', title:'CMIS 141 - Project 1 Due', color:'var(--teal)' },
  { id:'e8', date:'2026-07-20', title:'UMGC Session II Ends', color:'var(--yellow)' },
  { id:'e9', date:'2026-08-24', title:'UMGC Session III Starts', color:'var(--torch)' },
]

let nextEvtId = 200

export default function Office() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useLocalStorage('md-events', DEFAULT_EVENTS)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title:'', color:'var(--teal)' })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const dateStr = (d) => {
    if (!d) return ''
    const mm = String(month+1).padStart(2,'0')
    const dd = String(d).padStart(2,'0')
    return `${year}-${mm}-${dd}`
  }

  const eventsOn = (d) => events.filter(e => e.date === dateStr(d))

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11) }
    else setMonth(m => m-1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y+1); setMonth(0) }
    else setMonth(m => m+1)
    setSelected(null)
  }

  const addEvent = () => {
    if (!form.title.trim() || !selected) return
    setEvents(prev => [...prev, { id:String(++nextEvtId), date:dateStr(selected), title:form.title, color:form.color }])
    setForm({ title:'', color:'var(--teal)' })
    setAdding(false)
  }

  const delEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  const isToday = (d) => {
    const t = new Date()
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear()
  }

  const selectedEvents = selected ? eventsOn(selected) : []

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, height:'calc(100vh - 160px)' }}>
      {/* Calendar grid */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
          <button className="btn sm" onClick={prevMonth}>◄</button>
          <span style={{ fontFamily:'var(--pixel)', fontSize:9, color:'var(--torch)', flex:1, textAlign:'center' }}>
            {MONTHS[month].toUpperCase()} {year}
          </span>
          <button className="btn sm" onClick={nextMonth}>►</button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:2 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontFamily:'var(--pixel)', fontSize:7,
              color:'var(--text-dim)', padding:'4px 0' }}>
              {d.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {cells.map((d, i) => {
            const dayEvts = d ? eventsOn(d) : []
            const isSel = selected === d && d !== null
            const itToday = d && isToday(d)
            return (
              <div key={i}
                onClick={() => { if (d) { setSelected(isSel ? null : d); setAdding(false) } }}
                style={{
                  minHeight:64, padding:'4px 5px',
                  background: isSel ? 'rgba(244,162,30,.12)' : 'rgba(0,0,0,.25)',
                  border:`2px solid ${isSel ? 'var(--torch)' : itToday ? 'var(--teal)' : 'var(--room-border)'}`,
                  cursor: d ? 'pointer' : 'default',
                  opacity: d ? 1 : 0.2,
                  transition:'border-color .12s',
                  overflow:'hidden',
                }}
              >
                {d && (
                  <>
                    <div style={{ fontSize:14, fontFamily:'var(--pixel)',
                      color: itToday ? 'var(--teal)' : isSel ? 'var(--torch)' : 'var(--text)',
                      marginBottom:3 }}>
                      {d}
                    </div>
                    {dayEvts.slice(0,2).map(e => (
                      <div key={e.id} style={{
                        fontSize:10, color:'#07070e',
                        background:e.color, padding:'1px 3px',
                        marginBottom:1, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap',
                        borderRadius:1,
                      }}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvts.length > 2 && (
                      <div style={{ fontSize:10, color:'var(--text-dim)' }}>+{dayEvts.length-2} more</div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      <div style={{ overflowY:'auto' }}>
        {selected ? (
          <div>
            <div style={{ fontFamily:'var(--pixel)', fontSize:8, color:'var(--torch)', marginBottom:14 }}>
              {MONTHS[month].toUpperCase().slice(0,3)} {selected}, {year}
            </div>

            {selectedEvents.length === 0 ? (
              <div style={{ color:'var(--text-dim)', fontSize:16, marginBottom:12 }}>No events</div>
            ) : (
              selectedEvents.map(e => (
                <div key={e.id} className="card" style={{ marginBottom:8, borderLeft:`3px solid ${e.color}`, padding:'10px 12px' }}>
                  <div style={{ fontSize:16, color:'var(--text)', marginBottom:4 }}>{e.title}</div>
                  <button className="btn sm danger" onClick={() => delEvent(e.id)} style={{ fontSize:11 }}>Delete</button>
                </div>
              ))
            )}

            {adding ? (
              <div className="card" style={{ marginTop:8 }}>
                <div className="section-label">New Event</div>
                <input className="input" style={{ marginBottom:8, fontSize:15 }}
                  placeholder="Event title..." value={form.title}
                  onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addEvent()}
                  autoFocus
                />
                <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  {['var(--teal)','var(--yellow)','var(--red)','var(--torch)'].map(c => (
                    <button key={c}
                      onClick={() => setForm(f => ({ ...f, color:c }))}
                      style={{ width:24, height:24, background:c, border:`3px solid ${form.color===c?'#fff':'transparent'}`, cursor:'pointer' }}
                    />
                  ))}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn sm primary" onClick={addEvent}>Add</button>
                  <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn primary" style={{ width:'100%', marginTop:8 }} onClick={() => setAdding(true)}>
                + Add Event
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="section-label">Upcoming Events</div>
            {events
              .filter(e => e.date >= new Date().toISOString().slice(0,10))
              .sort((a,b) => a.date.localeCompare(b.date))
              .slice(0, 10)
              .map(e => (
                <div key={e.id} className="card" style={{ marginBottom:8, borderLeft:`3px solid ${e.color}`, padding:'8px 10px' }}>
                  <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:3 }}>{e.date}</div>
                  <div style={{ fontSize:15, color:'var(--text)' }}>{e.title}</div>
                </div>
              ))
            }
            {events.filter(e => e.date >= new Date().toISOString().slice(0,10)).length === 0 && (
              <div style={{ color:'var(--text-dim)', fontSize:16 }}>No upcoming events</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
