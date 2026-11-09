const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function readResponse(response) {
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`)
  }

  return data
}

export const apiClient = {
  async get(url, options = {}) {
    const response = await fetch(`${DEFAULT_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    return readResponse(response)
  },

  async post(url, body, options = {}) {
    const response = await fetch(`${DEFAULT_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    })

    return readResponse(response)
  },
}

export function getApiBaseUrl() {
  return DEFAULT_BASE_URL
}
