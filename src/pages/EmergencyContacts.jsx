import { useEffect, useMemo, useState } from 'react'
import { Pencil, Phone, Plus, Trash2, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { getEmergencyContacts, saveEmergencyContact, deleteEmergencyContact, setPrimaryEmergencyContact, callEmergencyContact, sendEmergencyMessage } from '../services/emergencyService'

const emptyForm = { id: '', name: '', phone: '', relationship: '', primary: false }

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showDelete, setShowDelete] = useState(null)

  useEffect(() => {
    setContacts(getEmergencyContacts())
  }, [])

  const primaryContact = useMemo(() => contacts.find((contact) => contact.primary) || contacts[0], [contacts])

  const validatePhone = (phone) => /^\+?[0-9\s-]{7,15}$/.test(phone.trim())

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim() || !validatePhone(form.phone)) {
      alert('Please enter a valid name and a valid phone number for the emergency contact.')
      return
    }

    const contactPayload = {
      id: form.id || undefined,
      name: form.name.trim(),
      phone: form.phone.trim(),
      relationship: form.relationship.trim() || 'Family',
      primary: form.primary || contacts.length === 0,
    }

    const next = saveEmergencyContact(contactPayload)
    setContacts(next)
    setForm(emptyForm)
  }

  const handleEdit = (contact) => {
    setForm({ ...contact })
  }

  const handleDelete = (contactId) => {
    const next = deleteEmergencyContact(contactId)
    setContacts(next)
    setShowDelete(null)
  }

  const handleCall = (contact) => {
    const result = callEmergencyContact(contact)
    alert(result.message)
  }

  const handleMessage = (contact) => {
    const result = sendEmergencyMessage(contact)
    alert(result.message)
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-red-700 to-red-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Emergency Contacts</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-red-50">
          Save trusted family members or friends you can contact quickly in an emergency. These contacts are stored in your browser for this website prototype.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">{form.id ? 'Edit contact' : 'Add emergency contact'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-lg font-semibold text-slate-700">
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="Example: Asha" />
            </label>
            <label className="block text-lg font-semibold text-slate-700">
              Phone number
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="+91 90000 11111" />
            </label>
            <label className="block text-lg font-semibold text-slate-700">
              Relationship
              <input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="Daughter / Son / Friend" />
            </label>
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-lg font-semibold text-slate-700">
              Set as primary contact
              <input type="checkbox" checked={!!form.primary} onChange={(e) => setForm({ ...form, primary: e.target.checked })} className="h-6 w-6 accent-red-600" />
            </label>
            <button type="button" onClick={handleSave} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-lg font-bold text-white">
              <Plus size={20} /> {form.id ? 'Save Changes' : 'Add Emergency Contact'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">Saved contacts</h2>
          {contacts.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="text-2xl font-bold text-slate-700">No emergency contacts added yet.</div>
              <button type="button" onClick={() => setForm(emptyForm)} className="mt-5 rounded-2xl bg-red-600 px-6 py-4 text-lg font-bold text-white">
                Add Emergency Contact
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                        {contact.name}
                        {contact.primary && <Star size={18} className="text-amber-500" />}
                      </div>
                      <div className="mt-1 text-lg text-slate-600">{contact.relationship}</div>
                      <div className="mt-2 text-lg font-medium text-slate-700">{contact.phone}</div>
                    </div>
                    {contact.primary && <div className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">Primary</div>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => handleCall(contact)} className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-lg font-semibold text-white">
                      <Phone size={18} /> Call
                    </button>
                    <button type="button" onClick={() => handleMessage(contact)} className="flex items-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-lg font-semibold text-white">
                      <MessageCircle size={18} /> Message
                    </button>
                    <button type="button" onClick={() => handleEdit(contact)} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-lg font-semibold text-slate-700 border border-slate-300">
                      <Pencil size={18} /> Edit
                    </button>
                    {!contact.primary && (
                      <button type="button" onClick={() => {
                        const updated = setPrimaryEmergencyContact(contact.id)
                        setContacts(updated)
                      }} className="rounded-2xl bg-amber-100 px-4 py-3 text-lg font-semibold text-amber-900">
                        Set Primary
                      </button>
                    )}
                    <button type="button" onClick={() => setShowDelete(contact.id)} className="flex items-center gap-2 rounded-2xl bg-red-100 px-4 py-3 text-lg font-semibold text-red-800">
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <ShieldCheck className="text-red-600" /> Delete contact?
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-700">This action will remove the emergency contact from your list.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => handleDelete(showDelete)} className="rounded-2xl bg-red-600 px-5 py-3 text-lg font-semibold text-white">Delete</button>
              <button type="button" onClick={() => setShowDelete(null)} className="rounded-2xl bg-slate-100 px-5 py-3 text-lg font-semibold text-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
