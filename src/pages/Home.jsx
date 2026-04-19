import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

export default function Home() {
  const navigate          = useNavigate()
  const location          = useLocation()
  const { profile }       = useAuth()

  const [inProgress, setInProgress]       = useState(null)
  const [savedMessage, setSavedMessage]   = useState('')

  const upcomingSessions = [
    { id: 1, client: 'Jordan M.', time: '10:00 AM', date: 'Today' },
    { id: 2, client: 'Alex R.',   time: '1:30 PM',  date: 'Today' },
    { id: 3, client: 'Sam T.',    time: '9:00 AM',  date: 'Tomorrow' },
  ]

  const stats = [
    { label: 'Sessions This Week', value: 8 },
    { label: 'Active Clients',     value: 14 },
    { label: 'Avg. Duration',      value: '55m' },
  ]

  const displayName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : 'Practitioner'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Show toast if navigated here with a saved message (e.g. after exiting assessment)
  useEffect(() => {
    if (location.state?.savedMessage) {
      setSavedMessage(location.state.savedMessage)
      // Clear the nav state so it doesn't re-show on back/forward
      window.history.replaceState({}, '')
      const timer = setTimeout(() => setSavedMessage(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [location.state?.savedMessage])

  // Query for any in-progress assessment belonging to this practitioner
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('assessments')
      .select(`
        id,
        client_id,
        current_stretch_index,
        findings_data,
        clients ( id, first_name, last_name )
      `)
      .eq('practitioner_id', profile.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setInProgress(data ?? null))
  }, [profile?.id])

  function resumeAssessment() {
    if (!inProgress) return
    navigate('/diagnostic', {
      state: {
        resume: {
          assessmentId: inProgress.id,
          client: {
            id:         inProgress.clients?.id ?? inProgress.client_id,
            first_name: inProgress.clients?.first_name ?? 'Client',
            last_name:  inProgress.clients?.last_name ?? '',
          },
          currentIdx: inProgress.current_stretch_index ?? 0,
          findings:   inProgress.findings_data ?? {},
        },
      },
    })
  }

  return (
    <div className="page-container">
      <div className="pb-4">

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'relative' }}>

          {/* Savant symbol — left */}
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            <img
              src={savantSymbol}
              alt="Savant"
              style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }}
            />
          </button>

          {/* SAVANT wordmark — absolutely centered */}
          <h1
            className="font-display tracking-[0.2em] uppercase"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#F0EFED', fontSize: '40px', fontWeight: 700, textShadow: 'none', pointerEvents: 'none' }}
          >
            SAVANT
          </h1>

          {/* Hamburger menu — right */}
          <HamburgerMenu />

        </div>

        <div className="px-4">

        {/* Teal divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(91,138,138,0.3)', marginBottom: '240px' }} />

        {/* Saved message toast */}
        {savedMessage ? (
          <div className="mb-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="text-sm text-emerald-400 flex-1">{savedMessage}</p>
          </div>
        ) : null}

        {/* Instrument cluster: greeting + assessment banner + stats */}
        <div className="mb-3" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {/* Header */}
          <div>
            <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginBottom: '2px' }}>{greeting},</p>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>{displayName}</h1>
          </div>

          {/* In-progress assessment banner */}
          {inProgress && inProgress.clients ? (
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '2px solid rgba(98,245,236,0.3)', borderRadius: '16px' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#F0EFED' }}>
                  Assessment in progress
                </p>
                <p className="text-sm text-white truncate">
                  {inProgress.clients.first_name} {inProgress.clients.last_name}
                  <span className="text-gray-400">
                    {' '}· Step {(inProgress.current_stretch_index ?? 0) + 1} of 47
                  </span>
                </p>
              </div>
              <button
                onClick={resumeAssessment}
                className="flex-none text-xs font-semibold active:scale-95 transition-transform px-3 py-1.5" style={{ background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' }}
              >
                Resume
              </button>
            </div>
          ) : null}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="card text-center" style={{ padding: '12px', borderTop: '1px solid rgba(91,138,138,0.4)' }}>
                <p className="font-bold" style={{ fontSize: '24px', color: '#62F5EC', textShadow: '0 0 16px rgba(98,245,236,0.8)' }}>{stat.value}</p>
                <p className="text-gray-400 mt-1 leading-tight" style={{ fontSize: '11px' }}>{stat.label}</p>
              </div>
            ))}
          </div>

        </div>{/* end instrument cluster */}

        {/* Upcoming sessions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Upcoming Sessions</h2>
          <button className="text-xs active:scale-95 transition-transform px-2.5 py-1" style={{ background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' }}>View all</button>
        </div>

        <div className="space-y-3">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="card flex items-center justify-between" style={{ borderLeft: '2px solid rgba(98,245,236,0.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
                  <span className="text-sm font-semibold" style={{ color: '#F0EFED' }}>
                    {session.client.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{session.client}</p>
                  <p className="text-xs text-gray-400">{session.date} · {session.time}</p>
                </div>
              </div>
              <button className="text-xs active:scale-95 transition-transform px-3 py-1" style={{ background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', color: '#62F5EC', textShadow: '0 0 8px rgba(98,245,236,0.25)', borderRadius: '12px' }}>
                View
              </button>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <h2 className="text-base font-semibold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">

            {/* Start Diagnostic */}
            <button
              onClick={() => navigate('/diagnostic')}
              className="card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform" style={{ borderColor: 'rgba(91,138,138,0.3)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F0EFED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span className="text-sm font-medium text-white">Start Diagnostic</span>
            </button>

            {/* Add Client */}
            <button
              onClick={() => navigate('/clients')}
              className="card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F0EFED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span className="text-sm font-medium text-white">Add Client</span>
            </button>

          </div>
        </div>{/* end quick actions */}
        </div>{/* end px-4 */}
      </div>
    </div>
  )
}
