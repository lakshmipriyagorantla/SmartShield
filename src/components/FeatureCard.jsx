import { ArrowRight } from 'lucide-react'

export default function FeatureCard({ icon, title, text, actionLabel = 'Learn More', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full flex-col items-start rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-600">{text}</p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-base font-semibold text-emerald-900">
        {actionLabel} <ArrowRight size={18} />
      </div>
    </button>
  )
}
