import { NavLink } from 'react-router-dom'

const tabClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`

export default function CreativeStudioTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/marketing/creative" end className={tabClass}>
        Briefs
      </NavLink>
      <NavLink to="/marketing/creative/themes" className={tabClass}>
        Themes
      </NavLink>
    </div>
  )
}
