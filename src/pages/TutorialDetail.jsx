import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tutorials } from '../data/tutorials'

export default function TutorialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')

  const tutorial = useMemo(() => tutorials.find((item) => item.id === id) || tutorials[0], [id])
  const lessonContent = tutorial?.languages?.[language] || tutorial?.languages?.en || {}
  const title = lessonContent.title || tutorial.id
  const description = lessonContent.description || ''
  const transcript = lessonContent.transcript || ''
  const steps = lessonContent.steps || []

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-cyan-600 to-sky-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">{title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-cyan-50">{description}</p>
          </div>
          <div className="flex gap-2">
            {['en', 'hi', 'te'].map((lang) => (
              <button key={lang} type="button" onClick={() => setLanguage(lang)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${language === lang ? 'bg-white text-sky-800' : 'bg-sky-500/30 text-white'}`}>
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'తెలుగు'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-2xl font-bold text-slate-900">Step-by-step guide</div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-lg font-bold text-cyan-900">
                {index + 1}
              </div>
              <div className="text-lg leading-8 text-slate-700">{step}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg leading-8 text-slate-700">
          <strong>Transcript:</strong> {transcript}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate('/learn-smartphone')} className="rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white">
            Go Back
          </button>
          <button type="button" onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(description))} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700">
            Read This Aloud
          </button>
        </div>
      </div>
    </div>
  )
}
