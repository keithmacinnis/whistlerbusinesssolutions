import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

const navLinkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-56 flex-col bg-gray-900 p-4">
        <div className="mb-6 px-3">
          <div className="text-lg font-bold text-white">WBS Dashboard</div>
          <div className="text-xs text-gray-400">Voice Platform</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>Overview</NavLink>
          <NavLink to="/businesses" className={navLinkClass}>Businesses</NavLink>
          <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Merch Shop
          </div>
          <NavLink to="/merch/products" className={navLinkClass}>Products</NavLink>
          <NavLink to="/merch/orders" className={navLinkClass}>Orders</NavLink>
          {user?.role === 'super_admin' && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admin
              </div>
              <NavLink to="/users" className={navLinkClass}>Users</NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-gray-800 pt-3">
          <div className="truncate px-3 text-sm text-gray-300">{user?.email || user?.name}</div>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
