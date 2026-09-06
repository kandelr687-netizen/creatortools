import { useEffect, useState } from 'react'
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/shared/StatCard'
import { formatDateTime } from '@/lib/utils'
import type { TransactionType } from '@/types'

const PAGE_SIZE = 15

const typeLabels: Record<string, string> = {
  submission_reward: 'Submission Reward',
  submission_rejection: 'Submission Rejection',
  withdrawal: 'Withdrawal',
  admin_adjustment: 'Admin Adjustment',
  bonus: 'Bonus',
  penalty: 'Penalty',
}

interface TxRow {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  description?: string
  created_at: string
  username?: string
  full_name?: string
}

export function AdminPointsPage() {
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [search, typeFilter, page])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('point_transactions')
        .select('*', { count: 'exact' })

      if (typeFilter) query = query.eq('type', typeFilter)
      if (search.trim()) query = query.or(`user_id.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`)

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error

      const enriched = await enrichTransactions(data || [])
      setTransactions(enriched)
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enrichTransactions = async (txs: any[]): Promise<TxRow[]> => {
    if (txs.length === 0) return []
    const userIds = txs.map((t) => t.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', userIds as string[])
    const userMap = new Map((profiles || []).map((u) => [u.id, u]))
    return txs.map((t) => ({
      ...t,
      username: userMap.get(t.user_id)?.username,
      full_name: userMap.get(t.user_id)?.full_name,
    }))
  }

  return (
    <div>
      <PageHeader
        title="Point Transactions"
        description="Complete point ledger across all users."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or description..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="sm:w-52">
          <option value="">All Types</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : transactions.length === 0 ? (
        <EmptyState title="No transactions found." description="Point transactions will appear here." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Date</span>
              <span className="col-span-2">User</span>
              <span className="col-span-3">Type</span>
              <span className="col-span-1">Amount</span>
              <span className="col-span-2">Balance</span>
              <span className="col-span-2">Description</span>
            </div>
            {transactions.map((tx) => (
              <div key={tx.id} className="lg:grid lg:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-accent/40 transition-colors">
                <span className="lg:col-span-2 text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</span>
                <span className="lg:col-span-2 text-sm">
                  <span className="font-medium truncate block">{tx.full_name || '—'}</span>
                  <span className="text-xs text-muted-foreground">@{tx.username || 'unknown'}</span>
                </span>
                <span className="lg:col-span-3 text-sm">{typeLabels[tx.type] || tx.type}</span>
                <span className={`lg:col-span-1 text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? <span className="inline-flex items-center gap-0.5"><ArrowUpRight className="h-3.5 w-3.5" />+{tx.amount}</span> : <span className="inline-flex items-center gap-0.5"><ArrowDownRight className="h-3.5 w-3.5" />{tx.amount}</span>}
                </span>
                <span className="lg:col-span-2 text-sm">{tx.balance_before} → {tx.balance_after}</span>
                <span className="lg:col-span-2 text-xs text-muted-foreground truncate">{tx.description || '—'}</span>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}