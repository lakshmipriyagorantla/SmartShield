import { AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react'
import { mockAlerts } from '../data/mockAlerts'

export default function CallSmsSafety() {
  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Call & SMS Safety</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-orange-50">
          Review suspicious calls and messages and learn what action to take.
        </p>
      </section>

      <div className="grid gap-6">
        {mockAlerts.map((alert) => (
          <div key={alert.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                  <AlertTriangle className={alert.risk === 'HIGH' ? 'text-red-600' : 'text-amber-500'} />
                  {alert.type === 'call' ? 'Possible Scam Call' : 'Suspicious SMS Detected'}
                </div>
                <div className="text-lg text-slate-600">From: {alert.number}</div>
              </div>
              <div className={`rounded-full px-3 py-2 text-sm font-bold ${alert.risk === 'HIGH' ? 'bg-red-100 text-red-700' : alert.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {alert.risk}
              </div>
            </div>

            <p className="mt-5 text-xl leading-8 text-slate-700">{alert.preview}</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-base leading-7 text-slate-700">
              <div><strong>Reason:</strong> {alert.reason}</div>
              <div className="mt-2"><strong>Action:</strong> {alert.action}</div>
              <div className="mt-2"><strong>Time:</strong> {alert.time}</div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="rounded-2xl bg-emerald-700 px-4 py-3 text-lg font-semibold text-white">{alert.type === 'call' ? 'Block Number' : 'Check Message'}</button>
              <button type="button" className="rounded-2xl bg-white px-4 py-3 text-lg font-semibold text-slate-700 border border-slate-300">{alert.type === 'call' ? 'Report Scam' : 'Report'}</button>
              <button type="button" className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-700">{alert.type === 'call' ? 'Ignore' : 'Delete'}</button>
              <button type="button" className="rounded-2xl bg-sky-100 px-4 py-3 text-lg font-semibold text-sky-900">Learn Why</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
