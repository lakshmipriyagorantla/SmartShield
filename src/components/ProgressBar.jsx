export default function ProgressBar({ value = 0, label = 'Progress' }) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
