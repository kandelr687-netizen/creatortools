import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { PageLoader } from '@/components/ui/loading'

export function ProtectedRoute() {
  const { profile, loading, fetchProfile } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (loading) {
      fetchProfile()
    }
  }, [loading, fetchProfile])

  if (loading) return <PageLoader />

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading, fetchProfile } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (loading) {
      fetchProfile()
    }
  }, [loading, fetchProfile])

  if (loading) return <PageLoader />

  if (!profile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { profile, loading } = useAuthStore()

  if (loading) return <PageLoader />

  if (profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return <Outlet />
}