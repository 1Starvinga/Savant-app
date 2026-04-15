import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(authUser) {
  console.log('[useAuth] fetchProfile — cached user id:', authUser.id)

  // Use getUser() to get a server-verified token, not the cached session.
  // This confirms the access_token is actually being sent in the Authorization
  // header. If this returns a user, the JWT is valid and auth.uid() will work.
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  console.log('[useAuth] getUser() (server-verified) → id:', user?.id, '| error:', userErr?.message ?? 'none')

  const uid = user?.id ?? authUser.id
  console.log('[useAuth] using uid:', uid)

  // ── Primary: SECURITY DEFINER RPC (bypasses RLS) ─────────────
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_profile')
  console.log('[useAuth] get_my_profile RPC → data:', JSON.stringify(rpcData), '| error:', JSON.stringify(rpcErr))

  if (rpcData) {
    console.log('[useAuth] ✅ profile loaded via RPC — id:', rpcData.id)
    return rpcData
  }
  if (rpcErr) {
    console.warn('[useAuth] RPC error — code:', rpcErr.code, '| message:', rpcErr.message)
  }

  // ── Fallback: direct table query ──────────────────────────────
  const { data, error: selectErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', uid)
    .single()

  console.log('[useAuth] profiles.select → data:', JSON.stringify(data), '| error:', JSON.stringify(selectErr))

  if (data) {
    console.log('[useAuth] ✅ profile loaded via select — id:', data.id)
    return data
  }

  // ── Last resort: insert if genuinely missing ──────────────────
  if (selectErr?.code === 'PGRST116') {
    const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || ''
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ user_id: uid, email: authUser.email ?? '', full_name: fullName, role: 'practitioner' })
      .select()
      .single()
    console.log('[useAuth] INSERT → data:', JSON.stringify(inserted), '| error:', JSON.stringify(insertErr))
    if (inserted) {
      console.log('[useAuth] ✅ profile created — id:', inserted.id)
      return inserted
    }
  }

  console.error('[useAuth] ❌ profile is null. getUser() id was:', user?.id, '— if null, the session token is not reaching Supabase.')
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

    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('[useAuth] ⏱ 10s timeout — forcing loading=false. Profile is null.')
        settled = true
        setLoading(false)
      }
    }, 10000)

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[useAuth] getSession →',
          session ? `session found for ${session.user.email}` : 'no session',
          error ? `error: ${error.message}` : ''
        )
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await fetchProfile(session.user)
          setProfile(p)
        }
      } catch (err) {
        console.error('[useAuth] init() threw:', err)
      } finally {
        if (!settled) {
          settled = true
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[useAuth] onAuthStateChange →', _event, session?.user?.email ?? 'signed out')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user)
        setProfile(p)
      } else {
        setProfile(null)
      }
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        setLoading(false)
      }
    })

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

  const signOut = useCallback(async () => {
    // 'local' scope wipes the session from localStorage instantly without a network
    // call, so onAuthStateChange fires immediately and there's nothing to hang on.
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // If the supabase call somehow fails, manually purge any sb-* keys so the
      // session is definitely gone before we redirect.
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k))
    }
    // Hard redirect — reloads the app with no session, guaranteed login screen.
    window.location.replace('/')
  }, [])

  return { user, session, profile, loading, signIn, signOut, signUp }
}
