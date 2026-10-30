import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import MobileNavigation from './components/MobileNavigation'
import Home from './pages/Home'
import ScamDetector from './pages/ScamDetector'
import LearnSmartphone from './pages/LearnSmartphone'
import UpiQrSafety from './pages/UpiQrSafety'
import VoiceAssistantPage from './pages/VoiceAssistantPage'
import EmergencySOS from './pages/EmergencySOS'
import EmergencyContacts from './pages/EmergencyContacts'
import CyberSafety from './pages/CyberSafety'
import PrivacySafety from './pages/PrivacySafety'
import Settings from './pages/Settings'
import TutorialDetail from './pages/TutorialDetail'
import QuizPage from './pages/QuizPage'
import FeedbackPage from './pages/FeedbackPage'
import VideoTutorialsPage from './pages/VideoTutorialsPage'
import VideoTutorialDetail from './pages/VideoTutorialDetail'
import { SmartShieldProvider, useSmartShield } from './context/SmartShieldContext'

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { accessibility } = useSmartShield()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  const textSizeClass = {
    normal: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
  }

  return (
    <div
      className={`min-h-screen ${accessibility.contrast === 'high' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} ${textSizeClass[accessibility.textSize] || 'text-base'} ${accessibility.reduceMotion ? 'motion-reduce:transition-none' : ''}`}
    >
      <Navbar onToggleMenu={(nextOpen) => setMobileOpen((open) => typeof nextOpen === 'boolean' ? nextOpen : !open)} mobileOpen={mobileOpen} />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scam-detector" element={<ScamDetector />} />
          <Route path="/learn-smartphone" element={<LearnSmartphone />} />
          <Route path="/tutorial/:id" element={<TutorialDetail />} />
          <Route path="/video-tutorials" element={<VideoTutorialsPage />} />
          <Route path="/video-tutorials/:id" element={<VideoTutorialDetail />} />
          <Route path="/upi-qr-safety" element={<UpiQrSafety />} />
          <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
          <Route path="/emergency-sos" element={<EmergencySOS />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="/cyber-safety" element={<CyberSafety />} />
          <Route path="/privacy-safety" element={<PrivacySafety />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <MobileNavigation />
    </div>
  )
}

function App() {
  return (
    <SmartShieldProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SmartShieldProvider>
  )
}

export default App
