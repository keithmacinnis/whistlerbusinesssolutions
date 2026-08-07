import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'wbs_view_as_ambassador'
const listeners = new Set()

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id) return null
    return parsed
  } catch {
    return null
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

const ViewAsAmbassadorContext = createContext(null)

export function ViewAsAmbassadorProvider({ children }) {
  const [viewAs, setViewAsState] = useState(readStored)

  useEffect(() => {
    const sync = () => setViewAsState(readStored())
    listeners.add(sync)
    return () => listeners.delete(sync)
  }, [])

  const startViewAs = useCallback((ambassador) => {
    const next = {
      id: ambassador.id,
      name: ambassador.displayName || ambassador.user?.name || null,
      email: ambassador.user?.email || null,
      code: ambassador.code || null,
      status: ambassador.status || null,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setViewAsState(next)
    notifyListeners()
  }, [])

  const clearViewAs = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setViewAsState(null)
    notifyListeners()
  }, [])

  const value = useMemo(
    () => ({ viewAs, startViewAs, clearViewAs }),
    [viewAs, startViewAs, clearViewAs],
  )

  return (
    <ViewAsAmbassadorContext.Provider value={value}>
      {children}
    </ViewAsAmbassadorContext.Provider>
  )
}

export function useViewAsAmbassador() {
  const ctx = useContext(ViewAsAmbassadorContext)
  if (!ctx) {
    return { viewAs: null, startViewAs: () => {}, clearViewAs: () => {} }
  }
  return ctx
}

export function getViewAsAmbassadorId() {
  return readStored()?.id || null
}

export function clearViewAsAmbassadorStorage() {
  sessionStorage.removeItem(STORAGE_KEY)
  notifyListeners()
}
