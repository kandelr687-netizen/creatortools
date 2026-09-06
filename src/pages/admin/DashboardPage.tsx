import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Inbox, Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Wallet, CalendarRange, Loader2, FolderTree, Coins,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatCard, QuickActionCard, PageHeader } from '@/components/shared/StatCard'
import { EventStatusBadge } from '@/components/shared/StatusBadge'
import { formatPoints } from '@/lib/utils'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalSubmissions: number
  pendingSubmissions: number
  approvedSubmissions: number
  rejectedSubmissions: number
  totalAwarded: number
  totalDeducted: number
  totalWithdrawals: number
  pendingWithdrawals: number
  approvedWithdrawals: number
  totalWithdrawn: number
  eventOpen: boolean
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    totalAwarded: 0,
    totalDeducted: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    approvedWithdrawals: 0,
    totalWithdrawn: 0,
    eventOpen: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [
        usersRes, activeRes, subsRes, awardedRes, deductedRes,
        wdRes, pendingWdRes, approvedWdRes, withdrawnRes, eventRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('submissions').select('status'),
        supabase.from('point_transactions').select('amount').gt('amount', 0),
        supabase.from('point_transactions').select('amount').lt('amount', 0),
        supabase.from('withdrawals').select('status'),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('point_transactions').select('amount').eq('type', 'withdrawal'),
        supabase.from('submission_events').select('is_open').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      const subs = subsRes.data || []
      const awarded = awardedRes.data?.reduce((s, t) => s + Number(t.amount), 0) || 0
      const deducted = Math.abs((deductedRes.data || []).reduce((s, t) => s + Number(t.amount), 0))
      const withdrawn = Math.abs((withdrawnRes.data || []).reduce((s, t) => s + Number(t.amount), 0))
      const totalWd = wdRes.data || []
      const d = (data: any[]) => {
        return {
          pending: data.filter((x) => x.status === 'pending').length,
          approved: data.filter((x) => x.status === 'approved').length,
          rejected: data.filter((x) => x.status === 'rejected').length,
        }
      }

      setStats({
        totalUsers: usersRes.count || 0,
        activeUsers: activeRes.count || 0,
        totalSubmissions: subs.length,
        pendingSubmissions: d(subs).pending,
        approvedSubmissions: d(subs).approved,
        rejectedSubmissions: d(subs).rejected,
        totalAwarded: awarded,
        totalDeducted: deducted,
        totalWithdrawals: totalWd.length,
        pendingWithdrawals: pendingWdRes.count || 0,
        approvedWithdrawals: approvedWdRes.count || 0,
        totalWithdrawn: withdrawn,
        eventOpen: !!eventRes.data?.is_open,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of the Creators Point platform."
        action={<EventStatusBadge isOpen={stats.eventOpen} />}
      />

      {/* Priority cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Inbox className="h-5 w-5" />}
          label="Pending Submissions"
          value={stats.pendingSubmissions}
          variant="warning"
          sub="Need review"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          variant="primary"
          sub="Need processing"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Users"
          value={stats.totalUsers}
          sub={`${stats.activeUsers} active`}
        />
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Total Points Issued"
          value={formatPoints(stats.totalAwarded)}
          variant="success"
          sub={`${formatPoints(stats.totalDeducted)} deducted`}
        />
      </div>

      {/* Quick buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Link to="/admin/submissions"><QuickActionCard icon={<Inbox className="h-5 w-5" />} label="Review Submissions" description={`${stats.pendingSubmissions} pending`} /></Link>
        <Link to="/admin/withdrawals"><QuickActionCard icon={<Wallet className="h-5 w-5" />} label="Review Withdrawals" description={`${stats.pendingWithdrawals} pending`} /></Link>
        <Link to="/admin/events"><QuickActionCard icon={<CalendarRange className="h-5 w-5" />} label="Manage Event" description={stats.eventOpen ? 'Currently OPEN' : 'Currently CLOSED'} /></Link>
        <Link to="/admin/categories"><QuickActionCard icon={<FolderTree className="h-5 w-5" />} label="Manage Categories" description="Configure rewards" /></Link>
      </div>

      {/* Extended stats */}
      <h2 className="text-lg font-semibold mb-4">Detailed Statistics</h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={stats.totalUsers} sub={`${stats.activeUsers} active`} />
        <StatCard icon={<Inbox className="h-5 w-5" />} label="Submissions" value={stats.totalSubmissions} sub={`${stats.pendingSubmissions} pending`} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Approved" value={stats.approvedSubmissions} variant="success" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Rejected" value={stats.rejectedSubmissions} variant="destructive" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Points Awarded" value={formatPoints(stats.totalAwarded)} variant="success" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Points Deducted" value={formatPoints(stats.totalDeducted)} variant="destructive" />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Withdrawal Requests" value={stats.totalWithdrawals} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pending Withdrawals" value={stats.pendingWithdrawals} variant="warning" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Approved Withdrawals" value={stats.approvedWithdrawals} variant="success" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Points Withdrawn" value={formatPoints(stats.totalWithdrawn)} variant="warning" />
        <StatCard icon={<CalendarRange className="h-5 w-5" />} label="Event Status" value={stats.eventOpen ? 'Open' : 'Closed'} variant={stats.eventOpen ? 'success' : 'destructive'} />
      </motion.div>
    </div>
  )
}