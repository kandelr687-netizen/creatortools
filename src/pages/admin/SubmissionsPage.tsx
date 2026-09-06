import { useEffect, useState } from 'react'
import {
  Search, ExternalLink, Check, X, Eye, FileText,
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
import { SubmissionStatusBadge } from '@/components/shared/StatusBadge'
import { reviewSubmission } from '@/functions/adminActions'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { formatDateTime, formatPoints } from '@/lib/utils'
import type { SubmissionStatus } from '@/types'

const PAGE_SIZE = 10
type Tab = 'all' | SubmissionStatus

interface DetailedSubmission {
  id: string
  user_id: string
  category_id: string
  campaign_id?: string
  video_url: string
  notes?: string
  status: SubmissionStatus
  admin_note?: string
  reward_points?: number
  deduction_points?: number
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  categoryName?: string
  campaignTitle?: string
  creatorName?: string
  creatorUsername?: string
}

export function AdminSubmissionsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<DetailedSubmission[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Review modal
  const [reviewSub, setReviewSub] = useState<DetailedSubmission | null>(null)
  const [points, setPoints] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Confirmation
  const [confirmState, setConfirmState] = useState<{
    type: 'approve' | 'reject'
    open: boolean
  }>({ type: 'approve', open: false })

  // Detail modal
  const [detailSub, setDetailSub] = useState<DetailedSubmission | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadSubmissions()
  }, [tab, search, categoryFilter, page])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('sort_order')
    setCategories(data || [])
  }

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('submissions')
        .select('*', { count: 'exact' })

      if (tab !== 'all') query = query.eq('status', tab)

      if (search.trim()) {
        query = query.or(`id.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%`)
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter)
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const enriched = await enrichSubmissions(data || [])
      setSubmissions(enriched)
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enrichSubmissions = async (subs: any[]): Promise<DetailedSubmission[]> => {
    if (subs.length === 0) return []
    const userIds = subs.map((s) => s.user_id)
    const catIds = subs.map((s) => s.category_id).filter(Boolean)
    const campIds = subs.map((s) => s.campaign_id).filter(Boolean)

    const [profilesRes, catsRes, campsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username').in('id', userIds as string[]),
      supabase.from('categories').select('id, name').in('id', catIds as string[]),
      campIds.length > 0 ? supabase.from('campaigns').select('id, title').in('id', campIds as string[]) : Promise.resolve({ data: [] }),
    ])

    const userMap = new Map((profilesRes.data || []).map((u) => [u.id, u]))
    const catMap = new Map((catsRes.data || []).map((c) => [c.id, c.name]))
    const campMap = new Map((campsRes.data || []).map((c) => [c.id, c.title]))

    return subs.map((s) => ({
      ...s,
      categoryName: catMap.get(s.category_id) || 'General',
      campaignTitle: s.campaign_id ? campMap.get(s.campaign_id) : undefined,
      creatorName: userMap.get(s.user_id)?.full_name || 'Unknown',
      creatorUsername: userMap.get(s.user_id)?.username || 'unknown',
    }))
  }

  const openReview = (sub: DetailedSubmission, type: 'approve' | 'reject') => {
    setReviewSub(sub)
    setPoints(type === 'approve' ? '50' : '20')
    setAdminNote('')
    setConfirmState({ type, open: true })
  }

  const confirmAndReview = async () => {
    if (!reviewSub) return
    const amt = Number(points)
    if (!amt || amt < 0) {
      showError('Please enter a valid points value.')
      return
    }
    setReviewing(true)
    try {
      await reviewSubmission(reviewSub.id, confirmState.type, amt, adminNote || undefined)
      showSuccess(confirmState.type === 'approve'
        ? `Approved! +${amt} points added to ${reviewSub.creatorName}'s account.`
        : `Rejected! ${amt} points deducted from ${reviewSub.creatorName}'s account.`)
      setConfirmState({ type: confirmState.type, open: false })
      setReviewSub(null)
      loadSubmissions()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to review submission')
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
          <h1 className="text-2xl font-bold">Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Review content submissions and manage rewards.</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by submission ID or user..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="sm:w-48">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : submissions.length === 0 ? (
        <EmptyState title="No submissions found." description="Submissions matching your filters will appear here." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Creator</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-3">Video</span>
              <span className="col-span-2">Submitted</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {submissions.map((sub) => (
              <div key={sub.id} className="lg:grid lg:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-accent/40 transition-colors">
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium truncate">{sub.creatorName}</p>
                  <p className="text-xs text-muted-foreground">@{sub.creatorUsername}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{sub.id.slice(0, 8)}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-sm">{sub.categoryName}</p>
                  {sub.campaignTitle && <p className="text-xs text-muted-foreground truncate">{sub.campaignTitle}</p>}
                </div>
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={sub.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Open Video
                    </a>
                    <button onClick={() => setDetailSub(sub)} className="text-muted-foreground hover:text-foreground" title="View details">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  {sub.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{sub.notes}</p>}
                </div>
                <div className="lg:col-span-2 text-xs text-muted-foreground">
                  {formatDateTime(sub.created_at)}
                  {sub.reviewed_at && <p className="text-xs">Reviewed: {formatDateTime(sub.reviewed_at)}</p>}
                </div>
                <div className="lg:col-span-1">
                  <SubmissionStatusBadge status={sub.status} />
                </div>
                <div className="lg:col-span-2 flex justify-end gap-2 mt-2 lg:mt-0">
                  {sub.status === 'pending' ? (
                    <>
                      <Button size="sm" variant="success" onClick={() => openReview(sub, 'approve')}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openReview(sub, 'reject')}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      {sub.reward_points != null && <span className="text-green-600 font-medium">+{formatPoints(sub.reward_points)}</span>}
                      {sub.deduction_points != null && <span className="text-red-600 font-medium">−{formatPoints(sub.deduction_points)}</span>}
                    </div>
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
        open={!!reviewSub && confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        title={confirmState.type === 'approve' ? 'Approve Submission' : 'Reject Submission'}
        description={reviewSub ? `Reviewing: ${reviewSub.id.slice(0, 8)} by ${reviewSub.creatorName}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmState((s) => ({ ...s, open: false }))} disabled={reviewing}>
              Cancel
            </Button>
            <Button
              variant={confirmState.type === 'approve' ? 'success' : 'destructive'}
              onClick={confirmAndReview}
              loading={reviewing}
            >
              {confirmState.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant={confirmState.type === 'approve' ? 'success' : 'warning'}>
            {confirmState.type === 'approve'
              ? 'Approve this content and add the reward points to the creator\'s account?'
              : 'Reject this content and deduct the points from the creator\'s account? Negative balances are allowed.'}
          </Alert>
          {reviewSub && (
            <a href={reviewSub.video_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2 mb-2">
                <ExternalLink className="h-4 w-4" /> Open Video
              </Button>
            </a>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {confirmState.type === 'approve' ? 'Reward Points' : 'Deduction Points'}
            </label>
            <Input
              type="number"
              min="0"
              placeholder={confirmState.type === 'approve' ? 'e.g. 50' : 'e.g. 20'}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {confirmState.type === 'approve'
                ? `Adding ${points || '0'} points to the creator's account.`
                : `Deducting ${points || '0'} points. Negative balances are allowed.`}
            </p>
          </div>
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
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailSub}
        onClose={() => setDetailSub(null)}
        title="Submission Details"
        size="lg"
      >
        {detailSub && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Submission ID</p>
                <p className="font-mono">{detailSub.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <SubmissionStatusBadge status={detailSub.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p>{detailSub.creatorName} (@{detailSub.creatorUsername})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p>{formatDateTime(detailSub.created_at)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Video URL</p>
              <a href={detailSub.video_url} target="_blank" rel="noopener noreferrer" className="text-primary break-all hover:underline">
                {detailSub.video_url}
              </a>
            </div>
            {detailSub.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Creator's note</p>
                <p className="bg-muted rounded-lg p-3">{detailSub.notes}</p>
              </div>
            )}
            {detailSub.admin_note && (
              <div>
                <p className="text-xs text-muted-foreground">Admin note</p>
                <p className="bg-muted rounded-lg p-3">{detailSub.admin_note}</p>
              </div>
            )}
            {(detailSub.reward_points != null || detailSub.deduction_points != null) && (
              <div className="flex gap-6">
                {detailSub.reward_points != null && (
                  <span className="text-green-600 font-semibold">Reward: +{detailSub.reward_points} pts</span>
                )}
                {detailSub.deduction_points != null && (
                  <span className="text-red-600 font-semibold">Deduction: −{detailSub.deduction_points} pts</span>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}