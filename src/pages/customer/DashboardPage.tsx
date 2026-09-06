import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send,
  ListChecks,
  Coins,
  Wallet,
  History,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { PointCard } from '@/components/shared/PointCard'
import { StatCard, QuickActionCard, PageHeader } from '@/components/shared/StatCard'

interface DashboardStats {
  totalSubmissions: number
  pending: number
  approved: number
  rejected: number
  pendingWithdrawals: number
}

export function CustomerDashboardPage() {
  const { profile, refreshProfile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingWithdrawals: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  useEffect(() => {
    refreshProfile()
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('id, status, category_id, video_url, notes, created_at')
        .order('created_at', { ascending: false })

      if (subError) throw subError

      const { data: wdData, error: wdError } = await supabase
        .from('withdrawals')
        .select('id, status')
        .eq('status', 'pending')

      if (wdError) throw wdError

      const subs = subData || []
      setStats({
        totalSubmissions: subs.length,
        pending: subs.filter((s) => s.status === 'pending').length,
        approved: subs.filter((s) => s.status === 'approved').length,
        rejected: subs.filter((s) => s.status === 'rejected').length,
        pendingWithdrawals: (wdData || []).length,
      })

      setRecentSubmissions(subs.slice(0, 5))

      const submissionIds = subs.slice(0, 5).map((s) => s.id)
      if (submissionIds.length > 0) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', subs.slice(0, 5).map((s) => s.category_id))
        const catMap = new Map((cats || []).map((c) => [c.id, c.name]))
        setRecentSubmissions(subs.slice(0, 5).map((s) => ({ ...s, categoryName: catMap.get(s.category_id) || 'Category' })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const points = profile?.points_balance ?? 0

  const quickActions = [
    { to: '/dashboard/submit', icon: Send, label: 'Submit Content', desc: 'Upload your video link' },
    { to: '/dashboard/submissions', icon: ListChecks, label: 'My Submissions', desc: 'Track your content status' },
    { to: '/dashboard/points', icon: Coins, label: 'Point History', desc: 'View your transactions' },
    { to: '/dashboard/withdraw', icon: Wallet, label: 'Withdraw', desc: 'Cash out your points' },
    { to: '/dashboard/withdrawals', icon: History, label: 'Withdrawal History', desc: 'Track withdrawals' },
    { to: '/dashboard/profile', icon: User, label: 'Profile', desc: 'Manage your account' },
  ]

  const statusIcon = {
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-50' },
    approved: { icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    rejected: { icon: XCircle, color: 'text-red-600 bg-red-50' },
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Creator'}!`}
        description="Here's an overview of your account."
      />

      {/* Points banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="md:col-span-1">
          <PointCard points={points} />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Pending Submissions"
            value={stats.pending}
            variant="warning"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Approved Submissions"
            value={stats.approved}
            variant="success"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            label="Rejected Submissions"
            value={stats.rejected}
            variant="destructive"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            variant="primary"
          />
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <QuickActionCard icon={<action.icon className="h-5 w-5" />} label={action.label} description={action.desc} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent submissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Submissions</h2>
          <Link to="/dashboard/submissions" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-3">No submissions yet.</p>
            <Link to="/dashboard/submit">
              <button className="text-sm font-medium text-primary hover:underline">
                Submit your first content →
              </button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {recentSubmissions.map((sub, i) => {
              const Icon = statusIcon[sub.status as keyof typeof statusIcon]?.icon || Clock
              const color = statusIcon[sub.status as keyof typeof statusIcon]?.color || 'text-muted-foreground bg-gray-50'
              return (
                <Link
                  key={sub.id}
                  to={`/dashboard/submissions/${sub.id}`}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors ${i > 0 ? 'border-t' : ''}`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.categoryName || 'Content Submission'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()} · {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{sub.status}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}