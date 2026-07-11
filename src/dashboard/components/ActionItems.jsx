import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export default function ActionItems() {
  const [items, setItems] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api('/api/action-items')
      .then(({ items }) => setItems(items))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(load, [load])

  const toggle = async (item) => {
    try {
      await api(`/api/action-items/${item.id}`, { method: 'PATCH', body: { done: !item.done } })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const add = async () => {
    if (!newTitle.trim()) return
    try {
      await api('/api/action-items', { method: 'POST', body: { title: newTitle.trim() } })
      setNewTitle('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      await api(`/api/action-items/${item.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!items) return null
  const open = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  return (
    <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Go-live checklist
          {open.length > 0 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {open.length} open
            </span>
          )}
        </h2>
        {done.length > 0 && (
          <button onClick={() => setShowDone(!showDone)} className="text-xs text-gray-400 hover:text-gray-600">
            {showDone ? 'Hide' : 'Show'} {done.length} completed
          </button>
        )}
      </div>

      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {open.length === 0 && <div className="text-sm text-gray-400">Nothing outstanding. 🎉</div>}

      <ul className="space-y-2">
        {[...open, ...(showDone ? done : [])].map((item) => (
          <li key={item.id} className="group flex items-start gap-3 rounded-md border border-gray-100 p-3">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item)}
              className="mt-1 h-4 w-4 cursor-pointer"
            />
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {item.title}
              </div>
              {item.description && !item.done && (
                <div className="mt-0.5 text-xs text-gray-500">{item.description}</div>
              )}
              {item.url && !item.done && (
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-xs text-brand-600 hover:underline">
                  Open →
                </a>
              )}
            </div>
            <button
              onClick={() => remove(item)}
              className="hidden text-xs text-red-500 hover:underline group-hover:block"
            >
              delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add an action item…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!newTitle.trim()}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </section>
  )
}
