import { ShieldCheck, ShieldAlert } from 'lucide-react'

export default function SafetyStatusCard({ title, subtitle, safe = true }) {
  return (
    <div className={`rounded-3xl border p-5 ${safe ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${safe ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
          {safe ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{title}</div>
          <div className="text-base text-slate-600">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}
