import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useIsMobile } from '../hooks/useIsMobile'

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
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
  const isMobile = useIsMobile()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useLocalStorage('md-events', DEFAULT_EVENTS)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', color: 'var(--teal)' })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1)
  while (cells.length % 7 !== 0) cells.push(null)

  const dateStr = (d) => {
    if (!d) return ''
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const eventsOn = (d) => events.filter(e => e.date === dateStr(d))

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const addEvent = () => {
    if (!form.title.trim() || !selected) return
    setEvents(prev => [...prev, { id: String(++nextEvtId), date: dateStr(selected), title: form.title, color: form.color }])
    setForm({ title: '', color: 'var(--teal)' })
    setAdding(false)
  }

  const delEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  const isToday = (d) => {
    const t = new Date()
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear()
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12)

  const CalendarGrid = (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="btn sm" onClick={prevMonth} style={{ fontSize: 14, padding: '5px 10px' }}>◄</button>
        <span style={{ fontFamily: 'var(--pixel)', fontSize: isMobile ? 7 : 9, color: 'var(--torch)', flex: 1, textAlign: 'center' }}>
          {MONTHS[month].toUpperCase()} {year}
        </span>
        <button className="btn sm" onClick={nextMonth} style={{ fontSize: 14, padding: '5px 10px' }}>►</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontFamily: 'var(--pixel)', fontSize: 6,
            color: 'var(--text-dim)', padding: '3px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          const dayEvts = d ? eventsOn(d) : []
          const isSel = selected === d && d !== null
          const itToday = d && isToday(d)
          return (
            <div
              key={i}
              onClick={() => { if (d) { setSelected(isSel ? null : d); setAdding(false) } }}
              style={{
                minHeight: isMobile ? 44 : 60,
                padding: '3px 3px',
                background: isSel ? 'rgba(244,162,30,.1)' : 'rgba(0,0,0,.22)',
                border: `2px solid ${isSel ? 'var(--torch)' : itToday ? 'var(--teal)' : 'var(--room-border)'}`,
                cursor: d ? 'pointer' : 'default',
                opacity: d ? 1 : 0.15,
                transition: 'border-color .12s',
                overflow: 'hidden',
              }}
            >
              {d && (
                <>
                  {/* Use VT323 (mono) for dates — NOT pixel font — so 2-digit numbers fit */}
                  <div style={{
                    fontSize: isMobile ? 15 : 14,
                    fontFamily: 'var(--mono)',
                    color: itToday ? 'var(--teal)' : isSel ? 'var(--torch)' : 'var(--text)',
                    lineHeight: 1, marginBottom: 2,
                    fontWeight: itToday ? 'bold' : 'normal',
                  }}>
                    {d}
                  </div>
                  {dayEvts.slice(0, isMobile ? 1 : 2).map(e => (
                    <div key={e.id} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: e.color, display: 'inline-block', marginRight: 2,
                    }} />
                  ))}
                  {dayEvts.length > (isMobile ? 1 : 2) && (
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1 }}>
                      +{dayEvts.length - (isMobile ? 1 : 2)}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const SidePanel = (
    <div>
      {selected ? (
        <div>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, color: 'var(--torch)', marginBottom: 12 }}>
            {MONTHS[month].slice(0, 3).toUpperCase()} {selected}, {year}
          </div>

          {eventsOn(selected).length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 15, marginBottom: 10 }}>No events this day</div>
          ) : (
            eventsOn(selected).map(e => (
              <div key={e.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${e.color}`, padding: '8px 10px' }}>
                <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{e.title}</div>
                <button className="btn sm danger" style={{ fontSize: 12 }} onClick={() => delEvent(e.id)}>Delete</button>
              </div>
            ))
          )}

          {adding ? (
            <div className="card" style={{ marginTop: 8 }}>
              <div className="section-label">New Event</div>
              <input className="input" style={{ marginBottom: 8, fontSize: 15 }}
                placeholder="Event title..." value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addEvent()} autoFocus />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {['var(--teal)', 'var(--yellow)', 'var(--red)', 'var(--torch)'].map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 24, height: 24, background: c, border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm primary" onClick={addEvent}>Add</button>
                <button className="btn sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" style={{ width: '100%', marginTop: 8, fontSize: 15 }} onClick={() => setAdding(true)}>
              + Add Event
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="section-label">Upcoming</div>
          {upcoming.map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 7, borderLeft: `3px solid ${e.color}`, padding: '7px 10px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 2 }}>{e.date}</div>
              <div style={{ fontSize: 15, color: 'var(--text)' }}>{e.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div>
        {CalendarGrid}
        <div style={{ marginTop: 16, borderTop: '2px solid var(--room-border)', paddingTop: 16 }}>
          {SidePanel}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, height: 'calc(100vh - 160px)' }}>
      <div style={{ overflowY: 'auto' }}>{CalendarGrid}</div>
      <div style={{ overflowY: 'auto' }}>{SidePanel}</div>
    </div>
  )
}
