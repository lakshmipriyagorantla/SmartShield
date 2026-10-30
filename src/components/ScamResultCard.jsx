export default function ScamResultCard({ result }) {
  const toneStyles = {
    SAFE: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    SUSPICIOUS: 'border-amber-200 bg-amber-50 text-amber-900',
    'HIGH RISK': 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-3xl border p-6 ${toneStyles[result.risk] ?? toneStyles.SAFE}`}>
      <div className="mb-3 text-2xl font-extrabold">Risk: {result.risk}</div>
      <div className="mb-4 text-xl font-semibold">Risk Score: {result.score}%</div>
      <p className="text-lg leading-8">{result.summary}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">Reasons</h3>
          <ul className="mt-2 list-disc pl-5 text-base leading-7">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold">Suspicious keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.suspiciousKeywords.length ? (
              result.suspiciousKeywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-600">No suspicious keywords found</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/70 p-4">
        <div className="text-lg font-bold">Recommended action</div>
        <p className="mt-2 text-base leading-7">{result.recommendedAction}</p>
      </div>
    </div>
  )
}
