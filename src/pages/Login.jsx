import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await signIn({ email: form.email, password: form.password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-background flex flex-col justify-center px-6 py-12">
      {/* Logo / Wordmark */}
      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">The</p>
        <h1 className="font-display text-4xl text-gold tracking-wide">SAVANT</h1>
        <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mt-1">Stretch Method</p>
      </div>

      {/* Card */}
      <div className="card max-w-sm w-full mx-auto">
        <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-gold font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
