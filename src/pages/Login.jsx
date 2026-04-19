import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import savantSymbol from '../assets/savant-symbol.png'
import signinHero from '../assets/signin-hero.jpg'

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
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px', backgroundImage: `url(${signinHero})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Dark overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Wordmark block */}
      <div className="text-center" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '42px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.2em', marginBottom: 0, lineHeight: 1 }}>SAVANT</p>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', marginBottom: 0 }}>Stretch Method</p>
      </div>

      {/* Card */}
      <div className="max-w-sm w-full mx-auto" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '16px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Sign in to your account</h2>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
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
              className="w-full placeholder-gray-500 focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#F0EFED', fontSize: '13px', padding: '7px 12px' }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
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
              className="w-full placeholder-gray-500 focus:outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#F0EFED', fontSize: '13px', padding: '7px 12px' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '11px', color: '#f87171', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', padding: '6px 10px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-50 disabled:scale-100"
            style={{ padding: '8px 24px', fontSize: '13px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium" style={{ color: '#F0EFED' }}>
          Sign up
        </Link>
      </p>
      </div>{/* end content wrapper */}

      {/* Symbol watermark — anchored to outer container */}
      <img
        src={savantSymbol}
        alt=""
        style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', height: '36px', width: 'auto', mixBlendMode: 'screen', opacity: 1, pointerEvents: 'none' }}
      />
    </div>
  )
}
