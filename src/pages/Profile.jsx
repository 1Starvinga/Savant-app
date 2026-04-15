import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Profile() {
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
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
        <div className="h-px bg-border mb-6" />

        {/* Practitioner card */}
        <div className="card flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-none">
            <span className="text-gold text-lg font-bold">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            <p className="text-xs text-gold mt-0.5">Savant Certified · Practitioner</p>
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
