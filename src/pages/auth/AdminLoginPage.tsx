import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'
import { showError } from '@/components/shared/Toaster'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const profile = await fetchProfile()
      if (!profile || profile.role !== 'admin') {
        showError('Access denied. This area is restricted to administrators.')
        await supabase.auth.signOut()
        return
      }
      navigate('/admin')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-slate-400">Creators Point</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-slate-300">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                required
                placeholder="admin@creatorspoint.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-slate-300">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                required
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              <Shield className="h-4 w-4" />
              Access Admin
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized personnel only. All actions are logged.
        </p>
      </div>
    </div>
  )
}