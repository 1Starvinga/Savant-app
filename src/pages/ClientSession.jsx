import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

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

// ─── Note Card (with inline editing) ──────────────────────────

function NoteCard({ note, onUpdated }) {
  const [editing,  setEditing]  = useState(false)
  const [editText, setEditText] = useState(note.intake_note ?? '')
  const [saving,   setSaving]   = useState(false)

  async function saveEdit() {
    if (!editText.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('session_notes')
      .update({ intake_note: editText.trim() })
      .eq('id', note.id)
      .select()
      .single()
    console.log('[NoteCard] update →', { data, error })
    setSaving(false)
    if (!error && data) {
      onUpdated(data)
      setEditing(false)
    }
  }

  function cancelEdit() {
    setEditText(note.intake_note ?? '')
    setEditing(false)
  }

  return (
    <div className="card py-3 px-4">
      {/* Date row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          {formatDate(note.created_at)}
        </p>
        {!editing && (
          <button
            onClick={() => { setEditText(note.intake_note ?? ''); setEditing(true) }}
            className="text-[10px] font-medium px-2 py-0.5 rounded-lg active:scale-95 transition-transform"
            style={{ color: '#F0EFED', border: '1px solid rgba(91,138,138,0.3)' }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Note content or edit form */}
      {editing ? (
        <>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            autoFocus
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-gray-400 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving || !editText.trim()}
              className="flex-1 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40"
              style={{ background: 'rgba(91,138,138,0.15)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <>
          {note.intake_note && (
            <p className="text-sm text-gray-300 leading-relaxed">{note.intake_note}</p>
          )}
          {note.end_note && (
            <div className={note.intake_note ? 'mt-3 pt-3 border-t border-border' : ''}>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Assessment Findings</p>
              <p className="text-sm text-gray-400 leading-relaxed">{note.end_note}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Section Label ─────────────────────────────────────────────

function SectionLabel({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#F0EFED' }}>
        {title}
      </p>
      {action ?? null}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border my-6" />
}

// ─── Background Section ────────────────────────────────────────

const BG_FIELDS = [
  { key: 'occupation', label: 'Occupation',  placeholder: 'e.g. Nurse, Office worker, Athlete…' },
  { key: 'injuries',   label: 'Injuries',    placeholder: 'e.g. Rotator cuff tear (2023), ACL repair…' },
  { key: 'conditions', label: 'Conditions',  placeholder: 'e.g. Hypermobility, Scoliosis, Chronic pain…' },
  { key: 'goals',      label: 'Goals',       placeholder: 'e.g. Improve hip mobility, reduce back pain…' },
  { key: 'notes',      label: 'Notes',       placeholder: 'Additional context…', multiline: true },
]

function BackgroundSection({ client, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    occupation: client.occupation ?? '',
    injuries:   client.injuries   ?? '',
    conditions: client.conditions ?? '',
    goals:      client.goals      ?? '',
    notes:      client.notes      ?? '',
  })

  useEffect(() => {
    setForm({
      occupation: client.occupation ?? '',
      injuries:   client.injuries   ?? '',
      conditions: client.conditions ?? '',
      goals:      client.goals      ?? '',
      notes:      client.notes      ?? '',
    })
  }, [client])

  function cancelEdit() {
    setForm({
      occupation: client.occupation ?? '',
      injuries:   client.injuries   ?? '',
      conditions: client.conditions ?? '',
      goals:      client.goals      ?? '',
      notes:      client.notes      ?? '',
    })
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const { data, error } = await supabase
      .from('clients')
      .update({
        occupation: form.occupation.trim() || null,
        injuries:   form.injuries.trim()   || null,
        conditions: form.conditions.trim() || null,
        goals:      form.goals.trim()      || null,
        notes:      form.notes.trim()      || null,
      })
      .eq('id', client.id)
      .select()
      .single()
    console.log('[BackgroundSection] update →', { data, error })
    setSaving(false)
    setEditing(false)
    if (data) onSaved(data)
  }

  const hasAny = BG_FIELDS.some(f => !!client[f.key])

  if (editing) {
    return (
      <div className="space-y-3">
        {BG_FIELDS.map(({ key, label, placeholder, multiline }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
            {multiline ? (
              <textarea
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none"
              />
            ) : (
              <input
                type="text"
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button
            onClick={cancelEdit}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-400 active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 btn-gold disabled:opacity-50 disabled:scale-100"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      {hasAny ? (
        BG_FIELDS.map(({ key, label }) =>
          client[key] ? (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">{label}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{client[key]}</p>
            </div>
          ) : null
        )
      ) : (
        <p className="text-sm text-gray-600 text-center py-2">
          No background on file. Tap Edit to add.
        </p>
      )}
      <button
        onClick={() => setEditing(true)}
        className="w-full py-2 rounded-xl border border-border text-xs font-medium text-gray-400 active:scale-95 transition-transform"
      >
        Edit Background
      </button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────

export default function ClientSession() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuth()

  const [client,       setClient]       = useState(null)
  const [sessionNotes, setSessionNotes] = useState([])
  const [assessments,  setAssessments]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [loadError,    setLoadError]    = useState('')

  // Today's note
  const [todayNote,  setTodayNote]  = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [noteSaved,  setNoteSaved]  = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase
        .from('session_notes')
        .select('id, intake_note, end_note, created_at')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('assessments')
        .select('id, status, summary, created_at')
        .eq('client_id', id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([{ data: c, error: cErr }, { data: n, error: nErr }, { data: a }]) => {
      console.log('[ClientSession] load →', {
        client: c,
        clientError: cErr,
        notes: n,
        notesError: nErr,
        assessments: a,
      })
      if (c) setClient(c)
      else if (cErr) setLoadError(cErr.message)
      setSessionNotes(n ?? [])
      setAssessments(a ?? [])
      setLoading(false)
    })
  }, [id])

  async function saveNote() {
    if (!todayNote.trim() || !profile?.id) return
    setSavingNote(true)
    setSaveError('')

    const practitionerId = profile.user_id ?? profile.id

    const { data: { user } } = await supabase.auth.getUser()
    console.log('[ClientSession] auth.getUser =', user?.id)
    console.log('[ClientSession] practitioner_id being sent =', practitionerId)

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const payload = {
      client_id:       id,
      practitioner_id: practitionerId,
      session_date:    today,
      session_id:      null,
      intake_note:     todayNote.trim(),
      end_note:        null,
    }
    console.log('[ClientSession] upsert payload →', JSON.stringify(payload, null, 2))

    const { data: inserted, error: insertErr } = await supabase
      .from('session_notes')
      .upsert(payload, {
        onConflict:        'client_id,practitioner_id,session_date',
        ignoreDuplicates:  false,
      })
      .select()
      .single()

    console.log('[ClientSession] insert result →', { inserted, insertErr })

    if (insertErr) {
      setSaveError(insertErr.message)
      setSavingNote(false)
      return
    }

    // Optimistically prepend, then confirm with a refetch
    if (inserted) {
      setSessionNotes(prev => [inserted, ...prev])
    }
    setTodayNote('')
    setSavingNote(false)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 3000)

    // Background refetch to ensure consistency
    supabase
      .from('session_notes')
      .select('id, intake_note, end_note, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSessionNotes(data) })
  }

  function handleNoteUpdated(updatedNote) {
    setSessionNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (loadError || !client) {
    return (
      <div className="page-container flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-400 mb-4">{loadError || 'Client not found.'}</p>
        <button onClick={() => navigate('/clients')} className="text-sm" style={{ color: '#F0EFED' }}>← Back</button>
      </div>
    )
  }

  const flags = [
    ...(client.injuries   ? [client.injuries]   : []),
    ...(client.conditions ? [client.conditions] : []),
  ]

  const mostRecentAssessment = assessments[0] ?? null

  return (
    <div className="page-container">
      <div className="px-4 pb-8">

        {/* ── Client Header ──────────────────────────────────── */}
        <div
          className="flex items-center gap-3 pt-4 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}
        >
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-none"
            style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}
          >
            <span className="text-base font-bold" style={{ color: '#F0EFED' }}>
              {initials(client.first_name, client.last_name)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white">
              {client.first_name} {client.last_name}
            </h1>
            {client.occupation && (
              <p className="text-xs text-gray-500 mt-0.5">{client.occupation}</p>
            )}
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {flags.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                  >
                    ⚠ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Session Notes ──────────────────────────────────── */}
        {/* Input and list live in one continuous section */}
        <SectionLabel
          title="Session Notes"
          action={
            sessionNotes.length > 0
              ? <span className="text-xs text-gray-600">{sessionNotes.length} on file</span>
              : null
          }
        />

        {/* New note input */}
        <textarea
          value={todayNote}
          onChange={e => { setTodayNote(e.target.value); setSaveError('') }}
          placeholder="What is the client reporting today?"
          rows={4}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none mb-2"
          style={{ borderColor: todayNote ? 'rgba(91,138,138,0.5)' : undefined }}
        />

        {saveError && (
          <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2 mb-2">{saveError}</p>
        )}

        <div className="flex items-center justify-between mb-5">
          <span
            className="text-xs text-emerald-400 flex items-center gap-1"
            style={{ opacity: noteSaved ? 1 : 0, transition: 'opacity 0.3s' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved
          </span>
          <button
            onClick={saveNote}
            disabled={!todayNote.trim() || savingNote}
            className="text-xs font-semibold px-4 py-2 active:scale-95 transition-transform disabled:opacity-30"
            style={{ background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '10px' }}
          >
            {savingNote ? 'Saving…' : 'Save Note'}
          </button>
        </div>

        {/* Saved notes list — directly below input */}
        {sessionNotes.length === 0 ? (
          <div
            className="rounded-xl px-4 py-6 text-center mb-2"
            style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm text-gray-600">No notes yet — save one above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionNotes.map(n => (
              <NoteCard key={n.id} note={n} onUpdated={handleNoteUpdated} />
            ))}
          </div>
        )}

        <Divider />

        {/* ── Assessment History ──────────────────────────────── */}
        <SectionLabel
          title="Assessment History"
          action={
            assessments.length > 0
              ? (
                <button
                  onClick={() => navigate(`/clients/${id}`)}
                  className="text-xs"
                  style={{ color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)' }}
                >
                  View all →
                </button>
              )
              : null
          }
        />
        {!mostRecentAssessment ? (
          <div
            className="rounded-xl px-4 py-6 text-center"
            style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm text-gray-600">No assessments on file</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((a, i) => (
              <div key={a.id} className="card py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-white">
                    {i === 0 ? 'Most Recent' : formatDate(a.created_at)}
                  </p>
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="text-[10px] text-gray-500">{formatDate(a.created_at)}</span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      Complete
                    </span>
                  </div>
                </div>
                {a.summary
                  ? <p className="text-sm text-gray-400 leading-relaxed">{a.summary}</p>
                  : <p className="text-xs text-gray-600">No summary recorded.</p>
                }
              </div>
            ))}
          </div>
        )}

        <Divider />

        {/* ── Client Background ──────────────────────────────── */}
        <SectionLabel title="Client Background" />
        <BackgroundSection
          client={client}
          onSaved={updated => setClient(updated)}
        />

        <Divider />

        {/* ── Start Assessment ──────────────────────────────── */}
        <button
          onClick={() => navigate('/diagnostic', { state: { preselectedClient: client } })}
          className="btn-gold w-full"
        >
          Start Assessment →
        </button>

      </div>
    </div>
  )
}
