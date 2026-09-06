import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { showError, showSuccess } from '@/components/shared/Toaster'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      showSuccess('Password reset email sent!')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send you a reset link
        </p>
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
        <Button type="submit" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>
      {sent && (
        <p className="text-sm text-green-600 mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
          If an account exists with that email, a password reset link has been sent. Check your inbox.
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/login" className="text-primary font-medium hover:underline">
          ← Back to login
        </Link>
      </p>
    </AuthLayout>
  )
}