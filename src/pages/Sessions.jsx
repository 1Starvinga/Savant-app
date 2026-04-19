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
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">Session builder coming in Phase 1</p>
        </div>
      </div>
    </div>
  )
}
