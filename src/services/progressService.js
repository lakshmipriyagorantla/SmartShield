import { tutorials } from '../data/tutorials'

const STORAGE_KEY = 'smartshield-lesson-progress'
const defaultRecord = { progress: 0, completed: false, lastPosition: 0 }

function safeRead() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function safeWrite(data) {
  if (typeof window === 'undefined') return data

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

export function getLessonProgress(lessonId) {
  const all = safeRead()
  const current = all[lessonId]
  return current ? { ...defaultRecord, ...current } : { ...defaultRecord }
}

export function setLessonProgress(lessonId, update) {
  const all = safeRead()
  const current = all[lessonId] || { ...defaultRecord }
  const nextProgress = Number(update?.progress ?? current.progress ?? 0)
  const safeProgress = Math.max(0, Math.min(100, Number.isFinite(nextProgress) ? nextProgress : 0))
  const nextRecord = {
    ...defaultRecord,
    ...current,
    progress: safeProgress,
    completed: Boolean(update?.completed ?? safeProgress >= 100),
    lastPosition: Number(update?.lastPosition ?? current.lastPosition ?? 0),
  }

  if (safeProgress >= 100) {
    nextRecord.completed = true
    nextRecord.progress = 100
  }

  all[lessonId] = nextRecord
  return safeWrite(all)
}

export function markLessonComplete(lessonId, lastPosition = 0) {
  const all = safeRead()
  const current = all[lessonId] || { ...defaultRecord }
  all[lessonId] = {
    ...defaultRecord,
    ...current,
    progress: 100,
    completed: true,
    lastPosition: Number(lastPosition || current.lastPosition || 0),
  }

  return safeWrite(all)
}

export function isLessonComplete(lessonId) {
  const current = getLessonProgress(lessonId)
  return Boolean(current.completed) || current.progress >= 100
}

export function getAllProgress() {
  return safeRead()
}

export function getCourseProgress(category, language = 'en') {
  const items = category ? tutorials.filter((t) => t.category === category) : tutorials
  const total = items.length

  if (!total) {
    return { total: 0, completed: 0, progress: 0, language }
  }

  const completed = items.filter((lesson) => isLessonComplete(lesson.id)).length

  return {
    total,
    completed,
    progress: Math.round((completed / total) * 100),
    language,
  }
}

export function resetProgress() {
  return safeWrite({})
}
