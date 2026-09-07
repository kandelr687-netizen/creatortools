import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { useAuthStore } from '@/store/auth'
import { showError, showInfo } from '@/components/shared/Toaster'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { fetchProfile } = useAuthStore()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const profile = await fetchProfile()
      if (!profile) {
        await supabase.auth.signOut()
        showError('Your account profile is missing. Apply the latest Supabase migration, then try again.')
        return
      }
      if (profile.status !== 'active') {
        showInfo('Your account is not active. Please contact support.')
        await supabase.auth.signOut()
        return
      }
      navigate(profile.role === 'admin' ? '/admin' : (from || '/dashboard'))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to log in. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Log in to your Creators Point account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Login
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  )
}