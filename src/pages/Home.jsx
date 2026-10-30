import { BadgeAlert, BookOpen, ChevronRight, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertCard from '../components/AlertCard'
import FeatureCard from '../components/FeatureCard'
import ProgressBar from '../components/ProgressBar'
import SafetyStatusCard from '../components/SafetyStatusCard'
import { recentAlerts } from '../data/mockAlerts'
import { tutorials } from '../data/tutorials'
import { safetyTips } from '../data/safetyTips'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'
import { getCourseProgress, isLessonComplete } from '../services/progressService'

const featureCards = [
  { icon: '🛡️', titleKey: 'actions.checkScam', path: '/scam-detector' },
  { icon: '📱', titleKey: 'actions.learnPhone', path: '/learn-smartphone' },
  { icon: '💳', titleKey: 'actions.verifyUpi', path: '/upi-qr-safety' },
  { icon: '🧠', titleKey: 'home.featureQuiz', path: '/quiz' },
  { icon: '💬', titleKey: 'home.featureFeedback', path: '/feedback' },
]

export default function Home() {
  const navigate = useNavigate()
  const { language, lessonProgress } = useSmartShield()

  const totalLessons = tutorials.length
  const completedLessons = useMemo(
    () => tutorials.filter((tutorial) => isLessonComplete(tutorial.id)).length,
    [lessonProgress],
  )
  const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

  const categoryProgress = useMemo(
    () => [{ label: 'Smartphone Basics', value: getCourseProgress('Smartphone Basics').progress }, { label: 'WhatsApp', value: getCourseProgress('WhatsApp').progress }, { label: 'UPI and Digital Payments', value: getCourseProgress('UPI and Digital Payments').progress }, { label: 'Online Safety', value: getCourseProgress('Online Safety').progress }, { label: 'Scam Awareness', value: getCourseProgress('Scam Awareness').progress }],
    [lessonProgress],
  )

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-lg md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">
              <ShieldCheck size={18} /> SmartShield
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight md:text-5xl">
              {getTranslation(language, 'heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50">
              {getTranslation(language, 'heroSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/scam-detector')}
                className="rounded-2xl bg-white px-5 py-3 text-lg font-bold text-emerald-900 shadow-sm hover:bg-emerald-50"
              >
                {getTranslation(language, 'home.ctaPrimary')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/learn-smartphone')}
                className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-lg font-bold text-white hover:bg-white/15"
              >
                {getTranslation(language, 'home.ctaSecondary')}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/10 p-5 backdrop-blur-sm">
            <SafetyStatusCard title={getTranslation(language, 'home.safeStatus')} subtitle={getTranslation(language, 'home.safeStatusSubtitle')} safe />
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-lg font-semibold">
                <span className="flex items-center gap-2"><BadgeAlert size={18} /> {getTranslation(language, 'home.safetyScore')}</span>
                <span>{Math.min(99, Math.max(50, overallProgress + 40))}/100</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-lg font-semibold">
                <span className="flex items-center gap-2"><BookOpen size={18} /> {getTranslation(language, 'home.learning')}</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="mt-4 rounded-2xl bg-white/10 p-4 text-base font-medium">
                <div className="flex items-center gap-2 text-emerald-50"><Sparkles size={18} /> {getTranslation(language, 'home.tipTitle')}</div>
                <p className="mt-2 text-emerald-50">{getTranslation(language, 'home.tipText')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map(({ icon, titleKey, path }) => (
          <FeatureCard
            key={titleKey}
            icon={icon}
            title={getTranslation(language, titleKey)}
            text={getTranslation(language, 'home.featureSubtitle')}
            actionLabel={getTranslation(language, 'common.open')}
            onClick={() => navigate(path)}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900">{getTranslation(language, 'home.progressTitle')}</h2>
            <HeartPulse className="text-emerald-600" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{getTranslation(language, 'home.availableLessons')}</div>
              <div className="mt-2 text-4xl font-black text-slate-900">{tutorials.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{getTranslation(language, 'home.completedLessons')}</div>
              <div className="mt-2 text-4xl font-black text-slate-900">{completedLessons}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{getTranslation(language, 'home.safetyTipsCount')}</div>
              <div className="mt-2 text-4xl font-black text-slate-900">{safetyTips.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{getTranslation(language, 'home.quizQuestions')}</div>
              <div className="mt-2 text-4xl font-black text-slate-900">5</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">Recent security alerts</h2>
          <div className="mt-5 space-y-4">
            {recentAlerts.map((alert) => (
              <AlertCard
                key={alert.message}
                title={alert.label}
                message={alert.message}
                tone={alert.tone}
                time="Today"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900">{getTranslation(language, 'home.learningProgress')}</h2>
          <button type="button" onClick={() => navigate('/learn-smartphone')} className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-800">
            {getTranslation(language, 'home.viewAll')} <ChevronRight size={18} />
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <ProgressBar value={overallProgress} label="Smartphone learning" />
          </div>
          {categoryProgress.map((item) => (
            <div key={item.label}>
              <ProgressBar value={item.value} label={item.label} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
