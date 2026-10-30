import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, Phone, MessageCircle, ShieldCheck } from 'lucide-react'
import { callEmergencyContact, getEmergencyContacts, sendEmergencyMessage } from '../services/emergencyService'

export default function EmergencySOS() {
  const [contacts, setContacts] = useState([])
  const [active, setActive] = useState(false)
  const [locationSharing, setLocationSharing] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setContacts(getEmergencyContacts())
  }, [])

  const primaryContact = useMemo(() => contacts.find((contact) => contact.primary) || contacts[0], [contacts])

  const handleSOS = () => {
    if (!primaryContact) {
      setStatusMessage('No emergency contacts added yet. Add a trusted contact first.')
      return
    }

    const confirmed = window.confirm('Are you sure you want to activate SOS? This is a demo action and will not send a live emergency message in the browser.')
    if (!confirmed) return

    setActive(true)
    setStatusMessage(`Demo emergency alert prepared. Primary contact: ${primaryContact.name}. Location sharing is ${locationSharing ? 'enabled' : 'not enabled'}.`)
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-red-700 to-red-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Emergency SOS</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-red-50">
          Press the large emergency button only when you need immediate help. This browser demo does not send a real emergency call or SMS.
        </p>
      </section>

      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm text-center">
        <button
          type="button"
          onClick={handleSOS}
          className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-red-600 text-3xl font-black text-white shadow-2xl ring-8 ring-red-200 transition hover:scale-[1.02]"
        >
          🚨<br />EMERGENCY<br />SOS
        </button>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-4 text-left text-lg leading-8 text-slate-700">
          <div className="flex items-center gap-2 font-extrabold text-red-700"><AlertTriangle size={20} /> What happens when SOS is pressed?</div>
          <p className="mt-2">The app prepares an emergency action for your primary contact. In the browser, it opens a dialer or message draft only as a demo.</p>
        </div>

        {primaryContact ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-left">
            <div className="text-xl font-extrabold text-slate-900">Primary emergency contact</div>
            <div className="mt-3 text-lg text-slate-700">{primaryContact.name} · {primaryContact.phone}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => alert(callEmergencyContact(primaryContact).message)} className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-lg font-semibold text-white"><Phone size={18} /> Call</button>
              <button type="button" onClick={() => alert(sendEmergencyMessage(primaryContact).message)} className="flex items-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-lg font-semibold text-white"><MessageCircle size={18} /> Send SMS</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <div className="text-2xl font-extrabold text-slate-800">No emergency contacts added yet.</div>
            <a href="/emergency-contacts" className="mt-5 inline-flex rounded-2xl bg-red-600 px-6 py-4 text-lg font-bold text-white">Add Emergency Contact</a>
          </div>
        )}

        {active && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-white p-6 text-left">
            <div className="flex items-center gap-2 text-2xl font-extrabold text-red-700"><ShieldCheck size={20} /> Emergency alert initiated.</div>
            <div className="mt-3 text-lg leading-8 text-slate-700">{statusMessage || 'Your emergency contact has been prepared for contact. Demo location sharing is ready.'}</div>
            <div className="mt-5 space-y-3 text-lg text-slate-700">
              <div className="flex items-center gap-2"><Phone size={18} /> {primaryContact ? `Contact: ${primaryContact.name} (${primaryContact.phone})` : 'No contact saved'}</div>
              <div className="flex items-center gap-2"><MapPin size={18} /> Location sharing: {locationSharing ? 'Enabled' : 'Off'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold text-slate-900">Emergency settings</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-lg font-semibold text-slate-700">
            Location sharing
            <select value={locationSharing ? 'on' : 'off'} onChange={(event) => setLocationSharing(event.target.value === 'on')} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg">
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <div className="rounded-2xl bg-slate-50 p-4 text-lg text-slate-700">
            <div className="font-bold">Important</div>
            <p className="mt-2">This browser does not send a real emergency alert. Real calling and SMS need native Android or backend support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
