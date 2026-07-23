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
import OnlineStores from './pages/merch/OnlineStores'
import QrCodes from './pages/marketing/QrCodes'
import EducationResources from './pages/education/Resources'
import EducationTeachers from './pages/education/Teachers'
import EducationSessions from './pages/education/Sessions'
import EducationSettlements from './pages/education/Settlements'
import MyCourses from './pages/education/MyCourses'
import EducationAvailability from './pages/education/Availability'
import EducationStudents from './pages/education/Students'
import MyEarnings from './pages/education/MyEarnings'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function TeacherHomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'teacher') return <Navigate to="/education/my-courses" replace />
  return <Overview />
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
          <Route index element={<TeacherHomeRedirect />} />
          <Route path="businesses" element={<BusinessList />} />
          <Route path="businesses/new" element={<NewBusinessWizard />} />
          <Route path="businesses/:id/*" element={<BusinessDetail />} />
          <Route path="merch/stores" element={<OnlineStores />} />
          <Route path="merch/products" element={<MerchProducts />} />
          <Route path="merch/orders" element={<MerchOrders />} />
          <Route path="marketing/qr-codes" element={<QrCodes />} />
          <Route path="users" element={<Users />} />
          <Route path="education/resources" element={<EducationResources />} />
          <Route path="education/teachers" element={<EducationTeachers />} />
          <Route path="education/sessions" element={<EducationSessions />} />
          <Route path="education/settlements" element={<EducationSettlements />} />
          <Route path="education/my-courses" element={<MyCourses />} />
          <Route path="education/availability" element={<EducationAvailability />} />
          <Route path="education/students" element={<EducationStudents />} />
          <Route path="education/my-earnings" element={<MyEarnings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
