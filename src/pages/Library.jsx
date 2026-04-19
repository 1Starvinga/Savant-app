import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

// ─── Region styles ─────────────────────────────────────────────

const REGION_STYLE = {
  'Lower Body': { bg: '#1A3A2A', text: '#4ABA8A' },
  'Upper Body': { bg: '#2A1A3A', text: '#9A6ACA' },
}

function regionStyle(region) {
  return REGION_STYLE[region] ?? { bg: '#1C1C1C', text: '#F0EFED' }
}

// ─── Helpers ───────────────────────────────────────────────────

// Handles both PostgreSQL array (JS array) and comma-separated string
function toList(val) {
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

// Handles both array (render as numbered steps) and plain text
function renderSteps(val, accentBg, accentText) {
  const list = toList(val)
  if (list.length > 1) {
    return (
      <ol className="space-y-3">
        {list.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
              style={{ backgroundColor: accentBg, color: accentText }}
            >
              {i + 1}
            </span>
            <p className="text-sm text-gray-300 leading-relaxed flex-1">{step}</p>
          </li>
        ))}
      </ol>
    )
  }
  // Plain text
  const text = Array.isArray(val) ? val[0] : val
  return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{text}</p>
}

function renderBullets(val) {
  const list = toList(val)
  if (list.length > 1) {
    return (
      <ul className="space-y-2">
        {list.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1 flex-none text-xs" style={{ color: '#F0EFED' }}>◆</span>
            <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
    )
  }
  const text = Array.isArray(val) ? val[0] : val
  return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{text}</p>
}

// ─── Stretch Card ──────────────────────────────────────────────

function StretchCard({ stretch, number, onSelect }) {
  const style   = regionStyle(stretch.body_region)
  const muscles = toList(stretch.primary_muscles)

  return (
    <button
      onClick={() => onSelect(stretch)}
      className="card flex flex-col justify-between text-left active:scale-95 transition-transform min-h-[140px] p-4"
    >
      {/* Number */}
      <span className="text-2xl font-bold leading-none" style={{ color: '#F0EFED' }}>
        {String(number).padStart(2, '0')}
      </span>

      <div className="mt-2">
        {/* Name */}
        <p className="text-sm font-semibold text-white leading-snug">
          {stretch.name}
        </p>

        {/* Primary muscles preview */}
        {muscles.length > 0 && (
          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
            {muscles.slice(0, 3).join(' · ')}
          </p>
        )}

        {/* Region badge */}
        <span
          className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {stretch.body_region}
        </span>
      </div>
    </button>
  )
}

// ─── Section label ─────────────────────────────────────────────

function SectionLabel({ region }) {
  const style = regionStyle(region)
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-2 h-2 rounded-full flex-none"
        style={{ backgroundColor: style.text }}
      />
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: style.text }}>
        {region}
      </p>
      <div className="flex-1 h-px" style={{ backgroundColor: style.bg }} />
    </div>
  )
}

// ─── Detail View (full-screen overlay) ────────────────────────

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#F0EFED' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function DetailView({ stretch, number, onBack }) {
  const style   = regionStyle(stretch.body_region)
  const muscles = toList(stretch.primary_muscles)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 px-4 pt-safe-top pt-4 pb-4 border-b border-border bg-surface">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-border active:scale-90 transition-transform flex-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: '#F0EFED' }}>
              {String(number).padStart(2, '0')}
            </span>
            <h1 className="text-base font-bold text-white truncate">
              {stretch.name}
            </h1>
          </div>
          <span
            className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {stretch.body_region}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-12">

          {/* Primary muscles */}
          {muscles.length > 0 && (
            <Section title="Primary Muscles">
              <div className="flex flex-wrap gap-2">
                {muscles.map((m, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-3 py-1 rounded-full border"
                    style={{ backgroundColor: style.bg, color: style.text, borderColor: style.bg }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Setup & Execution */}
          {stretch.setup_execution && (
            <Section title="Setup & Execution">
              {renderSteps(stretch.setup_execution, style.bg, style.text)}
            </Section>
          )}

          {/* Narrative */}
          {stretch.narrative && (
            <Section title="Narrative">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {stretch.narrative}
              </p>
            </Section>
          )}

          {/* Anchor Principles */}
          {stretch.anchor_principles && (
            <Section title="Anchor Principles">
              {renderBullets(stretch.anchor_principles)}
            </Section>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────

export default function Library() {
  const navigate = useNavigate()
  const [stretches, setStretches]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [activeRegion, setActiveRegion] = useState('All')
  const [selected, setSelected]       = useState(null)

  useEffect(() => {
    supabase
      .from('stretches')
      .select('id, name, body_region, primary_muscles, setup_execution, narrative, anchor_principles')
      .order('id')
      .then(({ data, error: err, status, statusText }) => {
        console.log('[Library] Supabase response →', { status, statusText, rowCount: data?.length ?? 0, data, error: err })
        if (err) setError(err.message)
        else     setStretches(data ?? [])
        setLoading(false)
      })
  }, [])

  // Unique regions in the order they appear
  const regions = ['All', ...[...new Set(stretches.map(s => s.body_region).filter(Boolean))]]

  const filtered = activeRegion === 'All'
    ? stretches
    : stretches.filter(s => s.body_region === activeRegion)

  // For "All" view — build groups in region order
  const groups = regions
    .filter(r => r !== 'All')
    .map(region => ({
      region,
      items: stretches.filter(s => s.body_region === region),
    }))
    .filter(g => g.items.length > 0)

  // Global number by original fetch order (id-sorted)
  function numberOf(stretch) {
    return stretches.findIndex(s => s.id === stretch.id) + 1
  }

  // Detail view
  if (selected) {
    return (
      <DetailView
        stretch={selected}
        number={numberOf(selected)}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="page-container">
      <div className="px-4 pt-8 pb-4">

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', paddingBottom: '4px', position: 'relative' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
            <img src={savantSymbol} alt="Savant" style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }} />
          </button>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <h1 className="text-2xl font-bold text-white">Stretch Library</h1>
            <p className="text-xs text-gray-500 mt-0.5">The 24 Fundamental Stretches</p>
          </div>
          <HamburgerMenu />
        </div>
        <div className="h-px bg-border mb-4" style={{ marginTop: '8px' }} />

        {/* Filter pills */}
        {!loading && !error && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar mb-4">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex-none text-xs font-medium px-3 py-1.5 transition-colors ${
                  activeRegion === region ? '' : 'border border-border text-gray-400'
                }`}
                style={activeRegion === region ? { background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' } : { borderRadius: '999px' }}
              >
                {region}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card text-center py-10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Grouped "All" view */}
        {!loading && !error && activeRegion === 'All' && (
          <div className="space-y-6">
            {groups.map(({ region, items }) => (
              <div key={region}>
                <SectionLabel region={region} />
                <div className="grid grid-cols-2 gap-3">
                  {items.map(stretch => (
                    <StretchCard
                      key={stretch.id}
                      stretch={stretch}
                      number={numberOf(stretch)}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtered single-region view */}
        {!loading && !error && activeRegion !== 'All' && (
          <>
            <p className="text-xs text-gray-600 mb-3">
              {filtered.length} stretch{filtered.length !== 1 ? 'es' : ''} · {activeRegion}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(stretch => (
                <StretchCard
                  key={stretch.id}
                  stretch={stretch}
                  number={numberOf(stretch)}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
