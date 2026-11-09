import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Globe2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import { addActivity } from '../services/activityService'
import { getCourseProgress, isLessonComplete, markLessonComplete } from '../services/progressService'
import { useSmartShield } from '../context/SmartShieldContext'
import { getTranslation } from '../utils/translations'
import { tutorials } from '../data/tutorials'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
]

function getLocalLesson(tutorial, language) {
  const content = tutorial.languages?.[language] || tutorial.languages?.en || {}
  return {
    id: tutorial.id,
    category: tutorial.category,
    difficulty: tutorial.difficulty,
    title: content.title || tutorial.id,
    description: content.description || '',
    videoUrl: content.videoUrl || '',
    steps: content.steps || [],
    transcript: content.transcript || '',
  }
}

function mergeLessons(remoteLessons, language) {
  const lessonsById = new Map(
    tutorials.map((tutorial) => {
      const lesson = getLocalLesson(tutorial, language)
      return [lesson.id, lesson]
    }),
  )

  if (Array.isArray(remoteLessons)) {
    remoteLessons.forEach((remoteLesson) => {
      const localLesson = lessonsById.get(remoteLesson.id)
      lessonsById.set(remoteLesson.id, {
        ...localLesson,
        ...remoteLesson,
        title: localLesson?.title || remoteLesson.title || '',
        description: localLesson?.description || remoteLesson.description || '',
        videoUrl: remoteLesson.videoUrl || localLesson?.videoUrl || '',
        steps: localLesson?.steps || remoteLesson.steps || [],
        transcript: localLesson?.transcript || remoteLesson.transcript || '',
      })
    })
  }

  return [...lessonsById.values()]
}

export default function LearnSmartphone() {
  const navigate = useNavigate()
  const { language, setLanguage, lessonProgress, refreshProgress } = useSmartShield()
  const [lessons, setLessons] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setOffline(false)

    apiClient.get(`/api/lessons?language=${encodeURIComponent(language)}`)
      .then((data) => {
        if (!active) return
        const nextLessons = mergeLessons(data, language)
        setLessons(nextLessons)
        setSelectedLessonId((currentId) => nextLessons.some((lesson) => lesson.id === currentId)
          ? currentId
          : nextLessons[0]?.id || '')
      })
      .catch(() => {
        if (!active) return
        const localLessons = mergeLessons([], language)
        setLessons(localLessons)
        setSelectedLessonId((currentId) => localLessons.some((lesson) => lesson.id === currentId)
          ? currentId
          : localLessons[0]?.id || '')
        setOffline(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [language, retryCount])

  const activeIndex = lessons.findIndex((item) => item.id === selectedLessonId)
  const lesson = activeIndex >= 0 ? lessons[activeIndex] : null
  const currentCourse = useMemo(() => getCourseProgress(lesson?.category || ''), [lesson?.category, lessonProgress])
  const tutorialProgress = lessonProgress[lesson?.id] || { progress: 0, completed: false }
  const totalLessons = lessons.length
  const completedLessons = lessons.filter((item) => isLessonComplete(item.id)).length
  const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

  const moveLesson = (direction) => {
    const nextIndex = Math.max(0, Math.min(lessons.length - 1, activeIndex + direction))
    if (lessons[nextIndex]) setSelectedLessonId(lessons[nextIndex].id)
  }

  const markComplete = async () => {
    if (!lesson) return
    markLessonComplete(lesson.id)
    refreshProgress()
    addActivity({ type: 'lesson', title: lesson.title, description: 'Lesson completed', level: 'success' })
    setCompletionError('')
    try {
      const completion = await apiClient.post(`/api/lessons/${encodeURIComponent(lesson.id)}/complete`, { user_id: 1 })
      if (!completion.persisted || completion.durable === false) {
        setCompletionError(getTranslation(language, 'learn.localProgressNotice'))
      }
    } catch (error) {
      setCompletionError(error.message)
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-sky-600 to-cyan-500 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Learn Smartphone</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-sky-50">Smart lessons that help older adults use phones with confidence.</p>
          </div>
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-lg font-semibold text-white hover:bg-white/25">
            <ArrowLeft size={18} /> {getTranslation(language, 'learn.backHome')}
          </button>
        </div>
      </section>

      {offline && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-950">
          <span>{getTranslation(language, 'learn.offlineNotice')}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="rounded-xl bg-amber-100 px-4 py-2 font-semibold hover:bg-amber-200">
            {getTranslation(language, 'common.retry')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-xl font-semibold text-slate-700">{getTranslation(language, 'common.loading')}</div>
      ) : totalLessons === 0 ? (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-6 text-lg text-red-900">{getTranslation(language, 'learn.emptyError')}</div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 rounded-2xl bg-sky-50 p-4 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">{getTranslation(language, 'learn.progressTitle')}</div>
              <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${overallProgress}%` }} /></div>
              <div className="mt-3 text-2xl font-black text-slate-900">{overallProgress}% {getTranslation(language, 'learn.complete')}</div>
              <div className="mt-1 text-lg text-slate-700">{completedLessons} / {totalLessons} {getTranslation(language, 'learn.lessonsCompleted')}</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{getTranslation(language, 'learn.currentCategory')}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{lesson?.category || getTranslation(language, 'learn.course')}</div>
              <div className="mt-2 text-lg text-slate-700">{currentCourse.progress}% {getTranslation(language, 'learn.categoryProgress')}</div>
              <div className="mt-1 text-sm text-slate-600">{currentCourse.completed} / {currentCourse.total} {getTranslation(language, 'learn.completed')}</div>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900"><BookOpen className="text-sky-700" /> {getTranslation(language, 'learn.tutorialLanguage')}</div>
            <div className="flex flex-wrap gap-3">
              {languages.map((option) => (
                <button key={option.code} type="button" onClick={() => setLanguage(option.code)} className={`rounded-2xl px-4 py-3 text-lg font-semibold ${language === option.code ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <span className="inline-flex items-center gap-2"><Globe2 size={18} /> {option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section aria-labelledby="lesson-list-title">
              <h2 id="lesson-list-title" className="mb-3 text-xl font-extrabold text-slate-900">{getTranslation(language, 'learn.availableLessons')}</h2>
              <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {lessons.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLessonId(item.id)}
                    aria-current={item.id === lesson?.id ? 'true' : undefined}
                    className={`w-full rounded-2xl border p-4 text-left transition ${item.id === lesson?.id ? 'border-sky-600 bg-sky-50 shadow-sm' : 'border-slate-200 hover:border-sky-300'}`}
                  >
                    <span className="block text-sm font-semibold text-sky-800">{item.category} · {index + 1}</span>
                    <span className="mt-1 block text-lg font-bold text-slate-900">{item.title}</span>
                  </button>
                ))}
              </div>
            </section>

            {lesson && (
              <div>
              {completionError && <p role="status" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-950">{completionError}</p>}
              <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-xl font-bold text-slate-900">{lesson.category}</div>
                  <div className="rounded-full bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-900">{activeIndex + 1} / {totalLessons}</div>
                </div>
                <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-base text-slate-700">
                  {getTranslation(language, 'learn.lessonProgress')}: {Math.round(tutorialProgress.progress || 0)}% {tutorialProgress.completed ? '• ✓' : '•'} {tutorialProgress.completed ? getTranslation(language, 'learn.completed') : getTranslation(language, 'learn.inProgress')}
                </div>
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="lesson-title">
                  <h2 id="lesson-title" className="text-2xl font-extrabold text-slate-900">{lesson.title}</h2>
                  <p className="mt-3 text-lg leading-8 text-slate-700">{lesson.description}</p>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{getTranslation(language, 'learn.instructions')}</h3>
                  {lesson.steps.length > 0 ? (
                    <ol className="mt-3 list-decimal space-y-2 pl-6 text-lg leading-8 text-slate-700">
                      {lesson.steps.map((step, index) => <li key={`${lesson.id}-${index}`}>{step}</li>)}
                    </ol>
                  ) : (
                    <p className="mt-2 text-lg leading-8 text-slate-700">{getTranslation(language, 'learn.practiceInstruction')}</p>
                  )}
                  {lesson.transcript && <p className="mt-4 rounded-xl bg-white p-4 text-base leading-7 text-slate-700">{lesson.transcript}</p>}
                  {lesson.videoUrl && (
                    <video key={lesson.id} controls playsInline preload="metadata" className="mt-5 aspect-video w-full rounded-2xl bg-slate-900">
                      <source src={lesson.videoUrl} type="video/mp4" />
                      {getTranslation(language, 'learn.videoUnavailable')}
                    </video>
                  )}
                </section>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => moveLesson(-1)} disabled={activeIndex === 0} className="flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-lg font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={18} /> {getTranslation(language, 'common.previous')}</button>
                  <button type="button" onClick={() => moveLesson(1)} disabled={activeIndex === totalLessons - 1} className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{getTranslation(language, 'common.next')} <ChevronRight size={18} /></button>
                  <button type="button" onClick={markComplete} className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700"><CheckCircle2 size={18} /> {getTranslation(language, 'learn.markComplete')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
