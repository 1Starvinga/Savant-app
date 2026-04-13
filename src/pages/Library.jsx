import { useState } from 'react'
import { stretchLibrary, BODY_REGIONS } from '../data/stretchLibrary'

export default function Library() {
  const [activeRegion, setActiveRegion] = useState('All')

  const regions = ['All', ...Object.values(BODY_REGIONS)]

  const filtered = activeRegion === 'All'
    ? stretchLibrary
    : stretchLibrary.filter((s) => s.region === activeRegion)

  return (
    <div className="page-container">
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-2">Stretch Library</h1>
        <div className="h-px bg-border mb-4" />

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`flex-none text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeRegion === region
                  ? 'bg-gold text-black border-gold'
                  : 'border-border text-gray-400'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Stretch cards */}
        <div className="space-y-3 mt-2">
          {filtered.map((stretch) => (
            <div key={stretch.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{stretch.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stretch.region} · {stretch.technique}</p>
                </div>
                <span className="text-xs text-gold bg-gold/10 rounded-full px-2 py-1 ml-2 flex-none">
                  {stretch.duration}s
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{stretch.description}</p>
              {stretch.cues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-gold font-medium uppercase tracking-wider mb-1.5">Cues</p>
                  <ul className="space-y-1">
                    {stretch.cues.map((cue, i) => (
                      <li key={i} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-gold mt-0.5">·</span>
                        {cue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
