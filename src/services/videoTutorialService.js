import { apiClient } from './apiClient'
import { fallbackVideoTutorials, getLocalizedTutorial } from '../data/videoTutorials'

export async function fetchVideoTutorials(language = 'en') {
  try {
    const data = await apiClient.get(`/api/video-tutorials?language=${encodeURIComponent(language)}`)
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({ ...item, title: item.title || '', description: item.description || '' }))
    }
  } catch {
    // Fallback to the local placeholder catalog when the backend is not reachable.
  }

  return fallbackVideoTutorials.map((item) => getLocalizedTutorial(item, language))
}

export async function fetchVideoTutorialById(id, language = 'en') {
  try {
    const data = await apiClient.get(`/api/video-tutorials/${encodeURIComponent(id)}?language=${encodeURIComponent(language)}`)
    if (data && data.id) {
      return data
    }
  } catch {
    // Fallback to the local placeholder catalog when the backend is not reachable.
  }

  const match = fallbackVideoTutorials.find((item) => item.id === id)
  return match ? getLocalizedTutorial(match, language) : null
}
