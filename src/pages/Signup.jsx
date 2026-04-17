import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { session } = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      })
      // If Supabase requires email confirmation there's no session yet
      if (session) {
        navigate('/', { replace: true })
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setError(err.message ?? 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-full bg-background flex flex-col justify-center px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">The</p>
          <h1 className="font-display text-4xl text-gold tracking-wide">SAVANT</h1>
          <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mt-1">Stretch Method</p>
        </div>
        <div className="card max-w-sm w-full mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4CFC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Check your email</h2>
          <p className="text-sm text-gray-400">
            We sent a confirmation link to{' '}
            <span className="text-white">{form.email}</span>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="btn-outline block mt-6 text-center">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background flex flex-col justify-center px-6 py-12">
      {/* Logo / Wordmark */}
      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">The</p>
        <h1 className="text-4xl font-bold tracking-tight text-gold">SAVANT</h1>
        <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mt-1">Stretch Method</p>
      </div>

      {/* Card */}
      <div className="card max-w-sm w-full mx-auto">
        <h2 className="text-lg font-semibold text-white mb-6">Create your account</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-gray-400 mb-1.5">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Jane Smith"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            By signing up you're joining as a{' '}
            <span className="text-gold">Savant Practitioner</span>.
          </p>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-gold font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
