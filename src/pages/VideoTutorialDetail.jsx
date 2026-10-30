import { ArrowLeft, BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import VideoTutorialPlayer from '../components/VideoTutorialPlayer'
import { fetchVideoTutorialById, fetchVideoTutorials } from '../services/videoTutorialService'
import { apiClient } from '../services/apiClient'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

export default function VideoTutorialDetail() {
  const { id } = useParams()
  const { language } = useSmartShield()
  const [tutorial, setTutorial] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [videoCompleted, setVideoCompleted] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    let isActive = true
    setLoading(true)
    completedRef.current = false
    setVideoCompleted(false)

    Promise.all([fetchVideoTutorialById(id, language), fetchVideoTutorials(language)])
      .then(([detail, list]) => {
        if (!isActive) return
        setTutorial(detail)
        setRelated((list || []).filter((item) => item.id !== id).slice(0, 3))
        setError('')
      })
      .catch(() => {
        if (isActive) setError(getTranslation(language, 'videos.loadError'))
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [id, language])

  const categoryLabel = useMemo(() => {
    if (!tutorial) return ''
    return tutorial.categoryKey ? getTranslation(language, tutorial.categoryKey) : tutorial.category
  }, [tutorial, language])

  const handleVideoComplete = () => {
    if (!tutorial?.id || completedRef.current) return
    completedRef.current = true
    apiClient.post(`/api/video-tutorials/${tutorial.id}/complete`, { user_id: 1 })
      .then(() => setVideoCompleted(true))
      .catch(() => setVideoCompleted(false))
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-xl font-semibold text-slate-700">
        {getTranslation(language, 'videos.loading')}
      </div>
    )
  }

  if (error || !tutorial) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-lg text-rose-900">
        {error || getTranslation(language, 'videos.notFound')}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-sky-700 to-cyan-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">{categoryLabel}</div>
            <h1 className="mt-2 text-4xl font-black">{tutorial.title}</h1>
          </div>
          <Link to="/video-tutorials" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-base font-semibold text-white">
            <ArrowLeft size={18} /> {getTranslation(language, 'videos.backToList')}
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <VideoTutorialPlayer tutorial={tutorial} language={language} onComplete={handleVideoComplete} />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900">{getTranslation(language, 'videos.description')}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">{tutorial.description}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900">{getTranslation(language, 'videos.learnMore')}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">{tutorial.learnMore || tutorial.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <ShieldCheck className="text-emerald-700" /> {getTranslation(language, 'videos.safetyPoints')}
            </div>
            <ul className="mt-5 space-y-3">
              {(tutorial.safetyPoints || []).map((point) => (
                <li key={point} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-base leading-7 text-slate-700">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {tutorial.relatedQuizSetId && (
            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{getTranslation(language, 'videos.takeQuiz')}</div>
                  <p className="mt-1 text-base text-slate-700">{videoCompleted ? getTranslation(language, 'videos.videoComplete') : getTranslation(language, 'videos.markComplete')}</p>
                </div>
                <Link to={`/quiz?quizSetId=${encodeURIComponent(tutorial.relatedQuizSetId)}`} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-base font-bold text-white">
                  <CheckCircle2 size={18} /> {getTranslation(language, 'quiz.title')}
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <BookOpen className="text-violet-700" /> {getTranslation(language, 'videos.relatedVideos')}
            </div>
            <div className="mt-5 space-y-4">
              {related.map((item) => (
                <Link key={item.id} to={`/video-tutorials/${item.id}`} className="block rounded-2xl border border-slate-200 p-3 transition hover:border-violet-300 hover:bg-violet-50">
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
                    {item.categoryKey ? getTranslation(language, item.categoryKey) : item.category}
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-slate-900">{item.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
