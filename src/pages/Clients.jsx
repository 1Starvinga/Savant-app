import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import savantSymbol from '../assets/savant-symbol.png'
import HamburgerMenu from '../components/HamburgerMenu'

// ─── helpers ────────────────────────────────────────────────

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Add Client Modal ────────────────────────────────────────

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '', notes: '' }

function AddClientModal({ onClose, onSaved, practitionerId }) {
  const [form, setForm]     = useState(EMPTY_FORM)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSave() {
    if (!practitionerId) {
      setError('Profile not loaded yet. Please wait a moment and try again.')
      return
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.')
      return
    }
    setSaving(true)
    const { data, error: dbErr } = await supabase
      .from('clients')
      .insert({
        practitioner_id: practitionerId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
        status: 'active',
      })
      .select()
      .single()

    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    onSaved(data)
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">Add Client</h2>
          <button onClick={onClose} className="text-gray-400 active:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Jane" />
            <Field label="Last Name *"  name="last_name"  value={form.last_name}  onChange={handleChange} placeholder="Smith" />
          </div>
          <Field label="Email"  name="email"  type="email" value={form.email}  onChange={handleChange} placeholder="jane@example.com" />
          <Field label="Phone"  name="phone"  type="tel"   value={form.phone}  onChange={handleChange} placeholder="+1 (555) 000-0000" />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Goals, injuries, focus areas…"
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
          >
            {saving ? 'Saving…' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors"
      />
    </div>
  )
}

// ─── Client Card ─────────────────────────────────────────────

function ClientCard({ client, onClick }) {
  const lastSession = client.sessions?.length
    ? client.sessions.reduce((a, b) => (a.date > b.date ? a : b))
    : null

  return (
    <button onClick={onClick} className="card w-full flex items-start gap-3 text-left active:scale-[0.99] transition-transform">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-none mt-0.5" style={{ backgroundColor: 'rgba(91,138,138,0.2)' }}>
        <span className="text-sm font-bold" style={{ color: '#F0EFED' }}>
          {initials(client.first_name, client.last_name)}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">
            {client.first_name} {client.last_name}
          </p>
          {/* Status badge */}
          <span className={`flex-none text-[10px] font-medium px-2 py-0.5 rounded-full ${
            client.status === 'active'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-gray-700/50 text-gray-500'
          }`}>
            {client.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Last session */}
        <p className="text-xs text-gray-500 mt-0.5">
          {lastSession
            ? `Last session: ${formatDate(lastSession.date)}`
            : 'No sessions yet'}
        </p>

        {/* Notes preview */}
        {client.notes && (
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {client.notes}
          </p>
        )}
      </div>
      <svg className="flex-none self-center" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function Clients() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients]     = useState([])
  const [fetching, setFetching]   = useState(true)
  const [dbError, setDbError]     = useState('')
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchClients = useCallback(async () => {
    if (!profile?.id) {
      setFetching(false)  // profile resolved but is null — stop spinning
      return
    }
    setFetching(true)
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id, first_name, last_name, email, phone, notes, status, created_at,
        sessions ( date, status )
      `)
      .eq('practitioner_id', profile.id)
      .order('created_at', { ascending: false })

    setFetching(false)
    if (error) { setDbError(error.message); return }
    setClients(data ?? [])
  }, [profile?.id])

  // Don't attempt fetch while auth is still resolving
  useEffect(() => {
    if (!authLoading) fetchClients()
  }, [fetchClients, authLoading])

  function handleClientSaved(newClient) {
    // Insert at top; no sessions yet so add empty array
    setClients((prev) => [{ ...newClient, sessions: [] }, ...prev])
    setShowModal(false)
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-container">
      <div className="px-4 pt-8 pb-4">
        {/* Header row */}
        <div className="flex items-center mb-2" style={{ paddingTop: '16px', paddingBottom: '4px', position: 'relative' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
            <img src={savantSymbol} alt="Savant" style={{ height: '52px', width: 'auto', display: 'block', mixBlendMode: 'screen' }} />
          </button>
          <h1 className="text-2xl font-bold text-white" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Clients</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => setShowModal(true)}
              className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(91,138,138,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(91,138,138,0.4)', borderRadius: '50%' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#62F5EC" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <HamburgerMenu />
          </div>
        </div>
        <div className="h-px bg-border mb-4" />

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:outline-none transition-colors"
          />
        </div>

        {/* States */}
        {fetching && !clients.length && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
          </div>
        )}

        {dbError && (
          <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-4 py-3">{dbError}</p>
        )}

        {!fetching && !dbError && !profile?.id && (
          <div className="card text-center py-10">
            <p className="text-sm text-gray-400">Profile not found. Try signing out and back in.</p>
          </div>
        )}

        {!fetching && !dbError && profile?.id && filtered.length === 0 && (
          <div className="card text-center py-12">
            {search ? (
              <p className="text-sm text-gray-400">No clients match "<span className="text-white">{search}</span>"</p>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(91,138,138,0.1)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0EFED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white mb-1">No clients yet</p>
                <p className="text-xs text-gray-500">Add your first client to get started.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-gold mt-5 text-sm px-5 py-2.5"
                >
                  Add Client
                </button>
              </>
            )}
          </div>
        )}

        {/* Client list */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => navigate(`/clients/${client.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddClientModal
          practitionerId={profile?.id}
          onClose={() => setShowModal(false)}
          onSaved={handleClientSaved}
        />
      )}
    </div>
  )
}
