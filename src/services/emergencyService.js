const STORAGE_KEY = 'smartshield-emergency-contacts'

const defaultContacts = [
  {
    id: 'demo-1',
    name: 'Asha',
    phone: '+91 90000 11111',
    relationship: 'Daughter',
    primary: true,
  },
]

function normalizePhone(value = '') {
  return String(value || '').replace(/\s+/g, '')
}

function normalizeContact(contact) {
  const safe = {
    id: contact?.id || crypto?.randomUUID?.() || `contact-${Date.now()}`,
    name: String(contact?.name || '').trim(),
    phone: normalizePhone(contact?.phone || ''),
    relationship: String(contact?.relationship || 'Family').trim() || 'Family',
    primary: Boolean(contact?.primary),
  }

  return safe
}

export function getEmergencyContacts() {
  if (typeof window === 'undefined') return defaultContacts

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const contacts = raw ? JSON.parse(raw) : defaultContacts
    const value = Array.isArray(contacts) ? contacts : defaultContacts
    return value.length ? value : defaultContacts
  } catch {
    return defaultContacts
  }
}

export function addEmergencyContact(contact) {
  const contacts = getEmergencyContacts()
  const next = [...contacts, normalizeContact({ ...contact, primary: contacts.length === 0 ? true : Boolean(contact.primary) })]
  const normalized = next.map((entry, index) => ({ ...entry, primary: index === 0 ? true : Boolean(entry.primary) }))

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function updateEmergencyContact(id, contact) {
  const contacts = getEmergencyContacts().map((entry) => (entry.id === id ? normalizeContact({ ...entry, ...contact, id }) : entry))
  const normalized = contacts.map((entry, index) => ({ ...entry, primary: index === 0 ? true : Boolean(entry.primary) }))

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function deleteEmergencyContact(id) {
  const contacts = getEmergencyContacts().filter((contact) => contact.id !== id)
  const normalized = contacts.map((contact, index) => ({ ...contact, primary: index === 0 ? true : false }))

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

export function setPrimaryEmergencyContact(id) {
  const contacts = getEmergencyContacts().map((contact) => ({
    ...contact,
    primary: contact.id === id,
  }))

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }

  return contacts
}

export function getPrimaryEmergencyContact() {
  return getEmergencyContacts().find((contact) => contact.primary) || getEmergencyContacts()[0] || null
}

export function saveEmergencyContact(contact) {
  return contact && contact.id ? updateEmergencyContact(contact.id, contact) : addEmergencyContact(contact)
}

export function callEmergencyContact(contact) {
  if (!contact) {
    return { success: false, message: 'No emergency contact selected.' }
  }

  const phoneNumber = normalizePhone(contact.phone)
  if (!phoneNumber) {
    return { success: false, message: 'Calling requires a phone or Android device.' }
  }

  if (typeof window !== 'undefined' && 'location' in window) {
    const telUrl = `tel:${phoneNumber}`
    try {
      window.location.href = telUrl
    } catch {
      return { success: false, message: 'Calling requires a phone or Android device.' }
    }
  }

  return {
    success: true,
    message: `Your phone app is being opened for ${contact.name}. This website cannot place a live call from a browser alone.`,
  }
}

export function sendEmergencyMessage(contact, messageText = 'Emergency alert from SmartShield. Please contact me as soon as possible.') {
  if (!contact) {
    return { success: false, message: 'No emergency contact selected.' }
  }

  const phoneNumber = normalizePhone(contact.phone)
  if (!phoneNumber) {
    return { success: false, message: 'Your messaging app is being opened. Please review and send the message.' }
  }

  if (typeof window !== 'undefined' && 'location' in window) {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(messageText)}`
    try {
      window.location.href = smsUrl
    } catch {
      return { success: false, message: 'Your messaging app is being opened. Please review and send the message.' }
    }
  }

  return {
    success: true,
    message: 'Your messaging app is being opened. Please review and send the message.',
  }
}
