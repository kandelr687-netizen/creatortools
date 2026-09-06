import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading'
import { WithdrawalStatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/utils'
import { PageHeader } from '@/components/shared/StatCard'
import type { Withdrawal, WithdrawalStatus } from '@/types'

const PAGE_SIZE = 10
type Filter = 'all' | WithdrawalStatus

export function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWithdrawals()
  }, [filter, page])

  const loadWithdrawals = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })
      if (filter !== 'all') query = query.eq('status', filter)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      setWithdrawals(data || [])
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Withdrawal History"
        description="Track the status of your withdrawal requests."
        action={<Link to="/dashboard/withdraw"><Button><Wallet className="h-4 w-4" /> New Withdrawal</Button></Link>}
      />

      <div className="mb-6">
        <Select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(1) }} className="sm:w-48">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : withdrawals.length === 0 ? (
        <EmptyState
          title="No withdrawal requests yet."
          description="Submit a withdrawal request to convert your points to cash."
          action={<Link to="/dashboard/withdraw"><Button>Withdraw Points</Button></Link>}
        />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Withdrawal ID</span>
              <span className="col-span-2">Amount</span>
              <span className="col-span-2">Method</span>
              <span className="col-span-2">Requested</span>
              <span className="col-span-2">Reviewed</span>
              <span className="col-span-2">Status</span>
            </div>
            {withdrawals.map((wd) => (
              <div key={wd.id} className="grid grid-cols-2 md:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0">
                <span className="col-span-1 md:col-span-2 text-xs font-mono">{wd.id.slice(0, 8)}</span>
                <span className="md:col-span-2 text-sm font-semibold">{wd.amount} pts</span>
                <span className="md:col-span-2 text-sm">{wd.payment_method}</span>
                <span className="md:col-span-2 text-xs text-muted-foreground">{formatDateTime(wd.created_at)}</span>
                <span className="md:col-span-2 text-xs text-muted-foreground">{wd.reviewed_at ? formatDateTime(wd.reviewed_at) : '—'}</span>
                <span className="col-span-1 md:col-span-2"><WithdrawalStatusBadge status={wd.status} /></span>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}