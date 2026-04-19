import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Clients from './pages/Clients'
import Library from './pages/Library'
import Sessions from './pages/Sessions'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DiagnosticSession from './pages/DiagnosticSession'
import ClientProfile from './pages/ClientProfile'
import ClientSession from './pages/ClientSession'
import heroImg from './assets/hero.jpg'

const bgStyle = {
  minHeight: '100vh',
  backgroundImage: `url(${heroImg})`,
  backgroundSize: 'cover',
  backgroundPosition: '5% center',
  backgroundAttachment: 'fixed',
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  zIndex: 0,
}

function AuthedApp() {
  return (
    <div className="relative h-full text-white" style={bgStyle}>
      <div style={overlayStyle} />
      <div className="relative h-full" style={{ zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/library" element={<Library />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/diagnostic" element={<DiagnosticSession />} />
          <Route path="/clients/:id" element={<ClientProfile />} />
          <Route path="/clients/:id/session" element={<ClientSession />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </div>
  )
}

function GuestApp() {
  return (
    <div className="relative h-full text-white overflow-y-auto" style={bgStyle}>
      <div style={overlayStyle} />
      <div className="relative h-full" style={{ zIndex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={bgStyle}>
        <div style={overlayStyle} />
        <div className="text-center" style={{ position: 'relative', zIndex: 1 }}>
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">The</p>
          <h1 className="font-display text-4xl tracking-wide" style={{ color: '#F0EFED' }}>SAVANT</h1>
          <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mt-1">Stretch Method</p>
          <div className="mt-8 flex justify-center">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#F0EFED', borderTopColor: 'transparent' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {user ? <AuthedApp /> : <GuestApp />}
    </BrowserRouter>
  )
}
