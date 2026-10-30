const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

export const apiClient = {
  async get(url, options = {}) {
    const baseUrl = DEFAULT_BASE_URL
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return response.json().catch(() => ({}))
  },

  async post(url, body, options = {}) {
    const baseUrl = DEFAULT_BASE_URL
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return response.json().catch(() => ({}))
  },
}

export function getApiBaseUrl() {
  return DEFAULT_BASE_URL || 'local-demo'
}
