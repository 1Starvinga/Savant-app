import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Phase & Sequence Definitions ────────────────────────────
// Numbers in each phase's stretches array correspond to stretch_number in Supabase

const PHASES = [
  { id: 1, label: 'Supine — Right Leg', position: 'Supine', side: 'right', stretches: [1,2,3,4,6] },
  { id: 2, label: 'Supine — Left Leg',  position: 'Supine', side: 'left',  stretches: [1,2,3,4,6,5] },
  { id: 3, label: 'Prone — Right Leg',  position: 'Prone',  side: 'right', stretches: [9,10,11,12] },
  { id: 4, label: 'Prone — Left Leg',   position: 'Prone',  side: 'left',  stretches: [9,10,11,12] },
  { id: 5, label: 'Prone — Right Arm',  position: 'Prone',  side: 'right', stretches: [13,14,15] },
  { id: 6, label: 'Prone — Left Arm',   position: 'Prone',  side: 'left',  stretches: [13,14,15] },
  { id: 7, label: 'Supine — Right Arm', position: 'Supine', side: 'right', stretches: [18,16,17,19,20,21] },
  { id: 8, label: 'Supine — Left Arm',  position: 'Supine', side: 'left',  stretches: [18,16,17,19,20,21] },
  { id: 9, label: 'Finish',             position: 'Supine', side: null,    stretches: [22,23,24,7,8] },
]

const TRANSITION_AFTER = {
  2: { instruction: 'Have client flip to prone position',      nextLabel: 'Prone — Right Leg' },
  4: { instruction: 'Move to upper body — client stays prone', nextLabel: 'Prone — Right Arm' },
  6: { instruction: 'Have client flip to supine',              nextLabel: 'Supine — Right Arm' },
  8: { instruction: 'Final stretches — client stays supine',   nextLabel: 'Finish' },
}

const SEQUENCE = (() => {
  const steps = []
  PHASES.forEach(phase => {
    phase.stretches.forEach(stretchNum => {
      steps.push({ type: 'stretch', phase, stretchNum })
    })
    const tr = TRANSITION_AFTER[phase.id]
    if (tr) steps.push({ type: 'transition', phase, ...tr })
  })
  return steps
})()
// SEQUENCE.length === 47  (43 stretch steps + 4 transition steps)
const TOTAL_STEPS     = SEQUENCE.length
const TOTAL_STRETCHES = SEQUENCE.filter(s => s.type === 'stretch').length // 43

// Cumulative stretch count at each step index (for "N / 43" display)
const STRETCH_NUM_AT = SEQUENCE.map((_, idx) =>
  SEQUENCE.slice(0, idx + 1).filter(s => s.type === 'stretch').length
)

// ─── Helpers ──────────────────────────────────────────────────

// Handles both PostgreSQL array (JS array) and comma-separated string
function toList(val) {
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

// ─── ROM / side constants ─────────────────────────────────────

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
    idle:   '',
    active: 'text-black',
    idleStyle:   { backgroundColor: 'rgba(91,138,138,0.1)', color: '#F0EFED', borderColor: 'rgba(91,138,138,0.2)' },
    activeStyle: { backgroundColor: '#62F5EC', borderColor: '#62F5EC', color: '#0A0A0A' },
  },
  {
    value: 'severely_restricted',
    label: 'Severely\nRestricted',
    idle:   'bg-red-500/10 text-red-400 border-red-500/20',
    active: 'bg-red-500 text-white border-red-500',
  },
]

const ROM_LABEL = {
  normal:               'Normal',
  restricted:           'Restricted',
  severely_restricted:  'Severely Restricted',
}

const SIDE_STYLE = {
  right: { pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',       label: 'Right Side' },
  left:  { pill: 'bg-violet-500/10 text-violet-400 border border-violet-500/20', label: 'Left Side'  },
}

const EMPTY_SIDE = { rom: null, painPresent: null, compensation: '', notes: '' }

// ─── Findings helpers (keyed by stretch_number) ───────────────

function initFindings(stretches) {
  const f = {}
  stretches.forEach(s => {
    f[s.stretch_number] = { left: { ...EMPTY_SIDE }, right: { ...EMPTY_SIDE } }
  })
  return f
}

function normalizeFindings(raw, stretches) {
  const base = initFindings(stretches)
  if (!raw || typeof raw !== 'object') return base
  Object.keys(raw).forEach(key => {
    const num = parseInt(key, 10)
    if (base[num] && raw[key]) {
      base[num] = {
        left:  { ...EMPTY_SIDE, ...raw[key].left },
        right: { ...EMPTY_SIDE, ...raw[key].right },
      }
    }
  })
  return base
}

// ─── ROM badge helper ─────────────────────────────────────────

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

// ─── Setup Screen ─────────────────────────────────────────────

function SetupScreen({ onBegin, preselectedClient, stretchesLoading }) {
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(preselectedClient ?? null)
  const { profile }             = useAuth()
  const navigate                = useNavigate()

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

  const canBegin = !!selected && !stretchesLoading

  return (
    <div className="page-container bg-background">
      <div className="px-4 pt-10 pb-28">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 text-sm mb-8">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Home
        </button>

        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#F0EFED' }}>Savant Method</p>
          <h1 className="text-3xl font-bold text-white">Diagnostic Assessment</h1>
          <p className="text-sm text-gray-400 mt-2">9-phase full-body evaluation · 43 stretches</p>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[['9', 'Phases'], ['43', 'Stretches'], ['~45', 'Minutes']].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-400 mb-3">Select Client</label>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
            </div>
          ) : clients.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-400">No active clients yet.</p>
              <button onClick={() => navigate('/clients')} className="text-sm mt-2" style={{ color: '#F0EFED' }}>Add a client →</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clients.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface transition-colors text-left"
                  style={selected?.id === c.id ? { background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderColor: 'rgba(91,138,138,0.5)' } : {}}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: '#F0EFED' }}>{c.first_name[0]}{c.last_name[0]}</span>
                  </div>
                  <span className={`text-sm font-medium ${selected?.id === c.id ? '' : 'text-white'}`} style={selected?.id === c.id ? { color: '#F0EFED' } : {}}>
                    {c.first_name} {c.last_name}
                  </span>
                  {selected?.id === c.id && (
                    <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0EFED" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => canBegin && onBegin(selected)}
          disabled={!canBegin}
          className="btn-gold w-full disabled:opacity-30 disabled:scale-100 mt-6"
        >
          {stretchesLoading ? 'Loading…' : 'Begin Assessment'}
        </button>
      </div>
    </div>
  )
}

// ─── Keyword → Suggestion Logic ──────────────────────────────

const BODY_KEYWORDS = [
  'shoulder', 'rotator', 'pectoral', 'pec',
  'hip', 'psoas', 'flexor', 'groin', 'piriformis',
  'knee', 'quad', 'quadricep',
  'hamstring',
  'back', 'lumbar', 'spine', 'thoracic',
  'neck', 'cervical',
  'calf', 'ankle', 'achilles',
  'glute', 'it band', 'iliotibial',
  'wrist', 'elbow', 'forearm',
  'chest', 'lat',
]

function computeSuggestions(note, stretches) {
  if (!note.trim() || !stretches.length) return []
  const lower = note.toLowerCase()
  const foundKws = BODY_KEYWORDS.filter(kw => lower.includes(kw))
  if (!foundKws.length) return []

  const matched = []
  for (const stretch of stretches) {
    const muscles = Array.isArray(stretch.primary_muscles)
      ? stretch.primary_muscles.join(' ')
      : (stretch.primary_muscles ?? '')
    const haystack = [stretch.name, stretch.body_region, muscles].join(' ').toLowerCase()
    if (foundKws.some(kw => haystack.includes(kw))) {
      matched.push(stretch.name)
      if (matched.length >= 3) break
    }
  }
  return matched
}

// ─── Intake Note Screen ────────────────────────────────────────

function IntakeScreen({ client, onBegin, onBack }) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-4 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">{client.first_name} {client.last_name}</h1>
          <p className="text-xs text-gray-500">Session Intake</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#F0EFED' }}>Before You Begin</p>
          <p className="text-sm text-gray-400 leading-relaxed">Document what the client is reporting before the session starts.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Session notes — what is the client reporting today?
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Tightness in left shoulder, hip flexor soreness from running, lower back pain…"
            rows={6}
            autoFocus
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex-none border-t border-border bg-surface px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button onClick={() => onBegin(note)} className="btn-gold w-full">
          Begin Session →
        </button>
      </div>
    </div>
  )
}

// ─── End Note Screen ───────────────────────────────────────────

function EndNoteScreen({ client, onSave, onBack, saving }) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-4 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Session Complete</h1>
          <p className="text-xs text-gray-500">{client.first_name} {client.last_name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#F0EFED' }}>Assessment Complete</p>
          <p className="text-sm text-gray-400 leading-relaxed">Document your findings before saving the session record.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            End of session notes — what did you find?
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Significant restriction in left shoulder internal rotation, hip flexors bilaterally tight, client responded well to the hamstring series…"
            rows={6}
            autoFocus
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex-none border-t border-border bg-surface px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => onSave(note)}
          disabled={saving}
          className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
        >
          {saving ? 'Saving…' : 'Save Session'}
        </button>
      </div>
    </div>
  )
}

// ─── Transition Screen ────────────────────────────────────────

function TransitionScreen({ step, stepIdx, onReady, onBack, onExit }) {
  const progress = ((stepIdx + 1) / TOTAL_STEPS) * 100

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="flex-none h-1 bg-border">
        <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: '#62F5EC', boxShadow: '0 0 8px rgba(98,245,236,0.3)' }} />
      </div>

      {/* Header */}
      <div className="flex-none bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 text-sm active:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <p className="text-xs text-gray-500">{stepIdx + 1} / {TOTAL_STEPS}</p>
        <button
          onClick={onExit}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-border active:scale-90 transition-transform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">Phase Complete</p>
        <p className="text-lg font-bold text-white mb-8">{step.phase.label}</p>

        <div className="w-12 h-px bg-border mb-8" />

        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#F0EFED' }}>Position Change</p>
        <p className="text-base font-semibold text-white leading-snug mb-6">{step.instruction}</p>

        <div className="w-full max-w-xs bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Coming Up</p>
          <p className="text-sm font-bold text-white">{step.nextLabel}</p>
        </div>
      </div>

      <div
        className="flex-none px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button onClick={onReady} className="btn-gold w-full">
          Ready →
        </button>
      </div>
    </div>
  )
}

// ─── Finding Form ─────────────────────────────────────────────

function FindingForm({ finding, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Range of Motion</p>
        <div className="flex gap-2">
          {ROM_OPTIONS.map(opt => {
            const isActive = finding.rom === opt.value
            const baseStyle = opt.idleStyle || opt.activeStyle
              ? (isActive ? opt.activeStyle : opt.idleStyle)
              : {}
            return (
              <button
                key={opt.value}
                onClick={() => onChange('rom', finding.rom === opt.value ? null : opt.value)}
                className={`flex-1 py-3 rounded-xl text-[11px] font-bold border transition-colors leading-tight ${
                  isActive ? opt.active : opt.idle
                }`}
                style={baseStyle}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Pain Present</p>
        <div className="flex gap-2">
          {[
            { val: true,  label: 'Yes', active: 'bg-red-500 text-white border-red-500',         idle: 'bg-surface border-border text-gray-400' },
            { val: false, label: 'No',  active: 'bg-emerald-500 text-black border-emerald-500', idle: 'bg-surface border-border text-gray-400' },
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

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Compensation Noted</label>
        <input
          type="text"
          value={finding.compensation}
          onChange={e => onChange('compensation', e.target.value)}
          placeholder="e.g. Posterior pelvic tilt, knee flexion…"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Notes</label>
        <textarea
          value={finding.notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Additional observations…"
          rows={2}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors resize-none"
        />
      </div>
    </div>
  )
}

// ─── Stretch Screen ───────────────────────────────────────────

function StretchScreen({ step, stepIdx, findings, setFindings, onAdvance, onGoBack, onExit, saveStatus, stretchByNum, suggestions, onDismissSuggestions }) {
  const [showHowTo, setShowHowTo] = useState(false)

  const { phase, stretchNum } = step
  const stretch    = stretchByNum[stretchNum]
  const storeSide  = phase.side ?? 'left'   // Finish phase (null) stores in 'left'
  const finding    = findings[stretchNum]?.[storeSide] ?? { ...EMPTY_SIDE }
  const isFirst    = stepIdx === 0
  const isLast     = stepIdx === TOTAL_STEPS - 1
  const progress   = ((stepIdx + 1) / TOTAL_STEPS) * 100
  const stretchNum_ = STRETCH_NUM_AT[stepIdx]

  // Collapse how-to when stretch changes
  useEffect(() => { setShowHowTo(false) }, [stretchNum])

  function updateFinding(field, value) {
    setFindings(prev => ({
      ...prev,
      [stretchNum]: {
        ...prev[stretchNum],
        [storeSide]: { ...prev[stretchNum][storeSide], [field]: value },
      },
    }))
  }

  // For left-side phases: show the right-side result recorded earlier
  const oppositeFinding   = phase.side === 'left' ? findings[stretchNum]?.right : null
  const showOppositeRecap = oppositeFinding?.rom !== null

  // Next button label
  const nextStep  = SEQUENCE[stepIdx + 1]
  const nextLabel = isLast
    ? 'Complete ✓'
    : nextStep?.type === 'transition'
      ? 'Next Phase →'
      : 'Next →'

  // setup_execution can be an array or comma-separated string
  const howToSteps = toList(stretch?.setup_execution ?? [])

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="flex-none h-1 bg-border">
        <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: '#62F5EC', boxShadow: '0 0 8px rgba(98,245,236,0.3)' }} />
      </div>

      {/* Save status */}
      <div className="flex-none h-5 bg-background flex items-center justify-center">
        {saveStatus === 'saving' && <p className="text-[10px] text-gray-500">Saving…</p>}
        {saveStatus === 'saved'  && <p className="text-[10px] text-emerald-500">Saved ✓</p>}
      </div>

      {/* Header */}
      <div className="flex-none bg-surface border-b border-border px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#F0EFED' }}>
            {phase.label}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-gray-500">{stretchNum_} / {TOTAL_STRETCHES}</p>
            <button
              onClick={onExit}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-border active:scale-90 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-2xl font-bold leading-none flex-none mt-0.5" style={{ color: '#F0EFED' }}>
            {String(stretchNum).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight">{stretch?.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {stretch?.body_region && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(91,138,138,0.1)', color: '#F0EFED' }}>
                  {stretch.body_region}
                </span>
              )}
              {phase.side && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SIDE_STYLE[phase.side].pill}`}>
                  {SIDE_STYLE[phase.side].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          {/* Mid-session suggestions banner */}
          {suggestions && suggestions.length > 0 && (
            <div
              className="flex items-start gap-3 px-3 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#62F5EC' }}>
                  Based on intake note
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Pay attention to: <span className="text-white font-medium">{suggestions.join(', ')}</span>
                </p>
              </div>
              <button
                onClick={onDismissSuggestions}
                className="flex-none mt-0.5 active:scale-90 transition-transform"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* Narrative — only on right-side or no-side phases (first encounter) */}
          {phase.side !== 'left' && stretch?.narrative && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#F0EFED' }}>Purpose</p>
              <p className="text-sm text-gray-300 leading-relaxed">{stretch.narrative}</p>
            </div>
          )}

          {/* How to Perform — collapsible, only on right-side or no-side phases */}
          {phase.side !== 'left' && howToSteps.length > 0 && (
            <div>
              <button
                onClick={() => setShowHowTo(v => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#F0EFED' }}>How to Perform</p>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#F0EFED" strokeWidth="2"
                  className={`transition-transform ${showHowTo ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showHowTo && (
                <ol className="mt-2 space-y-2">
                  {howToSteps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                      <span className="flex-none w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(91,138,138,0.15)', color: '#F0EFED' }}>
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Right-side recap — shown on left-side phases */}
          {phase.side === 'left' && showOppositeRecap && (
            <div className="px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1.5">
                Right Side Result
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${romBadgeClass(oppositeFinding.rom)}`} style={romBadgeStyle(oppositeFinding.rom)}>
                  {ROM_LABEL[oppositeFinding.rom]}
                </span>
                {oppositeFinding.painPresent === true && (
                  <span className="text-xs text-red-400">· Pain</span>
                )}
                {oppositeFinding.compensation && (
                  <span className="text-xs text-gray-500 truncate">{oppositeFinding.compensation}</span>
                )}
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white mb-3">Findings</p>
            <FindingForm finding={finding} onChange={updateFinding} />
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Footer nav */}
      <div
        className="flex-none border-t border-border bg-surface px-4 py-3 flex gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onGoBack}
          disabled={isFirst}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-gray-400 disabled:opacity-30 active:scale-95 transition-transform"
        >
          Previous
        </button>
        <button
          onClick={() => onAdvance(isLast)}
          className="flex-1 py-3 text-sm font-bold active:scale-95 transition-transform"
          style={isLast
            ? { background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' }
            : { background: 'rgba(91,138,138,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.25)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' }
          }
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Summary Screen ───────────────────────────────────────────

function SummaryScreen({ findings, client, onSave, onBack, saving, stretches }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  })

  const restrictions = []
  let totalAssessed = 0
  let painCount = 0

  stretches.forEach(stretch => {
    const f = findings[stretch.stretch_number]
    if (!f) return
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

  const assessedStretches = stretches.filter(s => {
    const f = findings[s.stretch_number]
    return f && (f.left.rom !== null || f.right.rom !== null)
  })

  return (
    <div className="fixed inset-0 z-10 bg-background flex flex-col">
      <div className="flex-none flex items-center gap-3 px-4 pt-4 pb-4 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-none active:scale-90 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Assessment Complete</h1>
          <p className="text-xs text-gray-500">{today}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
                <span className="font-bold" style={{ color: '#F0EFED' }}>{client.first_name[0]}{client.last_name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-white">{client.first_name} {client.last_name}</p>
                <p className="text-xs text-gray-500">Diagnostic Assessment · 9 Phases</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{totalAssessed}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Sides Assessed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-400">{restrictions.length}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Restrictions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold" style={{ color: '#F0EFED' }}>{painCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Pain Sites</p>
              </div>
            </div>
          </div>

          {restrictions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-2">
                Restrictions Found
              </p>
              <div className="space-y-2">
                {restrictions.map(({ stretch, side, entry }) => (
                  <div key={`${stretch.stretch_number}-${side}`} className="card flex items-start gap-3 py-3">
                    <span className="text-sm font-bold w-7 flex-none" style={{ color: '#F0EFED' }}>
                      {String(stretch.stretch_number).padStart(2, '0')}
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
                        <p className="text-xs text-gray-500 mt-1 truncate">{entry.compensation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#F0EFED' }}>
              All Findings ({assessedStretches.length} stretches)
            </p>
            <div className="space-y-2">
              {assessedStretches.map(stretch => {
                const f = findings[stretch.stretch_number]
                return (
                  <div key={stretch.stretch_number} className="card py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold w-6" style={{ color: '#F0EFED' }}>
                        {String(stretch.stretch_number).padStart(2, '0')}
                      </span>
                      <p className="text-sm font-medium text-white flex-1">{stretch.name}</p>
                      <span className="text-[10px] text-gray-600">{stretch.body_region}</span>
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
                            {entry.painPresent && <span className="text-[10px] text-red-400">· Pain</span>}
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

      <div
        className="flex-none border-t border-border bg-surface px-4 py-3 space-y-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
        >
          {saving ? 'Saving…' : 'Done — Return to Home'}
        </button>
        <button className="btn-outline w-full">Share / Export</button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function DiagnosticSession() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  // Stretch data fetched from Supabase
  const [stretches, setStretches]           = useState([])
  const [stretchesLoading, setStretchesLoading] = useState(true)

  // Session state
  const [screen, setScreen]                 = useState('setup')
  const [client, setClient]                 = useState(null)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [findings, setFindings]             = useState({})
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [saveStatus, setSaveStatus]         = useState('')

  // Notes
  const [intakeNote, setIntakeNote]         = useState('')
  const [endNote, setEndNote]               = useState('')
  const [suggestions, setSuggestions]       = useState([])

  const assessmentIdRef = useRef(null)
  const [assessmentId, setAssessmentId] = useState(null)
  useEffect(() => { assessmentIdRef.current = assessmentId }, [assessmentId])

  // Fetch all stretches on mount — keyed by stretch_number in the session flow
  useEffect(() => {
    supabase
      .from('stretches')
      .select('id, stretch_number, name, body_region, primary_muscles, narrative, setup_execution')
      .order('stretch_number')
      .then(({ data }) => {
        setStretches(data ?? [])
        setStretchesLoading(false)
      })
  }, [])

  // O(1) lookup by stretch_number
  const stretchByNum = Object.fromEntries(stretches.map(s => [s.stretch_number, s]))

  // Resume from in-progress assessment — deferred until stretches are loaded
  const [resumePending, setResumePending] = useState(null)

  useEffect(() => {
    const resume = location.state?.resume
    if (!resume) return
    setResumePending(resume)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resumePending || stretches.length === 0) return
    const { assessmentId: rid, client: rc, currentIdx: rStep, findings: rf } = resumePending
    setClient(rc)
    setCurrentStepIdx(Math.min(rStep ?? 0, SEQUENCE.length - 1))
    setFindings(normalizeFindings(rf, stretches))
    assessmentIdRef.current = rid
    setAssessmentId(rid)
    setScreen('assessment')
    setResumePending(null)
  }, [stretches, resumePending])

  function handleBegin(selectedClient) {
    setClient(selectedClient)
    setFindings(initFindings(stretches))
    setCurrentStepIdx(0)
    assessmentIdRef.current = null
    setAssessmentId(null)
    setIntakeNote('')
    setEndNote('')
    setSuggestions([])
    setScreen('intake')
  }

  function handleIntakeComplete(note) {
    setIntakeNote(note)
    setSuggestions(computeSuggestions(note, stretches))
    setScreen('assessment')
  }

  async function autoSave(currentFindings, stepIdx, status = 'in_progress') {
    if (!profile?.id || !client?.id) return
    setSaveStatus('saving')

    if (!assessmentIdRef.current) {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          client_id:             client.id,
          practitioner_id:       profile.id,
          session_id:            null,
          findings:              currentFindings,
          findings_data:         currentFindings,
          current_stretch_index: stepIdx,
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
      await supabase
        .from('assessments')
        .update({ findings_data: currentFindings, current_stretch_index: stepIdx, status })
        .eq('id', assessmentIdRef.current)
    }

    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  async function handleAdvance(isLastStretch = false) {
    if (isLastStretch) {
      await autoSave(findings, currentStepIdx, 'complete')
      setScreen('end-note')
    } else {
      const step = SEQUENCE[currentStepIdx]
      if (step.type === 'stretch') {
        autoSave(findings, currentStepIdx, 'in_progress') // fire-and-forget
      }
      setCurrentStepIdx(i => i + 1)
    }
  }

  function handleGoBack() {
    setCurrentStepIdx(i => Math.max(0, i - 1))
  }

  async function handleExit() {
    await autoSave(findings, currentStepIdx, 'in_progress')
    navigate('/', { state: { savedMessage: 'Assessment saved. You can resume from where you left off.' } })
  }

  async function handleSave(note) {
    if (!profile?.id || !client?.id) return
    setSaving(true)
    setEndNote(note)

    const restrictions = []
    stretches.forEach(s => {
      ;['left', 'right'].forEach(side => {
        const e = findings[s.stretch_number]?.[side]
        if (e?.rom && e.rom !== 'normal') {
          restrictions.push(`${s.name} (${side}): ${ROM_LABEL[e.rom]}`)
        }
      })
    })
    const summary = restrictions.length > 0
      ? `${restrictions.length} restriction(s) found: ${restrictions.slice(0, 5).join('; ')}${restrictions.length > 5 ? '…' : ''}`
      : 'No restrictions found.'

    let finalAssessmentId = assessmentIdRef.current

    if (finalAssessmentId) {
      await supabase
        .from('assessments')
        .update({ summary, findings, findings_data: findings, status: 'complete' })
        .eq('id', finalAssessmentId)
    } else {
      const { data } = await supabase.from('assessments').insert({
        client_id:       client.id,
        practitioner_id: profile.id,
        session_id:      null,
        findings,
        findings_data:   findings,
        summary,
        status:          'complete',
      }).select('id').single()
      finalAssessmentId = data?.id ?? null
    }

    // Save session notes record
    await supabase.from('session_notes').insert({
      session_id:       finalAssessmentId,
      client_id:        client.id,
      practitioner_id:  profile.id,
      intake_note:      intakeNote,
      end_note:         note,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/'), 1500)
  }

  // ── Render ────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Assessment Saved</h2>
          <p className="text-sm text-gray-400">Returning to home…</p>
        </div>
      </div>
    )
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onBegin={handleBegin}
        preselectedClient={location.state?.preselectedClient ?? null}
        stretchesLoading={stretchesLoading}
      />
    )
  }

  if (screen === 'intake') {
    return (
      <IntakeScreen
        client={client}
        onBegin={handleIntakeComplete}
        onBack={() => setScreen('setup')}
      />
    )
  }

  if (screen === 'end-note') {
    return (
      <EndNoteScreen
        client={client}
        onSave={handleSave}
        onBack={() => setScreen('assessment')}
        saving={saving}
      />
    )
  }

  if (screen === 'assessment') {
    const step = SEQUENCE[currentStepIdx]

    if (step.type === 'transition') {
      return (
        <TransitionScreen
          step={step}
          stepIdx={currentStepIdx}
          onReady={() => handleAdvance(false)}
          onBack={handleGoBack}
          onExit={handleExit}
        />
      )
    }

    return (
      <StretchScreen
        step={step}
        stepIdx={currentStepIdx}
        findings={findings}
        setFindings={setFindings}
        onAdvance={handleAdvance}
        onGoBack={handleGoBack}
        onExit={handleExit}
        saveStatus={saveStatus}
        stretchByNum={stretchByNum}
        suggestions={suggestions}
        onDismissSuggestions={() => setSuggestions([])}
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
      stretches={stretches}
    />
  )
}
