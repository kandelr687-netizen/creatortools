import { useEffect, useState } from 'react'
import {
  Search, Check, X, QrCode, Eye,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { WithdrawalStatusBadge } from '@/components/shared/StatusBadge'
import { reviewWithdrawal } from '@/functions/adminActions'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { WithdrawalStatus } from '@/types'

const PAGE_SIZE = 10
type Tab = 'all' | WithdrawalStatus

interface DetailWithdrawal {
  id: string
  user_id: string
  amount: number
  payment_method: string
  account_details: string
  qr_image_url?: string
  note?: string
  status: WithdrawalStatus
  admin_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  creatorName?: string
  creatorUsername?: string
  creatorBalance?: number
  creatorEmail?: string
}

export function AdminWithdrawalsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [methods, setMethods] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<DetailWithdrawal[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [reviewWd, setReviewWd] = useState<DetailWithdrawal | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [confirmType, setConfirmType] = useState<'approve' | 'reject'>('approve')
  const [detailWd, setDetailWd] = useState<DetailWithdrawal | null>(null)

  useEffect(() => {
    supabase.from('payment_methods').select('name').then(({ data }) => setMethods(data || []))
  }, [])

  useEffect(() => {
    loadWithdrawals()
  }, [tab, search, methodFilter, page])

  const loadWithdrawals = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })

      if (tab !== 'all') query = query.eq('status', tab)
      if (search.trim()) query = query.or(`id.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%`)
      if (methodFilter) query = query.eq('payment_method', methodFilter)

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error

      const enriched = await enrichWithdrawals(data || [])
      setWithdrawals(enriched)
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enrichWithdrawals = async (wds: any[]): Promise<DetailWithdrawal[]> => {
    if (wds.length === 0) return []
    const userIds = wds.map((w) => w.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, email, points_balance')
      .in('id', userIds as string[])
    const userMap = new Map((profiles || []).map((u) => [u.id, u]))
    return wds.map((w) => ({
      ...w,
      creatorName: userMap.get(w.user_id)?.full_name || 'Unknown',
      creatorUsername: userMap.get(w.user_id)?.username || 'unknown',
      creatorBalance: userMap.get(w.user_id)?.points_balance,
      creatorEmail: userMap.get(w.user_id)?.email,
    }))
  }

  const openReview = (wd: DetailWithdrawal, type: 'approve' | 'reject') => {
    setReviewWd(wd)
    setConfirmType(type)
    setAdminNote(wd.admin_note || '')
  }

  const confirmReview = async () => {
    if (!reviewWd) return
    setReviewing(true)
    try {
      await reviewWithdrawal(reviewWd.id, confirmType, adminNote || undefined)
      showSuccess(confirmType === 'approve'
        ? `Approved! ${reviewWd.amount} points deducted from the creator's balance.`
        : 'Withdrawal rejected. No points were deducted.')
      setReviewWd(null)
      loadWithdrawals()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to process withdrawal')
    } finally {
      setReviewing(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Withdrawals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and process withdrawal requests.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by withdrawal ID or user..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }} className="sm:w-48">
          <option value="">All Methods</option>
          {methods.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : withdrawals.length === 0 ? (
        <EmptyState title="No withdrawals found." description="Withdrawals matching your filters will appear here." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Creator</span>
              <span className="col-span-2">Amount</span>
              <span className="col-span-2">Method</span>
              <span className="col-span-2">Requested</span>
              <span className="col-span-1">Balance</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {withdrawals.map((wd) => (
              <div key={wd.id} className="lg:grid lg:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-accent/40 transition-colors">
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium truncate">{wd.creatorName}</p>
                  <p className="text-xs text-muted-foreground">@{wd.creatorUsername}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{wd.id.slice(0, 8)}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-sm font-semibold">{wd.amount} pts</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(wd.amount)}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-sm">{wd.payment_method}</p>
                  <p className="text-xs text-muted-foreground truncate">{wd.account_details}</p>
                </div>
                <div className="lg:col-span-2 text-xs text-muted-foreground">
                  {formatDateTime(wd.created_at)}
                  {wd.reviewed_at && <p>Reviewed: {formatDateTime(wd.reviewed_at)}</p>}
                </div>
                <div className="lg:col-span-1">
                  <p className={`text-sm font-medium ${wd.creatorBalance != null && wd.creatorBalance < 0 ? 'text-red-600' : ''}`}>
                    {wd.creatorBalance?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <div className="lg:col-span-1">
                  <WithdrawalStatusBadge status={wd.status} />
                </div>
                <div className="lg:col-span-2 flex items-center justify-end gap-2 mt-2 lg:mt-0">
                  <button onClick={() => setDetailWd(wd)} className="text-muted-foreground hover:text-foreground" title="View details">
                    <Eye className="h-4 w-4" />
                  </button>
                  {wd.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => openReview(wd, 'approve')}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openReview(wd, 'reject')}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Review modal */}
      <Modal
        open={!!reviewWd}
        onClose={() => setReviewWd(null)}
        title={confirmType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
        description={reviewWd ? `${reviewWd.id.slice(0, 8)} · ${reviewWd.creatorName} · ${reviewWd.amount} points` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewWd(null)} disabled={reviewing}>
              Cancel
            </Button>
            <Button
              variant={confirmType === 'approve' ? 'success' : 'destructive'}
              onClick={confirmReview}
              loading={reviewing}
            >
              {confirmType === 'approve' ? 'Confirm & Approve' : 'Confirm & Reject'}
            </Button>
          </>
        }
      >
        {reviewWd && (
          <div className="space-y-4">
            <Alert variant={confirmType === 'approve' ? 'warning' : 'info'}>
              {confirmType === 'approve'
                ? `Approving this withdrawal will deduct ${reviewWd.amount} points (${formatCurrency(reviewWd.amount)}) from the creator's balance.`
                : 'Rejecting this withdrawal will NOT deduct any points.'}
            </Alert>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment method</span>
                <span className="font-medium">{reviewWd.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account details</span>
                <span className="font-medium">{reviewWd.account_details}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-medium">{reviewWd.creatorBalance?.toLocaleString()} pts</span>
              </div>
            </div>
            {reviewWd.qr_image_url && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4" /> Payment QR Code
                </p>
                <img src={reviewWd.qr_image_url} alt="Payment QR" className="h-36 w-36 object-cover rounded-xl border" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Note (optional)</label>
              <Textarea
                rows={3}
                placeholder="Note to the creator"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailWd}
        onClose={() => setDetailWd(null)}
        title="Withdrawal Details"
        size="lg"
      >
        {detailWd && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Withdrawal ID</p>
                <p className="font-mono">{detailWd.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <WithdrawalStatusBadge status={detailWd.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p>{detailWd.creatorName} (@{detailWd.creatorUsername})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{detailWd.creatorEmail || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold text-lg">{detailWd.amount} pts ({formatCurrency(detailWd.amount)})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p>{detailWd.creatorBalance?.toLocaleString()} pts</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment method</p>
              <p className="font-medium">{detailWd.payment_method}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account details</p>
              <p className="bg-muted rounded-lg p-3">{detailWd.account_details}</p>
            </div>
            {detailWd.qr_image_url && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">QR Code</p>
                <img src={detailWd.qr_image_url} alt="QR" className="h-32 w-32 object-cover rounded-xl border" />
              </div>
            )}
            {detailWd.note && (
              <div>
                <p className="text-xs text-muted-foreground">Creator's note</p>
                <p className="bg-muted rounded-lg p-3">{detailWd.note}</p>
              </div>
            )}
            {detailWd.admin_note && (
              <div>
                <p className="text-xs text-muted-foreground">Admin note</p>
                <p className="bg-muted rounded-lg p-3">{detailWd.admin_note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}