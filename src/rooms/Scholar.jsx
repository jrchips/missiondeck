import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useIsMobile } from '../hooks/useIsMobile'

const COURSES = ['CMIS 141', 'HIST 157', 'BMGT 364', 'WRTG 112', 'Other']
const CITATION_STYLES = ['MLA', 'APA', 'Chicago', 'Turabian', 'None']

export default function Scholar() {
  const isMobile = useIsMobile()
  const [webhookUrl, setWebhookUrl] = useLocalStorage('md-scholar-webhook', '')
  const [history, setHistory] = useLocalStorage('md-scholar-history', [])
  const [configuring, setConfiguring] = useState(false)
  const [urlInput, setUrlInput] = useState(webhookUrl)
  const [form, setForm] = useState({
    assignment: '',
    course: 'CMIS 141',
    dueDate: '',
    wordCount: '500',
    citationStyle: 'MLA',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastDoc, setLastDoc] = useState(null)

  const saveWebhook = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    setWebhookUrl(trimmed)
    setConfiguring(false)
  }

  const submit = async () => {
    if (!form.assignment.trim()) return
    if (!webhookUrl) { setConfiguring(true); return }
    setLoading(true)
    setError('')
    setLastDoc(null)
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const text = await res.text()
      let docUrl = null
      try {
        const data = JSON.parse(text)
        docUrl = data.docUrl ?? data.url ?? data.link ?? data.google_doc_url ?? null
      } catch {
        if (text.startsWith('http')) docUrl = text.trim()
      }
      if (!docUrl) throw new Error('Webhook responded but returned no Google Doc URL. Check your Make.com scenario returns { "docUrl": "https://..." }')
      const entry = {
        id: String(Date.now()),
        date: new Date().toISOString().slice(0, 10),
        course: form.course,
        brief: form.assignment.slice(0, 120),
        docUrl,
      }
      setHistory(prev => [entry, ...prev])
      setLastDoc(docUrl)
      setForm(f => ({ ...f, assignment: '' }))
    } catch (e) {
      const msg = e.message || 'Failed to reach webhook'
      setError(msg.includes('Failed to fetch')
        ? 'Could not reach webhook. Verify the URL and that your Make.com scenario has CORS headers enabled (Access-Control-Allow-Origin: *).'
        : msg)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* ── Webhook config card ── */}
      <div className="card" style={{ marginBottom: 16, borderColor: 'var(--soul)', borderWidth: 1 }}>
        <div className="section-label" style={{ color: 'var(--soul)' }}>Make.com Webhook</div>

        {(!webhookUrl || configuring) ? (
          <div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.6 }}>
              Paste your Make.com HTTP webhook URL below. Your scenario should accept a POST with JSON fields
              (<code style={{ background: 'rgba(0,0,0,.4)', padding: '1px 5px', fontFamily: 'var(--mono)' }}>assignment, course, dueDate, wordCount, citationStyle</code>)
              and respond with <code style={{ background: 'rgba(0,0,0,.4)', padding: '1px 5px', fontFamily: 'var(--mono)' }}>{'{ "docUrl": "https://..." }'}</code>.
            </div>
            <input className="input" style={{ marginBottom: 8, fontSize: 15 }}
              placeholder="https://hook.us1.make.com/xxxxxxxxxxxxxxxx"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveWebhook()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm primary" onClick={saveWebhook}>Save URL</button>
              {webhookUrl && <button className="btn sm" onClick={() => setConfiguring(false)}>Cancel</button>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1, fontSize: 14, color: 'var(--text-dim)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {webhookUrl}
            </div>
            <button className="btn sm" onClick={() => { setUrlInput(webhookUrl); setConfiguring(true) }}>
              Change
            </button>
          </div>
        )}
      </div>

      {/* ── Assignment form ── */}
      {webhookUrl && !configuring && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-label">New Assignment Draft</div>

          <textarea className="textarea"
            style={{ fontSize: 15, marginBottom: 10, minHeight: 130, lineHeight: 1.6 }}
            placeholder="Paste the full assignment prompt or instructions here…"
            value={form.assignment}
            onChange={e => setForm(f => ({ ...f, assignment: e.target.value }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select className="select" style={{ fontSize: 15 }} value={form.course}
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
              {COURSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="input" style={{ fontSize: 15 }} type="date" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <input className="input" style={{ fontSize: 15 }} type="number"
              placeholder="Word count" min="50" max="5000"
              value={form.wordCount}
              onChange={e => setForm(f => ({ ...f, wordCount: e.target.value }))} />
            <select className="select" style={{ fontSize: 15 }} value={form.citationStyle}
              onChange={e => setForm(f => ({ ...f, citationStyle: e.target.value }))}>
              {CITATION_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(230,57,70,.08)', border: '1px solid rgba(230,57,70,.3)',
              color: 'var(--red)', fontSize: 14, padding: '10px 14px', marginBottom: 12, lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          {lastDoc && (
            <div style={{
              background: 'rgba(143,168,255,.07)', border: '1px solid rgba(143,168,255,.3)',
              padding: '12px 14px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 5 }}>Draft ready —</div>
              <a href={lastDoc} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--soul)', fontSize: 16, wordBreak: 'break-all', textDecoration: 'none' }}>
                Open Google Doc →
              </a>
            </div>
          )}

          <button
            className="btn primary"
            style={{ fontSize: 16, opacity: (loading || !form.assignment.trim()) ? 0.55 : 1 }}
            onClick={submit}
            disabled={loading || !form.assignment.trim()}
          >
            {loading ? '⏳ Sending to Make.com…' : '📜 Generate Draft'}
          </button>
        </div>
      )}

      {/* ── Submission history ── */}
      {history.length > 0 && (
        <div>
          <div className="section-label">Past Drafts</div>
          {history.map(h => (
            <div key={h.id} className="card" style={{
              marginBottom: 8, padding: '10px 14px',
              borderLeft: '3px solid var(--soul)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{h.date} · {h.course}</span>
                <button
                  onClick={() => setHistory(prev => prev.filter(x => x.id !== h.id))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 7, lineHeight: 1.5 }}>
                {h.brief}{h.brief.length >= 120 ? '…' : ''}
              </div>
              <a href={h.docUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 14, color: 'var(--soul)', textDecoration: 'none' }}>
                Open Google Doc →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* No webhook + no history = first-time prompt */}
      {!webhookUrl && history.length === 0 && !configuring && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
          <div style={{ fontSize: 16, marginBottom: 16 }}>Configure your Make.com webhook to start generating assignment drafts.</div>
          <button className="btn primary" style={{ fontSize: 15 }} onClick={() => setConfiguring(true)}>
            Set Up Webhook
          </button>
        </div>
      )}
    </div>
  )
}
