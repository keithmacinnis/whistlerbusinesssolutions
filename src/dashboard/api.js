// Fetch wrapper for the commerce-server API. Same base-URL convention as
// src/shop.js; attaches the dashboard JWT and normalizes errors.
const API_BASE = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com'

export const TOKEN_KEY = 'wbs_dash_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }
  const token = getToken()
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // non-JSON response body
  }

  if (res.status === 401) {
    clearToken()
    if (!window.location.pathname.endsWith('/login')) {
      window.location.assign('/dashboard/login')
    }
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data)
  }
  return data
}
