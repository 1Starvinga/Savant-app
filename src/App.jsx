import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Clients from './pages/Clients'
import Library from './pages/Library'
import Sessions from './pages/Sessions'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative h-full bg-background text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/library" element={<Library />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
