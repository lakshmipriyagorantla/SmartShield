import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Globe2 } from 'lucide-react'
import { apiClient } from '../services/apiClient'
import { addActivity } from '../services/activityService'
import { getCourseProgress, isLessonComplete, markLessonComplete } from '../services/progressService'
import { useSmartShield } from '../context/SmartShieldContext'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
]

export default function LearnSmartphone() {
  const { language, setLanguage, lessonProgress, refreshProgress } = useSmartShield()
  const [lessons, setLessons] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiClient.get(`/api/lessons?language=${language}`)
      .then((data) => {
        if (active) {
          setLessons(data)
          setActiveIndex(0)
        }
      })
      .catch(() => {
        if (active) setError('Unable to load the smartphone course. Please try again later.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [language])

  const lesson = lessons[activeIndex]
  const currentCourse = useMemo(() => getCourseProgress(lesson?.category || ''), [lesson?.category, lessonProgress])
  const tutorialProgress = lessonProgress[lesson?.id] || { progress: 0, completed: false }
  const totalLessons = lessons.length
  const completedLessons = lessons.filter((item) => isLessonComplete(item.id)).length
  const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

  const moveLesson = (direction) => {
    if (!lessons.length) return
    setActiveIndex((current) => (current + direction + lessons.length) % lessons.length)
  }

  const markComplete = () => {
    if (!lesson) return
    markLessonComplete(lesson.id)
    refreshProgress()
    addActivity({ type: 'lesson', title: lesson.title, description: 'Lesson completed', level: 'success' })
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-sky-600 to-cyan-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Learn Smartphone</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-sky-50">Smart lessons that help older adults use phones with confidence.</p>
      </section>

      {loading ? <div className="rounded-3xl bg-white p-8 text-center text-xl font-semibold text-slate-700">Loading course...</div> : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-lg text-red-900">{error}</div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 rounded-2xl bg-sky-50 p-4 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Your Learning Progress</div>
              <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${overallProgress}%` }} /></div>
              <div className="mt-3 text-2xl font-black text-slate-900">{overallProgress}% Complete</div>
              <div className="mt-1 text-lg text-slate-700">{completedLessons} of {totalLessons} lessons completed</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Current category</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{lesson?.category || 'Course'}</div>
              <div className="mt-2 text-lg text-slate-700">{currentCourse.progress}% in this category</div>
              <div className="mt-1 text-sm text-slate-600">{currentCourse.completed} / {currentCourse.total} completed</div>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900"><BookOpen className="text-sky-700" /> Tutorial language</div>
            <div className="flex flex-wrap gap-3">
              {languages.map((option) => (
                <button key={option.code} type="button" onClick={() => setLanguage(option.code)} className={`rounded-2xl px-4 py-3 text-lg font-semibold ${language === option.code ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <span className="inline-flex items-center gap-2"><Globe2 size={18} /> {option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-xl font-bold text-slate-900">{lesson?.category || 'Course'}</div>
            <div className="rounded-full bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-900">{activeIndex + 1} / {totalLessons}</div>
          </div>

          <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-base text-slate-700">Lesson progress: {Math.round(tutorialProgress.progress || 0)}% {tutorialProgress.completed ? '• ✓ Completed' : '• In progress'}</div>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="lesson-title">
            <h2 id="lesson-title" className="text-2xl font-extrabold text-slate-900">{lesson?.title}</h2>
            <p className="mt-3 text-lg leading-8 text-slate-700">{lesson?.description}</p>
            {lesson?.videoUrl ? (
              <video key={lesson.id} controls playsInline preload="metadata" className="mt-5 aspect-video w-full rounded-2xl bg-slate-900" src={lesson.videoUrl}>
                Your browser cannot play this lesson video.
              </video>
            ) : null}
          </section>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => moveLesson(-1)} className="flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-lg font-semibold text-slate-700"><ChevronLeft size={18} /> Previous</button>
            <button type="button" onClick={() => moveLesson(1)} className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white">Next <ChevronRight size={18} /></button>
            <button type="button" onClick={markComplete} className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700"><CheckCircle2 size={18} /> Mark complete</button>
          </div>
        </div>
      )}
    </div>
  )
}
