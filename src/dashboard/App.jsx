import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import BusinessList from './pages/BusinessList'
import BusinessDetail from './pages/BusinessDetail'
import NewBusinessWizard from './pages/NewBusinessWizard'
import Users from './pages/Users'
import MerchProducts from './pages/merch/MerchProducts'
import MerchOrders from './pages/merch/MerchOrders'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Overview />} />
          <Route path="businesses" element={<BusinessList />} />
          <Route path="businesses/new" element={<NewBusinessWizard />} />
          <Route path="businesses/:id/*" element={<BusinessDetail />} />
          <Route path="merch/products" element={<MerchProducts />} />
          <Route path="merch/orders" element={<MerchOrders />} />
          <Route path="users" element={<Users />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
