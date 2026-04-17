import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import heroImg from '../assets/hero.jpg'

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

      {/* Hero image — full-width, top ~third of screen */}
      <div className="relative w-full h-[33vh] flex-none">
        <img
          src={heroImg}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Gradient: slight scrim at top for legibility → transparent mid → solid background at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(13,13,13,0) 40%, #0D0D0D 100%)',
          }}
        />
      </div>

      <div className="px-4 pb-4">

        {/* Saved message toast */}
        {savedMessage ? (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ABA8A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="text-sm text-emerald-400 flex-1">{savedMessage}</p>
          </div>
        ) : null}

        {/* In-progress assessment banner */}
        {inProgress && inProgress.clients ? (
          <div className="mb-5 px-4 py-3 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gold uppercase tracking-widest mb-0.5">
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
              className="flex-none text-xs font-semibold text-black bg-gold rounded-lg px-3 py-1.5 active:scale-95 transition-transform"
            >
              Resume
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <div className="mt-2 h-px bg-border" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="card text-center">
              <p className="text-xl font-bold text-gold">{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming sessions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Upcoming Sessions</h2>
          <button className="text-xs text-gold">View all</button>
        </div>

        <div className="space-y-3">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold text-sm font-semibold">
                    {session.client.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{session.client}</p>
                  <p className="text-xs text-gray-400">{session.date} · {session.time}</p>
                </div>
              </div>
              <button className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1">
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
              className="card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform border-gold/30"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4CFC7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4CFC7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span className="text-sm font-medium text-white">Add Client</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
