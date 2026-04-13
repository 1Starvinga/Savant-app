export default function Home() {
  // Placeholder — will pull real data from Supabase in Phase 1 build
  const upcomingSessions = [
    { id: 1, client: 'Jordan M.', time: '10:00 AM', date: 'Today' },
    { id: 2, client: 'Alex R.', time: '1:30 PM', date: 'Today' },
    { id: 3, client: 'Sam T.', time: '9:00 AM', date: 'Tomorrow' },
  ]

  const stats = [
    { label: 'Sessions This Week', value: 8 },
    { label: 'Active Clients', value: 14 },
    { label: 'Avg. Duration', value: '55m' },
  ]

  return (
    <div className="page-container">
      <div className="px-4 pt-8 pb-4">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">Good morning,</p>
          <h1 className="text-2xl font-bold text-white">Practitioner</h1>
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
                {/* Avatar placeholder */}
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
            <button className="card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-sm font-medium text-white">New Session</span>
            </button>
            <button className="card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
