import { NavLink } from 'react-router-dom'

const tabClass = ({ isActive }) =>
  `rounded-md px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
  }`

export default function CreativeStudioTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/marketing/creative/ideas" className={tabClass}>
        Ideas
      </NavLink>
      <NavLink to="/marketing/creative" end className={tabClass}>
        Briefs
      </NavLink>
      <NavLink to="/marketing/creative/videos" className={tabClass}>
        Videos
      </NavLink>
      <NavLink to="/marketing/creative/posts" className={tabClass}>
        Post
      </NavLink>
    </div>
  )
}
