import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { SubmissionStatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/shared/StatCard'
import type { SubmissionStatus } from '@/types'

type Filter = 'all' | SubmissionStatus

const PAGE_SIZE = 10

export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [filter, search, page])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('submissions')
        .select('id, category_id, video_url, status, admin_note, reward_points, deduction_points, created_at', { count: 'exact' })

      if (filter !== 'all') query = query.eq('status', filter)

      if (search.trim()) {
        query = query.or(`id.ilike.%${search.trim()}%`)
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (data && data.length > 0) {
        const catIds = data.map((s) => s.category_id).filter(Boolean)
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', catIds as string[])
        const catMap = new Map((cats || []).map((c) => [c.id, c.name]))
        setSubmissions(data.map((s) => ({ ...s, categoryName: catMap.get(s.category_id) || 'General' })))
      } else {
        setSubmissions([])
      }
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
        title="My Submissions"
        description="Track the status of all your submitted content."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by submission ID..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(1) }} className="sm:w-48">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet."
          description="Submit your first content to start earning points."
          action={<Link to="/dashboard/submit"><Button>Submit Content</Button></Link>}
        />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Submission ID</span>
              <span className="col-span-3">Category</span>
              <span className="col-span-2">Submitted</span>
              <span className="col-span-2">Points</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1"></span>
            </div>
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                to={`/dashboard/submissions/${sub.id}`}
                className="grid grid-cols-2 md:grid-cols-12 items-center gap-2 px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-0"
              >
                <span className="col-span-1 md:col-span-2 text-xs font-mono truncate">{sub.id.slice(0, 8)}</span>
                <span className="md:col-span-3 text-sm font-medium truncate">{sub.categoryName}</span>
                <span className="md:col-span-2 text-sm text-muted-foreground">{formatDate(sub.created_at)}</span>
                <span className="md:col-span-2 text-sm">
                  {sub.reward_points && <span className="text-green-600 font-medium">+{sub.reward_points}</span>}
                  {sub.deduction_points && <span className="text-red-600 font-medium">−{sub.deduction_points}</span>}
                  {!sub.reward_points && !sub.deduction_points && <span className="text-muted-foreground">—</span>}
                </span>
                <span className="col-span-1 md:col-span-2"><SubmissionStatusBadge status={sub.status} /></span>
                <span className="md:col-span-1 text-right text-sm text-primary">View →</span>
              </Link>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}