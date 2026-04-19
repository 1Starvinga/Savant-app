import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email || 'Practitioner'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    // signOut does a hard redirect, so this line is never reached —
    // but if it ever is, reset the button state.
    setSigningOut(false)
  }

  return (
    <div className="page-container">
      <div className="px-4 pb-4">
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', paddingBottom: '12px', position: 'relative' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
            <img src={savantSymbol} alt="Savant" style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }} />
          </button>
          <h1 className="text-2xl font-bold text-white" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Profile</h1>
          <HamburgerMenu />
        </div>
        <div className="h-px bg-border mb-6" />

        {/* Practitioner card */}
        <div className="card flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
            <span className="text-lg font-bold" style={{ color: '#F0EFED' }}>{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            <p className="text-xs mt-0.5" style={{ color: '#F0EFED' }}>Savant Certified · Practitioner</p>
            {user?.email && displayName !== user.email && (
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {/* Settings list */}
        <div className="space-y-2">
          {['Account Settings', 'Certification Details', 'Notifications', 'Privacy & Data', 'Help & Support'].map((item) => (
            <button key={item} className="card w-full flex items-center justify-between active:scale-95 transition-transform">
              <span className="text-sm text-white">{item}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="btn-outline w-full mt-8 disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
