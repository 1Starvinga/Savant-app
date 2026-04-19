import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HamburgerMenu() {
  const navigate  = useNavigate()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [menuOpen])

  const menuItems = [
    { label: 'Profile',            action: () => { navigate('/profile'); setMenuOpen(false) } },
    { label: 'Settings',           action: () => setMenuOpen(false) },
    { label: 'Certification Info', action: () => setMenuOpen(false) },
  ]

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 12px', color: '#F0EFED', cursor: 'pointer' }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <line x1="0" y1="1"  x2="18" y2="1"  stroke="#F0EFED" strokeWidth="1.75" strokeLinecap="round"/>
          <line x1="0" y1="7"  x2="18" y2="7"  stroke="#F0EFED" strokeWidth="1.75" strokeLinecap="round"/>
          <line x1="0" y1="13" x2="18" y2="13" stroke="#F0EFED" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      </button>

      {menuOpen && (
        <div style={{ position: 'absolute', top: '52px', right: 0, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '8px', minWidth: '200px', zIndex: 100 }}>
          {menuItems.map(({ label, action }, i) => (
            <div key={label}>
              <button
                onClick={action}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#F0EFED', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {label}
              </button>
              {i < menuItems.length - 1 && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />
              )}
            </div>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />
          <button
            onClick={async () => { setMenuOpen(false); await signOut() }}
            style={{ width: '100%', textAlign: 'left', padding: '12px 16px', color: '#62F5EC', textShadow: '0 0 16px rgba(98,245,236,0.8)', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
