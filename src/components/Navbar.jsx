import { Home, ShieldCheck, Languages, Settings, Menu, Lock } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

const navItems = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/scam-detector', labelKey: 'nav.scamDetector', icon: ShieldCheck },
  { path: '/learn-smartphone', labelKey: 'nav.learnSmartphone', icon: ShieldCheck },
  { path: '/video-tutorials', labelKey: 'nav.videoTutorials', icon: ShieldCheck },
  { path: '/upi-qr-safety', labelKey: 'nav.upiQr', icon: ShieldCheck },
  { path: '/voice-assistant', labelKey: 'nav.voice', icon: Languages },
  { path: '/emergency-sos', labelKey: 'nav.sos', icon: ShieldCheck },
  { path: '/emergency-contacts', labelKey: 'nav.emergencyContacts', icon: Settings },
  { path: '/cyber-safety', labelKey: 'nav.tips', icon: ShieldCheck },
  { path: '/quiz', labelKey: 'nav.quiz', icon: ShieldCheck },
  { path: '/feedback', labelKey: 'nav.feedback', icon: Settings },
  { path: '/privacy-safety', labelKey: 'nav.privacy', icon: Lock },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export default function Navbar({ onToggleMenu, mobileOpen }) {
  const { language, setLanguage } = useSmartShield()

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-2 lg:hidden"
            onClick={onToggleMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-xl text-white font-extrabold shadow-sm">
            S
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{getTranslation(language, 'brand.name')}</div>
            <div className="text-xs text-slate-600">{getTranslation(language, 'brand.tagline')}</div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map(({ path, labelKey, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {getTranslation(language, labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="language-switcher">{getTranslation(language, 'nav.language')}</label>
          <select id="language-switcher" value={language} onChange={(e) => { const next = e.target.value; if (next) { setLanguage(next); localStorage.setItem('smartshield-language', next); } }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700" aria-label="Select language">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="te">తెలుగు</option>
          </select>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
            {navItems.map(({ path, labelKey, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold ${
                    isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700'
                  }`
                }
                onClick={() => onToggleMenu(false)}
              >
                <Icon size={18} />
                {getTranslation(language, labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
