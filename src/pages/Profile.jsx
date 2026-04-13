export default function Profile() {
  return (
    <div className="page-container">
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
        <div className="h-px bg-border mb-6" />

        {/* Practitioner card */}
        <div className="card flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-none">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Practitioner Name</p>
            <p className="text-xs text-gold mt-0.5">Savant Certified · Level 1</p>
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

        <button className="btn-outline w-full mt-8">Sign Out</button>
      </div>
    </div>
  )
}
