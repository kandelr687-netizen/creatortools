import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert } from '@/components/ui/alert'
import { showError, showSuccess } from '@/components/shared/Toaster'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSettings, setCheckingSettings] = useState(true)
  const [registrationOpen, setRegistrationOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    supabase
      .from('site_settings')
      .select('registration_open')
      .limit(1)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (cancelled) return
          if (data && typeof data.registration_open === 'boolean') {
            setRegistrationOpen(data.registration_open)
          }
        },
        () => {
          if (cancelled) return
          setRegistrationOpen(true)
        },
      )
      .then(() => {
        if (!cancelled) setCheckingSettings(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      showError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, username },
        },
      })
      if (error) throw error

      showSuccess('Account created! You can now log in.')
      navigate('/login')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start earning points by creating content
        </p>
      </div>
      {checkingSettings ? null : !registrationOpen ? (
        <Alert variant="warning" className="mb-4">
          <p>Registration is currently closed by the administrator.</p>
        </Alert>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className={`space-y-4 bg-white rounded-xl border p-6 shadow-sm ${!checkingSettings && !registrationOpen ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            required
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            required
            placeholder="e.g. creative_creator"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Register
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}