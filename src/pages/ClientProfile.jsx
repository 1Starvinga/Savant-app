import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { stretchLibrary } from '../data/stretchLibrary'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

// ─── Constants ─────────────────────────────────────────────────

const ROM_LABEL = {
  normal:               'Normal',
  restricted:           'Restricted',
  severely_restricted:  'Severely Restricted',
}

const EMPTY_SIDE = { rom: null, painPresent: null, compensation: '', notes: '' }

// ─── Helpers ───────────────────────────────────────────────────

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Normalize JSONB findings — JSON keys come back as strings, app uses numeric
function normalizeFindings(raw) {
  const base = {}
  stretchLibrary.forEach(s => {
    base[s.id] = { left: { ...EMPTY_SIDE }, right: { ...EMPTY_SIDE } }
  })
  if (!raw || typeof raw !== 'object') return base
  Object.keys(raw).forEach(key => {
    const id = parseInt(key, 10)
    if (base[id] && raw[key]) {
      base[id] = {
        left:  { ...EMPTY_SIDE, ...raw[key].left },
        right: { ...EMPTY_SIDE, ...raw[key].right },
      }
    }
  })
  return base
}

function romBadgeClass(rom) {
  if (rom === 'normal')              return 'bg-emerald-500/15 text-emerald-400'
  if (rom === 'restricted')          return ''
  if (rom === 'severely_restricted') return 'bg-red-500/15 text-red-400'
  return 'bg-border text-gray-500'
}
function romBadgeStyle(rom) {
  if (rom === 'restricted') return { backgroundColor: 'rgba(91,138,138,0.15)', color: '#F0EFED' }
  return {}
}

// ─── Field (shared input component) ────────────────────────────

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors"
      />
    </div>
  )
}

// ─── Edit Client Modal ──────────────────────────────────────────

function EditClientModal({ client, onClose, onSaved }) {
  const [form, setForm]     = useState({
    first_name: client.first_name ?? '',
    last_name:  client.last_name  ?? '',
    email:      client.email      ?? '',
    phone:      client.phone      ?? '',
    notes:      client.notes      ?? '',
    status:     client.status     ?? 'active',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.')
      return
    }
    setSaving(true)
    const { data, error: dbErr } = await supabase
      .from('clients')
      .update({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim() || null,
        phone:      form.phone.trim() || null,
        notes:      form.notes.trim() || null,
        status:     form.status,
      })
      .eq('id', client.id)
      .select()
      .single()

    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    onSaved(data)
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={handleBackdrop}
    >
      <div className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">Edit Client</h2>
          <button onClick={onClose} className="text-gray-400 active:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Jane" />
            <Field label="Last Name *"  name="last_name"  value={form.last_name}  onChange={handleChange} placeholder="Smith" />
          </div>
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" />
          <Field label="Phone" name="phone" type="tel"   value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Background</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Occupation, injuries, conditions, goals…"
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Status toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <div className="flex gap-2">
              {['active', 'inactive'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                    form.status === s
                      ? s === 'active'
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : 'bg-gray-600 text-white border-gray-600'
                      : 'border-border text-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assessment Summary View (full-screen overlay) ──────────────

function AssessmentSummaryView({ assessment, client, onBack }) {
  const findings  = normalizeFindings(assessment.findings_data ?? assessment.findings)
  const date      = formatDate(assessment.created_at)
  const isComplete = assessment.status === 'complete'

  // Aggregate
  const restrictions = []
  let totalAssessed = 0
  let painCount = 0

  stretchLibrary.forEach(stretch => {
    const f = findings[stretch.id]
    ;['left', 'right'].forEach(side => {
      const entry = f[side]
      if (entry.rom !== null) {
        totalAssessed++
        if (entry.rom === 'restricted' || entry.rom === 'severely_restricted') {
          restrictions.push({ stretch, side, entry })
        }
        if (entry.painPresent === true) painCount++
      }
    })
  })

  const assessedStretches = stretchLibrary.filter(s => {
    const f = findings[s.id]
    return f.left.rom !== null || f.right.rom !== null
  })

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 pt-safe-top pt-4 pb-4 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">
            {client.first_name} {client.last_name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500">{date}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isComplete
                ? 'bg-emerald-500/15 text-emerald-400'
                : ''
            }`}
            style={!isComplete ? { backgroundColor: 'rgba(91,138,138,0.15)', color: '#F0EFED' } : {}}
            >
              {isComplete ? 'Complete' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          {/* Stats card */}
          <div className="card">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{totalAssessed}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Sides Assessed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-400">{restrictions.length}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Restrictions</p>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{painCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Pain Sites</p>
              </div>
            </div>
            {assessment.summary && (
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-border leading-relaxed">
                {assessment.summary}
              </p>
            )}
          </div>

          {/* In-progress notice */}
          {!isComplete && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(91,138,138,0.1)', border: '1px solid rgba(91,138,138,0.3)' }}>
              <p className="text-xs" style={{ color: '#F0EFED' }}>
                Assessment paused at step {(assessment.current_stretch_index ?? 0) + 1} of 47.
                Findings shown below are recorded so far.
              </p>
            </div>
          )}

          {/* Restrictions */}
          {restrictions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-2">
                Restrictions Found
              </p>
              <div className="space-y-2">
                {restrictions.map(({ stretch, side, entry }) => (
                  <div key={`${stretch.id}-${side}`} className="card flex items-start gap-3 py-3">
                    <span className="text-sm font-bold w-7 flex-none" style={{ color: '#F0EFED' }}>
                      {String(stretch.id).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">{stretch.name}</p>
                        <span className="text-[10px] text-gray-500 capitalize">{side}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${romBadgeClass(entry.rom)}`} style={romBadgeStyle(entry.rom)}>
                          {ROM_LABEL[entry.rom]}
                        </span>
                        {entry.painPresent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                            Pain
                          </span>
                        )}
                      </div>
                      {entry.compensation && (
                        <p className="text-xs text-gray-500 mt-1">{entry.compensation}</p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-0.5 italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All findings */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#F0EFED' }}>
              All Findings ({assessedStretches.length} of 24 stretches)
            </p>
            {assessedStretches.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No findings recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {assessedStretches.map(stretch => {
                  const f = findings[stretch.id]
                  return (
                    <div key={stretch.id} className="card py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold w-6" style={{ color: '#F0EFED' }}>
                          {String(stretch.id).padStart(2, '0')}
                        </span>
                        <p className="text-sm font-medium text-white flex-1">{stretch.name}</p>
                        <span className="text-[10px] text-gray-600">{stretch.region}</span>
                      </div>
                      <div className="flex gap-4 ml-8">
                        {(['left', 'right']).map(side => {
                          const entry = f[side]
                          if (entry.rom === null) return null
                          return (
                            <div key={side} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-500 capitalize">{side}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${romBadgeClass(entry.rom)}`} style={romBadgeStyle(entry.rom)}>
                                {ROM_LABEL[entry.rom]}
                              </span>
                              {entry.painPresent && (
                                <span className="text-[10px] text-red-400">· Pain</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {(f.left.compensation || f.right.compensation) && (
                        <p className="text-xs text-gray-500 mt-1.5 ml-8">
                          {f.left.compensation || f.right.compensation}
                        </p>
                      )}
                      {(f.left.notes || f.right.notes) && (
                        <p className="text-xs text-gray-600 mt-0.5 ml-8 italic leading-relaxed">
                          {f.left.notes || f.right.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}

// ─── Latest Assessment Section ──────────────────────────────────

function LatestAssessmentSection({ assessment, onView, onStart }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-white mb-3">Latest Assessment</h2>

      {!assessment ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-400 mb-4">No assessment on file</p>
          <button onClick={onStart} className="btn-gold">
            Start First Assessment
          </button>
        </div>
      ) : (
        <AssessmentSummaryCard assessment={assessment} onView={() => onView(assessment)} />
      )}
    </section>
  )
}

function AssessmentSummaryCard({ assessment, onView }) {
  const findings = normalizeFindings(assessment.findings_data ?? assessment.findings)

  const restrictions = []
  let totalAssessed = 0
  let painCount = 0

  stretchLibrary.forEach(stretch => {
    const f = findings[stretch.id]
    ;['left', 'right'].forEach(side => {
      const entry = f[side]
      if (entry.rom !== null) {
        totalAssessed++
        if (entry.rom === 'restricted' || entry.rom === 'severely_restricted') {
          restrictions.push({ stretch, side, entry })
        }
        if (entry.painPresent === true) painCount++
      }
    })
  })

  const topRestrictions = restrictions
    .sort((a, b) => (a.entry.rom === 'severely_restricted' ? -1 : 1))
    .slice(0, 3)

  return (
    <div className="card">
      {/* Date */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
        {formatDate(assessment.created_at)}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{totalAssessed}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Sides Assessed</p>
        </div>
        <div>
          <p className="text-xl font-bold text-red-400">{restrictions.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Restrictions</p>
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{painCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Pain Sites</p>
        </div>
      </div>

      {/* Top restrictions preview */}
      {topRestrictions.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Key Findings
          </p>
          {topRestrictions.map(({ stretch, side, entry }) => (
            <div key={`${stretch.id}-${side}`} className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-gray-300">{stretch.name}</p>
              <span className="text-[10px] text-gray-500 capitalize">{side}</span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${romBadgeClass(entry.rom)}`}
                style={romBadgeStyle(entry.rom)}
              >
                {ROM_LABEL[entry.rom]}
              </span>
              {entry.painPresent && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                  Pain
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assessment summary text */}
      {assessment.summary && (
        <p className="text-xs text-gray-400 leading-relaxed mt-4 pt-4 border-t border-border">
          {assessment.summary}
        </p>
      )}

      {/* View button */}
      <button onClick={onView} className="btn-gold w-full mt-4">
        View Full Assessment
      </button>
    </div>
  )
}

// ─── Session Notes Section ──────────────────────────────────────

function SessionNotesSection({ notes }) {
  const [latest, ...previous] = notes

  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3">Session Notes</h2>

      {notes.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-gray-400">No session notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <SessionNoteCard note={latest} featured />
          {previous.length > 0 && (
            <div
              className="space-y-2 overflow-y-auto pr-1"
              style={{ maxHeight: '420px' }}
            >
              {previous.map(n => (
                <SessionNoteCard key={n.id} note={n} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function SessionNoteCard({ note, featured = false }) {
  return (
    <div className="card" style={featured ? { padding: '20px' } : { padding: '14px 16px' }}>
      <p className={`font-semibold uppercase tracking-widest text-gray-500 mb-2 ${featured ? 'text-[11px]' : 'text-[10px]'}`}>
        {formatDate(note.session_date ?? note.created_at)}
        {featured && <span className="ml-2 text-emerald-400 normal-case tracking-normal">• Most recent</span>}
      </p>
      {note.intake_note && (
        <p className={`text-gray-300 leading-relaxed ${featured ? 'text-sm' : 'text-xs'}`}>
          {note.intake_note}
        </p>
      )}
      {note.end_note && (
        <div className={note.intake_note ? 'mt-3 pt-3 border-t border-border' : ''}>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Assessment Findings</p>
          <p className={`text-gray-400 leading-relaxed ${featured ? 'text-sm' : 'text-xs'}`}>
            {note.end_note}
          </p>
        </div>
      )}
      {!note.intake_note && !note.end_note && (
        <p className="text-xs text-gray-600 italic">Empty note</p>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ClientProfile() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { profile }  = useAuth()

  const [client, setClient]                   = useState(null)
  const [assessments, setAssessments]         = useState([])
  const [sessionNotes, setSessionNotes]       = useState([])
  const [loading, setLoading]                 = useState(true)
  const [showEdit, setShowEdit]               = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase
        .from('assessments')
        .select('id, status, summary, created_at, current_stretch_index, findings_data, findings')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('session_notes')
        .select('id, intake_note, end_note, session_date, created_at')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: c, error: cErr }, { data: a, error: aErr }, { data: n, error: nErr }]) => {
      if (!cErr && c) setClient(c)
      if (!aErr)      setAssessments(a ?? [])
      if (!nErr)      setSessionNotes(n ?? [])
      setLoading(false)
    })
  }, [id])

  function handleClientSaved(updated) {
    setClient(updated)
    setShowEdit(false)
  }

  const latestCompleteAssessment = assessments.find(a => a.status === 'complete') ?? null

  function startNewAssessment() {
    navigate('/diagnostic', {
      state: { preselectedClient: client },
    })
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="page-container flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-400 mb-4">Client not found.</p>
        <button onClick={() => navigate('/clients')} className="text-sm" style={{ color: '#F0EFED' }}>← Back to Clients</button>
      </div>
    )
  }

  if (selectedAssessment) {
    return (
      <AssessmentSummaryView
        assessment={selectedAssessment}
        client={client}
        onBack={() => setSelectedAssessment(null)}
      />
    )
  }

  const isActive = client.status === 'active'

  return (
    <div className="page-container">
      <div className="px-4 pt-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            <img src={savantSymbol} alt="Savant" style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }} />
          </button>
          <h1 className="text-lg font-bold text-white flex-1 truncate">
            {client.first_name} {client.last_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 active:scale-95 transition-transform" style={{ color: '#F0EFED', border: '1px solid rgba(91,138,138,0.3)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <HamburgerMenu />
          </div>
        </div>

        {/* Client info card */}
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
              <span className="text-lg font-bold" style={{ color: '#F0EFED' }}>
                {initials(client.first_name, client.last_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-white">
                  {client.first_name} {client.last_name}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-gray-700/50 text-gray-500'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Client since {formatDate(client.created_at)}
              </p>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-2 pt-4 border-t border-border">
            {client.email && (
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" className="flex-none">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
                <p className="text-sm text-gray-300">{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" className="flex-none">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <p className="text-sm text-gray-300">{client.phone}</p>
              </div>
            )}
            {!client.email && !client.phone && (
              <p className="text-xs text-gray-600">No contact info on file</p>
            )}
          </div>

          {/* Client Background */}
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#F0EFED' }}>Client Background</p>
              <p className="text-sm text-gray-400 leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>

        {/* ─── Latest Assessment ─────────────────────────────────── */}
        <LatestAssessmentSection
          assessment={latestCompleteAssessment}
          onView={setSelectedAssessment}
          onStart={startNewAssessment}
        />

        {/* ─── Session Notes ─────────────────────────────────────── */}
        <SessionNotesSection notes={sessionNotes} />

      </div>

      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={handleClientSaved}
        />
      )}
    </div>
  )
}
