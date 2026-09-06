import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { PointCard } from '@/components/shared/PointCard'
import { PageHeader, StatCard } from '@/components/shared/StatCard'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { PointTransaction } from '@/types'

const PAGE_SIZE = 15

const typeLabels: Record<string, string> = {
  submission_reward: 'Video approved',
  submission_rejection: 'Video rejected',
  withdrawal: 'Withdrawal approved',
  admin_adjustment: 'Admin adjustment',
  bonus: 'Admin bonus',
  penalty: 'Penalty',
}

export function PointsPage() {
  const { profile } = useAuthStore()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ earned: 0, deducted: 0 })

  useEffect(() => {
    loadTransactions()
  }, [page])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await supabase
        .from('point_transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      setTransactions(data || [])
      setTotal(count || 0)

      const { data: allTx } = await supabase
        .from('point_transactions')
        .select('amount')
      const all = allTx || []
      setStats({
        earned: all.filter((t) => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0),
        deducted: Math.abs(all.filter((t) => t.amount < 0).reduce((sum, t) => sum + Number(t.amount), 0)),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const points = profile?.points_balance ?? 0

  return (
    <div>
      <PageHeader
        title="Points"
        description="Your point balance and full transaction history. 1 point = NPR 1."
        action={<Link to="/dashboard/withdraw"><Button><Wallet className="h-4 w-4" /> Withdraw Points</Button></Link>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PointCard points={points} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Points Earned" value={stats.earned.toLocaleString()} variant="success" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Total Points Deducted" value={stats.deducted.toLocaleString()} variant="destructive" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Point History</h2>
        {loading ? (
          <LoadingState />
        ) : transactions.length === 0 ? (
          <EmptyState title="No point transactions yet." description="Approve and rejections will appear here." />
        ) : (
          <>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
                <span className="col-span-3">Date</span>
                <span className="col-span-4">Type</span>
                <span className="col-span-2">Points</span>
                <span className="col-span-3">Balance</span>
              </div>
              {transactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-2 md:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0">
                  <span className="col-span-1 md:col-span-3 text-xs text-muted-foreground">
                    {formatDateTime(tx.created_at)}
                  </span>
                  <span className="col-span-1 md:col-span-4 text-sm">
                    {typeLabels[tx.type] || tx.type}
                    {tx.description && <span className="text-xs text-muted-foreground block md:hidden">{tx.description}</span>}
                  </span>
                  <span className={`col-span-1 md:col-span-2 text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                  <span className="col-span-1 md:col-span-3 text-sm font-medium">
                    {tx.balance_before} → {tx.balance_after}
                  </span>
                </div>
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}