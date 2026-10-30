import { Home, ShieldCheck, BookOpen, QrCode } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

const items = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/scam-detector', labelKey: 'nav.scamDetector', icon: ShieldCheck },
  { path: '/learn-smartphone', labelKey: 'nav.learnSmartphone', icon: BookOpen },
  { path: '/video-tutorials', labelKey: 'nav.videoTutorials', icon: QrCode },
  { path: '/upi-qr-safety', labelKey: 'nav.upiQr', icon: QrCode },
]

export default function MobileNavigation() {
  const { language } = useSmartShield()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-2 backdrop-blur-sm lg:hidden">
      <div className="grid grid-cols-5 gap-1 text-center">
        {items.map(({ path, labelKey, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold ${
              isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600'
            }`}
          >
            <Icon size={18} />
            <span>{getTranslation(language, labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
