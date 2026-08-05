import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'wbs_view_as_teacher'
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

const ViewAsTeacherContext = createContext(null)

export function ViewAsTeacherProvider({ children }) {
  const [viewAs, setViewAsState] = useState(readStored)

  useEffect(() => {
    const sync = () => setViewAsState(readStored())
    listeners.add(sync)
    return () => listeners.delete(sync)
  }, [])

  const startViewAs = useCallback((teacher) => {
    const next = {
      id: teacher.id,
      name: teacher.user?.name || null,
      email: teacher.user?.email || null,
      status: teacher.status || null,
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
    <ViewAsTeacherContext.Provider value={value}>
      {children}
    </ViewAsTeacherContext.Provider>
  )
}

export function useViewAsTeacher() {
  const ctx = useContext(ViewAsTeacherContext)
  if (!ctx) {
    return { viewAs: null, startViewAs: () => {}, clearViewAs: () => {} }
  }
  return ctx
}

/** Sync read for the API client (outside React). */
export function getViewAsTeacherId() {
  return readStored()?.id || null
}

export function clearViewAsTeacherStorage() {
  sessionStorage.removeItem(STORAGE_KEY)
  notifyListeners()
}
