import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(authUser) {
  console.log('[useAuth] fetchProfile — uid:', authUser.id)

  // ── Primary: SECURITY DEFINER RPC (bypasses RLS) ─────────────
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_profile')
  console.log('[useAuth] get_my_profile RPC →', JSON.stringify(rpcData), '| error:', JSON.stringify(rpcErr))

  if (rpcData) return rpcData
  if (rpcErr) console.warn('[useAuth] RPC error:', rpcErr.code, rpcErr.message)

  // ── Fallback: direct table query ──────────────────────────────
  const { data, error: selectErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single()

  console.log('[useAuth] profiles.select →', JSON.stringify(data), '| error:', JSON.stringify(selectErr))
  if (data) return data

  // ── Last resort: insert if genuinely missing ──────────────────
  if (selectErr?.code === 'PGRST116') {
    const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || ''
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ user_id: authUser.id, email: authUser.email ?? '', full_name: fullName, role: 'practitioner' })
      .select()
      .single()
    console.log('[useAuth] INSERT →', JSON.stringify(inserted), '| error:', JSON.stringify(insertErr))
    if (inserted) return inserted
  }

  console.error('[useAuth] ❌ profile is null for uid:', authUser.id)
  return null
}

// ─────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let settled = false

    function resolve() {
      if (!settled) {
        settled = true
        setLoading(false)
      }
    }

    // Timeout backstop — should never fire now that resolve() is called
    // independently of the profile fetch, but kept as a safety net.
    const timeout = setTimeout(() => {
      console.warn('[useAuth] ⏱ 5s timeout hit — forcing loading=false')
      resolve()
    }, 5000)

    // onAuthStateChange is the source of truth for session state.
    // Registered before init() so it catches the INITIAL_SESSION event.
    // NOT async — supabase-js does not await the callback, so async here
    // creates a fire-and-forget that races with state updates.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useAuth] onAuthStateChange →', _event, session?.user?.email ?? 'signed out')
      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.user) {
        setProfile(null)
        resolve()
        return
      }

      // Resolve loading as soon as we know the user — don't block on profile.
      resolve()

      // Fetch profile in the background; UI will update when it arrives.
      fetchProfile(session.user)
        .then(p => setProfile(p))
        .catch(err => console.error('[useAuth] fetchProfile error:', err))
    })

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[useAuth] getSession →', session ? `found (${session.user.email})` : 'no session')

        // If onAuthStateChange already fired and settled us, skip.
        if (settled) return

        setSession(session)
        setUser(session?.user ?? null)

        if (!session?.user) {
          resolve()
          return
        }

        // Resolve immediately — don't wait for profile.
        resolve()

        fetchProfile(session.user)
          .then(p => setProfile(p))
          .catch(err => console.error('[useAuth] fetchProfile error:', err))
      } catch (err) {
        console.error('[useAuth] init() threw:', err)
        resolve()
      }
    }

    init()

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(() => {
    // Synchronously clear all sb-* keys from localStorage — cannot hang.
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k))
    // Best-effort server-side token revocation (non-blocking, result ignored).
    supabase.auth.signOut().catch(() => {})
    // Hard redirect — app reloads with no session in storage → login screen.
    window.location.replace('/')
  }, [])

  return { user, session, profile, loading, signIn, signOut, signUp }
}
