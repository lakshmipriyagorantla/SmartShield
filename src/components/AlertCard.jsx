export default function AlertCard({ title, message, tone = 'safe', time }) {
  const toneStyles = {
    safe: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone] ?? toneStyles.safe}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{time}</div>
      </div>
      <p className="mt-2 text-base leading-7">{message}</p>
    </div>
  )
}
