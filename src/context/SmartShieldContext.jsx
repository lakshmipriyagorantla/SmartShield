import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getAllProgress, markLessonComplete, setLessonProgress } from '../services/progressService'

const defaultAccessibility = {
  textSize: 'normal',
  contrast: 'standard',
  voice: true,
  reduceMotion: false,
}

const SmartShieldContext = createContext(null)

export function SmartShieldProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return localStorage.getItem('smartshield-language') || 'en'
  })

  const [accessibility, setAccessibility] = useState(() => {
    if (typeof window === 'undefined') return defaultAccessibility
    try {
      const stored = JSON.parse(localStorage.getItem('smartshield-accessibility') || 'null')
      return { ...defaultAccessibility, ...(stored || {}) }
    } catch {
      return defaultAccessibility
    }
  })

  const [lessonProgress, setLessonProgressState] = useState(() => getAllProgress())

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartshield-language', language)
    }
  }, [language])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartshield-accessibility', JSON.stringify(accessibility))
    }
  }, [accessibility])

  const refreshProgress = () => {
    setLessonProgressState(getAllProgress())
  }

  const updateLessonProgress = (lessonId, patch) => {
    const next = setLessonProgress(lessonId, patch)
    setLessonProgressState(next)
    return next
  }

  const completeLesson = (lessonId, lastPosition = 0) => {
    const next = markLessonComplete(lessonId, lastPosition)
    setLessonProgressState(next)
    return next
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      accessibility,
      setAccessibility,
      lessonProgress,
      refreshProgress,
      updateLessonProgress,
      markLessonComplete: completeLesson,
    }),
    [language, accessibility, lessonProgress],
  )

  return <SmartShieldContext.Provider value={value}>{children}</SmartShieldContext.Provider>
}

export function useSmartShield() {
  const context = useContext(SmartShieldContext)
  if (!context) {
    throw new Error('useSmartShield must be used within SmartShieldProvider')
  }
  return context
}
