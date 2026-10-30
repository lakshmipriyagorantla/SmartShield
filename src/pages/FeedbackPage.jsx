import { useState } from 'react'
import { apiClient } from '../services/apiClient'

const initialForm = {
  name: '',
  age_group: '45-60',
  difficult_lesson: 'How to protect from scams',
  telugu_support: true,
  video_support: true,
  voice_support: true,
  website_checking_easy: true,
  suggestions: '',
}

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await apiClient.post('/api/feedback', form)
      setSubmitted(true)
      setError('')
      setForm(initialForm)
    } catch {
      setError('Your feedback could not be saved. Please try again.')
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Community Feedback</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-emerald-50">
          Share what was helpful and what should be improved for senior citizens.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-900">{error}</div>}
        {submitted && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            Thank you for your feedback. It has been saved successfully.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-lg font-bold text-slate-800">
            Name
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="Your name" />
          </label>

          <label className="block text-lg font-bold text-slate-800">
            Age group
            <select value={form.age_group} onChange={(event) => updateField('age_group', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg">
              <option value="45-60">45-60</option>
              <option value="61-70">61-70</option>
              <option value="71+">71+</option>
            </select>
          </label>

          <label className="block text-lg font-bold text-slate-800 md:col-span-2">
            Lesson that was difficult
            <input value={form.difficult_lesson} onChange={(event) => updateField('difficult_lesson', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="Example: WhatsApp video call" />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-lg font-semibold text-slate-700">
            <input type="checkbox" checked={form.telugu_support} onChange={(event) => updateField('telugu_support', event.target.checked)} />
            Telugu support was helpful
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-lg font-semibold text-slate-700">
            <input type="checkbox" checked={form.video_support} onChange={(event) => updateField('video_support', event.target.checked)} />
            Video lessons were helpful
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-lg font-semibold text-slate-700">
            <input type="checkbox" checked={form.voice_support} onChange={(event) => updateField('voice_support', event.target.checked)} />
            Voice help would be useful
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-lg font-semibold text-slate-700">
            <input type="checkbox" checked={form.website_checking_easy} onChange={(event) => updateField('website_checking_easy', event.target.checked)} />
            Website checking was easy to understand
          </label>

          <label className="block text-lg font-bold text-slate-800 md:col-span-2">
            Suggestions
            <textarea value={form.suggestions} onChange={(event) => updateField('suggestions', event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="Tell us how we can help the community more." />
          </label>
        </div>

        <div className="mt-6">
          <button type="submit" className="rounded-2xl bg-emerald-700 px-6 py-3 text-lg font-bold text-white">
            Save Feedback
          </button>
        </div>
      </form>
    </div>
  )
}
