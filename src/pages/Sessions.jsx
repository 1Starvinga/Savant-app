import { useNavigate } from 'react-router-dom'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

export default function Sessions() {
  const navigate = useNavigate()

  return (
    <div className="page-container">
      <div className="px-4 pb-4">
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', paddingBottom: '12px', position: 'relative' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
            <img src={savantSymbol} alt="Savant" style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }} />
          </button>
          <h1 className="text-2xl font-bold text-white" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Sessions</h1>
          <HamburgerMenu />
        </div>
        <div className="h-px bg-border mb-6" />

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => navigate('/clients')}
            className="btn-gold w-full"
          >
            New Session
          </button>
          <button
            onClick={() => navigate('/diagnostic')}
            className="btn-outline w-full"
          >
            Start New Assessment
          </button>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" className="flex-none">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-gray-500">Select a client to open their session record</p>
        </div>

        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">Session history coming in Phase 1</p>
        </div>
      </div>
    </div>
  )
}
