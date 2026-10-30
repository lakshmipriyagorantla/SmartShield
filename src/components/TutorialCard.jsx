import { ArrowRight } from 'lucide-react'

export default function TutorialCard({ title, summary, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-200"
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl">📘</div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-base leading-7 text-slate-600">{summary}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-lg font-semibold text-sky-800">
        Open tutorial <ArrowRight size={18} />
      </div>
    </button>
  )
}
