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

function AuthedApp() {
  return (
    <div className="relative h-full bg-background text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/library" element={<Library />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/diagnostic" element={<DiagnosticSession />} />
        <Route path="/clients/:id" element={<ClientProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

function GuestApp() {
  return (
    <div className="relative h-full bg-background text-white overflow-y-auto">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-1">The</p>
          <h1 className="font-display text-4xl text-gold tracking-wide">SAVANT</h1>
          <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mt-1">Stretch Method</p>
          <div className="mt-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
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
