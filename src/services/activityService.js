const STORAGE_KEY = 'smartshield-activity-log'

export function getRecentActivity() {
  if (typeof window === 'undefined') return []

  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function addActivity(entry) {
  const history = getRecentActivity()
  const next = [{ id: crypto?.randomUUID?.() || `activity-${Date.now()}`, createdAt: new Date().toISOString(), ...entry }, ...history].slice(0, 12)

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return next
}

export function clearActivity() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  }

  return []
}
