import { useState } from 'react'
import { stretchLibrary, CATEGORIES } from '../data/stretchLibrary'

// ─── Region color accents (subtle, per-category) ─────────────
const REGION_COLORS = {
  'Posterior Chain': '#8B6914',
  'Lower Extremity': '#1A4A3A',
  'Hip Mobility':    '#3A1A4A',
  'Spine':           '#1A3A4A',
  'Upper Body':      '#4A2A1A',
}

const REGION_TEXT = {
  'Posterior Chain': '#D4A843',
  'Lower Extremity': '#4ABA8A',
  'Hip Mobility':    '#B46ADA',
  'Spine':           '#4AAADA',
  'Upper Body':      '#DA8A4A',
}

// ─── Stretch Card ─────────────────────────────────────────────

function StretchCard({ stretch, onSelect }) {
  const accentBg   = REGION_COLORS[stretch.region] ?? '#1A1A1A'
  const accentText = REGION_TEXT[stretch.region] ?? '#C9A84C'

  return (
    <button
      onClick={() => onSelect(stretch)}
      className="card flex flex-col justify-between text-left active:scale-95 transition-transform min-h-[130px] p-4"
    >
      {/* Number */}
      <span className="text-2xl font-bold text-gold leading-none">
        {String(stretch.id).padStart(2, '0')}
      </span>

      {/* Name */}
      <div className="mt-2">
        <p className="text-sm font-semibold text-white leading-snug">
          {stretch.name}
        </p>

        {/* Region badge */}
        <span
          className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: accentBg, color: accentText }}
        >
          {stretch.region}
        </span>
      </div>
    </button>
  )
}

// ─── Detail View (full-screen overlay) ───────────────────────

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

function DetailView({ stretch, onBack }) {
  const accentBg   = REGION_COLORS[stretch.region] ?? '#1A1A1A'
  const accentText = REGION_TEXT[stretch.region] ?? '#C9A84C'

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
            <span className="text-gold font-bold text-sm">
              {String(stretch.id).padStart(2, '0')}
            </span>
            <h1 className="text-base font-bold text-white truncate">
              {stretch.name}
            </h1>
          </div>
          <span
            className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accentBg, color: accentText }}
          >
            {stretch.region}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-12">

          <Section title="Purpose">
            <p className="text-sm text-gray-300 leading-relaxed">{stretch.purpose}</p>
          </Section>

          <Section title="How to Perform">
            <ol className="space-y-3">
              {stretch.howTo.map((step, i) => (
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
          </Section>

          <Section title="What to Look For">
            <ul className="space-y-2">
              {stretch.lookFor.map((cue, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-gold mt-1 flex-none">◆</span>
                  <p className="text-sm text-gray-300 leading-relaxed">{cue}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Common Compensations">
            <ul className="space-y-2">
              {stretch.compensations.map((comp, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red-400 mt-1 flex-none">↳</span>
                  <p className="text-sm text-gray-400 leading-relaxed">{comp}</p>
                </li>
              ))}
            </ul>
          </Section>

        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function Library() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState(null)

  const filtered = activeCategory === 'All'
    ? stretchLibrary
    : stretchLibrary.filter((s) => s.region === activeCategory)

  if (selected) {
    return <DetailView stretch={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page-container">
      <div className="px-4 pt-8 pb-4">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white">Stretch Library</h1>
          <p className="text-xs text-gray-500 mt-0.5">The 24 Fundamental Stretches</p>
        </div>
        <div className="h-px bg-border mb-4" />

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-none text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-gold text-black border-gold'
                  : 'border-border text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-600 mb-3">
          {filtered.length} stretch{filtered.length !== 1 ? 'es' : ''}
          {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
        </p>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((stretch) => (
            <StretchCard
              key={stretch.id}
              stretch={stretch}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
