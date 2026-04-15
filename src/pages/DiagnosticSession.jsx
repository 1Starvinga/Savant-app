import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { stretchLibrary } from '../data/stretchLibrary'

// ─── Constants ────────────────────────────────────────────────

const ROM_OPTIONS = [
  {
    value: 'normal',
    label: 'Normal',
    idle:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active: 'bg-emerald-500 text-black border-emerald-500',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    idle:   'bg-gold/10 text-gold border-gold/20',
    active: 'bg-gold text-black border-gold',
  },
  {
    value: 'severely_restricted',
    label: 'Severely\nRestricted',
    idle:   'bg-red-500/10 text-red-400 border-red-500/20',
    active: 'bg-red-500 text-white border-red-500',
  },
]

const ROM_LABEL = {
  normal: 'Normal',
  restricted: 'Restricted',
  severely_restricted: 'Severely Restricted',
}

const ROM_COLOR = {
  normal:               'text-emerald-400',
  restricted:           'text-gold',
  severely_restricted:  'text-red-400',
}

const EMPTY_SIDE = { rom: null, painPresent: null, compensation: '', notes: '' }

function initFindings() {
  const f = {}
  stretchLibrary.forEach(s => {
    f[s.id] = { left: { ...EMPTY_SIDE }, right: { ...EMPTY_SIDE } }
  })
  return f
}

function initSides() {
  const s = {}
  stretchLibrary.forEach(stretch => { s[stretch.id] = 'left' })
  return s
}

// Normalize JSONB findings (string keys from JSON → numeric keys used by app)
function normalizeFindings(raw) {
  const base = initFindings()
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

// ─── Setup Screen ─────────────────────────────────────────────

function SetupScreen({ onBegin, preselectedClient }) {
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(preselectedClient ?? null)
  const { profile }                 = useAuth()
  const navigate                    = useNavigate()

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('clients')
      .select('id, first_name, last_name, status')
      .eq('practitioner_id', profile.id)
      .eq('status', 'active')
      .order('first_name')
      .then(({ data }) => { setClients(data ?? []); setLoading(false) })
  }, [profile?.id])

  return (
    <div className="page-container bg-background">
      <div className="px-4 pt-10 pb-28">
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 text-sm mb-8 self-start">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Home
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest text-gold uppercase mb-1">Savant Method</p>
        <h1 className="text-3xl font-bold text-white">Diagnostic Assessment</h1>
        <p className="text-sm text-gray-400 mt-2">24-stretch full-body evaluation</p>
      </div>

      {/* Info card */}
      <div className="card mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[['24', 'Stretches'], ['~45', 'Minutes'], ['Full', 'Body']].map(([val, label]) => (
            <div key={label}>
              <p className="text-xl font-bold text-gold">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Client selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-3">Select Client</label>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-sm text-gray-400">No active clients yet.</p>
            <button onClick={() => navigate('/clients')} className="text-gold text-sm mt-2">Add a client →</button>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                  selected?.id === c.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border bg-surface'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center flex-none">
                  <span className="text-gold text-xs font-bold">
                    {c.first_name[0]}{c.last_name[0]}
                  </span>
                </div>
                <span className={`text-sm font-medium ${selected?.id === c.id ? 'text-gold' : 'text-white'}`}>
                  {c.first_name} {c.last_name}
                </span>
                {selected?.id === c.id && (
                  <svg className="ml-auto text-gold" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => selected && onBegin(selected)}
        disabled={!selected}
        className="btn-gold w-full disabled:opacity-30 disabled:scale-100 mt-6"
      >
        Begin Assessment
      </button>
      </div>
    </div>
  )
}

// ─── Assessment Screen ────────────────────────────────────────

function FindingForm({ finding, onChange }) {
  return (
    <div className="space-y-5">
      {/* ROM */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Range of Motion</p>
        <div className="flex gap-2">
          {ROM_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange('rom', finding.rom === opt.value ? null : opt.value)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-bold border transition-colors leading-tight ${
                finding.rom === opt.value ? opt.active : opt.idle
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pain */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Pain Present</p>
        <div className="flex gap-2">
          {[{ val: true, label: 'Yes', active: 'bg-red-500 text-white border-red-500', idle: 'bg-surface border-border text-gray-400' },
            { val: false, label: 'No',  active: 'bg-emerald-500 text-black border-emerald-500', idle: 'bg-surface border-border text-gray-400' }
          ].map(({ val, label, active, idle }) => (
            <button
              key={label}
              onClick={() => onChange('painPresent', finding.painPresent === val ? null : val)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                finding.painPresent === val ? active : idle
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compensation */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Compensation Noted</label>
        <input
          type="text"
          value={finding.compensation}
          onChange={e => onChange('compensation', e.target.value)}
          placeholder="e.g. Posterior pelvic tilt, knee flexion…"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Notes</label>
        <textarea
          value={finding.notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Additional observations…"
          rows={2}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors resize-none"
        />
      </div>
    </div>
  )
}

function AssessmentScreen({
  findings, setFindings,
  activeSides, setActiveSides,
  currentIdx, setCurrentIdx,
  onNext,
  onExit,
  saveStatus,
}) {
  const [showHowTo, setShowHowTo] = useState(false)
  const stretch    = stretchLibrary[currentIdx]
  const isLast     = currentIdx === stretchLibrary.length - 1
  const isFirst    = currentIdx === 0
  const side       = activeSides[stretch.id]
  const finding    = findings[stretch.id][side]
  const progress   = ((currentIdx + 1) / stretchLibrary.length) * 100

  // Reset howTo toggle when stretch changes
  useEffect(() => { setShowHowTo(false) }, [currentIdx])

  function updateFinding(field, value) {
    setFindings(prev => ({
      ...prev,
      [stretch.id]: {
        ...prev[stretch.id],
        [side]: { ...prev[stretch.id][side], [field]: value },
      },
    }))
  }

  function setSide(s) {
    setActiveSides(prev => ({ ...prev, [stretch.id]: s }))
  }

  function goPrev() {
    if (!isFirst) setCurrentIdx(i => i - 1)
  }

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="flex-none h-1 bg-border">
        <div
          className="h-full bg-gold transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Save status indicator */}
      <div className="flex-none h-5 bg-background flex items-center justify-center">
        {saveStatus === 'saving' && (
          <p className="text-[10px] text-gray-500">Saving…</p>
        )}
        {saveStatus === 'saved' && (
          <p className="text-[10px] text-emerald-500">Saved ✓</p>
        )}
      </div>

      {/* Stretch header */}
      <div className="flex-none bg-surface border-b border-border px-4 pt-3 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-gold leading-none">
                {String(stretch.id).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-gray-500">/ 24</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{stretch.name}</h2>
            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              {stretch.region}
            </span>
          </div>

          {/* Right column: X button + progress */}
          <div className="flex flex-col items-end gap-2 ml-4">
            <button
              onClick={onExit}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-border active:scale-90 transition-transform"
              title="Save and exit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="text-right">
              <p className="text-xs text-gray-500">{currentIdx + 1} of 24</p>
              <div className="mt-1 w-16 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          {/* Purpose */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-1.5">Purpose</p>
            <p className="text-sm text-gray-300 leading-relaxed">{stretch.purpose}</p>
          </div>

          {/* How to perform (collapsible) */}
          <div>
            <button
              onClick={() => setShowHowTo(v => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                How to Perform
              </p>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#C9A84C" strokeWidth="2"
                className={`transition-transform ${showHowTo ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showHowTo && (
              <ol className="mt-2 space-y-2">
                {stretch.howTo.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                    <span className="flex-none w-5 h-5 rounded-full bg-gold/15 text-gold text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Findings */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white mb-3">Findings</p>

            {/* L/R toggle */}
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-4">
              {(['left', 'right']).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    side === s ? 'bg-gold text-black' : 'text-gray-400'
                  }`}
                >
                  {s === 'left' ? 'Left Side' : 'Right Side'}
                </button>
              ))}
            </div>

            <FindingForm finding={finding} onChange={updateFinding} />
          </div>

          {/* Spacer for footer */}
          <div className="h-4" />
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex-none border-t border-border bg-surface px-4 py-3 flex gap-3"
           style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-gray-400 disabled:opacity-30 active:scale-95 transition-transform"
        >
          Previous
        </button>
        <button
          onClick={() => onNext(isLast)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
            isLast ? 'bg-gold text-black' : 'bg-gold/20 text-gold border border-gold/30'
          }`}
        >
          {isLast ? 'Complete ✓' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

// ─── Summary Screen ───────────────────────────────────────────

function romBadgeClass(rom) {
  if (rom === 'normal')              return 'bg-emerald-500/15 text-emerald-400'
  if (rom === 'restricted')          return 'bg-gold/15 text-gold'
  if (rom === 'severely_restricted') return 'bg-red-500/15 text-red-400'
  return 'bg-border text-gray-500'
}

function SummaryScreen({ findings, client, onSave, onBack, saving }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })

  // Aggregate findings
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

  const severeCount     = restrictions.filter(r => r.entry.rom === 'severely_restricted').length
  const restrictedCount = restrictions.filter(r => r.entry.rom === 'restricted').length

  // Stretches with any finding recorded
  const assessedStretches = stretchLibrary.filter(s => {
    const f = findings[s.id]
    return f.left.rom !== null || f.right.rom !== null
  })

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-4 border-b border-border bg-surface">
        <button onClick={onBack} className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Assessment Complete</h1>
          <p className="text-xs text-gray-500">{today}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          {/* Client + stats */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-none">
                <span className="text-gold font-bold">
                  {client.first_name[0]}{client.last_name[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{client.first_name} {client.last_name}</p>
                <p className="text-xs text-gray-500">Diagnostic Assessment</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xl font-bold text-gold">{totalAssessed}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Sides Assessed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-400">{severeCount + restrictedCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Restrictions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-400">{painCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Pain Sites</p>
              </div>
            </div>
          </div>

          {/* Highlighted restrictions */}
          {restrictions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-2">
                Restrictions Found
              </p>
              <div className="space-y-2">
                {restrictions.map(({ stretch, side, entry }) => (
                  <div key={`${stretch.id}-${side}`} className="card flex items-start gap-3 py-3">
                    <span className="text-sm font-bold text-gold w-7 flex-none">
                      {String(stretch.id).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">{stretch.name}</p>
                        <span className="text-[10px] text-gray-500 capitalize">{side}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${romBadgeClass(entry.rom)}`}>
                          {ROM_LABEL[entry.rom]}
                        </span>
                        {entry.painPresent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                            Pain
                          </span>
                        )}
                      </div>
                      {entry.compensation && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{entry.compensation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full findings list */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-2">
              All Findings ({assessedStretches.length} stretches)
            </p>
            <div className="space-y-2">
              {assessedStretches.map(stretch => {
                const f = findings[stretch.id]
                return (
                  <div key={stretch.id} className="card py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gold w-6">{String(stretch.id).padStart(2, '0')}</span>
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
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${romBadgeClass(entry.rom)}`}>
                              {ROM_LABEL[entry.rom]}
                            </span>
                            {entry.painPresent && (
                              <span className="text-[10px] text-red-400">· Pain</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {(f.left.notes || f.right.notes) && (
                      <p className="text-xs text-gray-500 mt-1.5 ml-8 leading-relaxed">
                        {f.left.notes || f.right.notes}
                      </p>
                    )}
                  </div>
                )
              })}
              {assessedStretches.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No findings recorded.</p>
              )}
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-none border-t border-border bg-surface px-4 py-3 space-y-2"
           style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
        >
          {saving ? 'Saving…' : 'Done — Return to Home'}
        </button>
        <button className="btn-outline w-full">
          Share / Export
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function DiagnosticSession() {
  const { profile }     = useAuth()
  const navigate        = useNavigate()
  const location        = useLocation()

  const [screen, setScreen]           = useState('setup')
  const [client, setClient]           = useState(null)
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [findings, setFindings]       = useState(initFindings)
  const [activeSides, setActiveSides] = useState(initSides)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [saveStatus, setSaveStatus]   = useState('') // '' | 'saving' | 'saved'

  // Ref for assessmentId so async callbacks always see the latest value
  const assessmentIdRef = useRef(null)
  const [assessmentId, setAssessmentId] = useState(null)

  // Keep ref in sync with state
  useEffect(() => {
    assessmentIdRef.current = assessmentId
  }, [assessmentId])

  // Resume from in-progress assessment (passed via navigation state)
  useEffect(() => {
    const resume = location.state?.resume
    if (!resume) return
    const { assessmentId: resumeId, client: resumeClient, currentIdx: resumeIdx, findings: resumeFindings } = resume
    setClient(resumeClient)
    setCurrentIdx(resumeIdx ?? 0)
    setFindings(normalizeFindings(resumeFindings))
    setActiveSides(initSides())
    assessmentIdRef.current = resumeId
    setAssessmentId(resumeId)
    setScreen('assessment')
  }, []) // only on mount

  function handleBegin(selectedClient) {
    setClient(selectedClient)
    setFindings(initFindings())
    setActiveSides(initSides())
    setCurrentIdx(0)
    assessmentIdRef.current = null
    setAssessmentId(null)
    setScreen('assessment')
  }

  // Auto-save findings to Supabase. INSERT on first call, UPDATE thereafter.
  async function autoSave(currentFindings, idx, status = 'in_progress') {
    if (!profile?.id || !client?.id) return

    setSaveStatus('saving')

    if (!assessmentIdRef.current) {
      // First save — INSERT
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          client_id:             client.id,
          practitioner_id:       profile.id,
          session_id:            null,
          findings:              currentFindings,
          findings_data:         currentFindings,
          current_stretch_index: idx,
          status,
          summary:               '',
        })
        .select('id')
        .single()

      if (!error && data?.id) {
        assessmentIdRef.current = data.id
        setAssessmentId(data.id)
      }
    } else {
      // Subsequent saves — UPDATE
      await supabase
        .from('assessments')
        .update({
          findings_data:         currentFindings,
          current_stretch_index: idx,
          status,
        })
        .eq('id', assessmentIdRef.current)
    }

    setSaveStatus('saved')
    // Clear 'saved' indicator after 2 seconds
    setTimeout(() => setSaveStatus(''), 2000)
  }

  // Called by AssessmentScreen Next button
  async function handleNext(isLast) {
    if (isLast) {
      // Final stretch — save as complete then show summary
      await autoSave(findings, currentIdx, 'complete')
      setScreen('summary')
    } else {
      // Fire-and-forget save, advance immediately for responsiveness
      autoSave(findings, currentIdx, 'in_progress')
      setCurrentIdx(i => i + 1)
    }
  }

  // Called by AssessmentScreen X button
  async function handleExit() {
    await autoSave(findings, currentIdx, 'in_progress')
    navigate('/', {
      state: { savedMessage: 'Assessment saved. You can resume from where you left off.' },
    })
  }

  // Called by SummaryScreen Done button
  async function handleSave() {
    if (!profile?.id || !client?.id) return
    setSaving(true)

    // Build a text summary
    const restrictions = []
    stretchLibrary.forEach(s => {
      ;['left', 'right'].forEach(side => {
        const e = findings[s.id][side]
        if (e.rom && e.rom !== 'normal') {
          restrictions.push(`${s.name} (${side}): ${ROM_LABEL[e.rom]}`)
        }
      })
    })
    const summary = restrictions.length > 0
      ? `${restrictions.length} restriction(s) found: ${restrictions.slice(0, 5).join('; ')}${restrictions.length > 5 ? '…' : ''}`
      : 'No restrictions found.'

    if (assessmentIdRef.current) {
      // Already saved — just update the summary text
      await supabase
        .from('assessments')
        .update({ summary, findings: findings, findings_data: findings, status: 'complete' })
        .eq('id', assessmentIdRef.current)
    } else {
      // Fallback: insert fresh (shouldn't normally happen)
      await supabase.from('assessments').insert({
        client_id:       client.id,
        practitioner_id: profile.id,
        session_id:      null,
        findings:        findings,
        findings_data:   findings,
        summary,
        status:          'complete',
      })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/'), 1500)
  }

  if (saved) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Assessment Saved</h2>
          <p className="text-sm text-gray-400">Returning to home…</p>
        </div>
      </div>
    )
  }

  if (screen === 'setup') {
    return <SetupScreen onBegin={handleBegin} preselectedClient={location.state?.preselectedClient ?? null} />
  }

  if (screen === 'assessment') {
    return (
      <AssessmentScreen
        findings={findings}
        setFindings={setFindings}
        activeSides={activeSides}
        setActiveSides={setActiveSides}
        currentIdx={currentIdx}
        setCurrentIdx={setCurrentIdx}
        onNext={handleNext}
        onExit={handleExit}
        saveStatus={saveStatus}
      />
    )
  }

  return (
    <SummaryScreen
      findings={findings}
      client={client}
      saving={saving}
      onSave={handleSave}
      onBack={() => setScreen('assessment')}
    />
  )
}
