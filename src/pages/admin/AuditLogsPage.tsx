import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 15

interface LogRow {
  id: string
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  description?: string
  metadata?: any
  created_at: string
  adminName?: string
}

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [search, actionFilter, page])

  const loadLogs = async () => {
    setLoading(true)
    try {
      let query = supabase.from('admin_logs').select('*', { count: 'exact' })
      if (actionFilter) query = query.eq('action', actionFilter)
      if (search.trim()) query = query.or(`description.ilike.%${search.trim()}%,action.ilike.%${search.trim()}%`)

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error

      const enriched = await enrichLogs(data || [])
      setLogs(enriched)
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enrichLogs = async (rows: any[]): Promise<LogRow[]> => {
    if (rows.length === 0) return []
    const adminIds = rows.map((r) => r.admin_id).filter(Boolean)
    const { data: profiles } = adminIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', adminIds as string[])
      : { data: [] }
    const adminMap = new Map((profiles || []).map((u) => [u.id, u.full_name]))
    return rows.map((r) => ({ ...r, adminName: r.admin_id ? adminMap.get(r.admin_id) : undefined }))
  }

  const actionVariants: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
    submission_approved: 'success',
    submission_rejected: 'destructive',
    withdrawal_approved: 'success',
    withdrawal_rejected: 'destructive',
    points_adjusted: 'warning',
    user_status_suspended: 'destructive',
    user_status_activated: 'success',
    event_opened: 'success',
    event_closed: 'destructive',
    site_settings_changed: 'secondary',
  }

  const actionLabels: Record<string, string> = {
    submission_approved: 'Submission Approved',
    submission_rejected: 'Submission Rejected',
    withdrawal_approved: 'Withdrawal Approved',
    withdrawal_rejected: 'Withdrawal Rejected',
    points_adjusted: 'Points Adjusted',
    user_status_suspended: 'User Suspended',
    user_status_activated: 'User Activated',
    event_opened: 'Event Opened',
    event_closed: 'Event Closed',
    site_settings_changed: 'Settings Changed',
    announcement_sent: 'Announcement Sent',
    category_created: 'Category Created',
    category_changed: 'Category Changed',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6" /> Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record of all sensitive administrative actions.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }} className="sm:w-56">
          <option value="">All Actions</option>
          {Object.entries(actionLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs found." description="Administrative actions will be logged here." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-2">Date</span>
              <span className="col-span-3">Action</span>
              <span className="col-span-2">Admin</span>
              <span className="col-span-3">Description</span>
              <span className="col-span-2">Target</span>
            </div>
            {logs.map((log) => (
              <div key={log.id} className="lg:grid lg:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-accent/40 transition-colors">
                <span className="lg:col-span-2 text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                <span className="lg:col-span-3">
                  <Badge variant={actionVariants[log.action] || 'secondary'}>
                    {actionLabels[log.action] || log.action}
                  </Badge>
                </span>
                <span className="lg:col-span-2 text-sm">{log.adminName || 'System'}</span>
                <span className="lg:col-span-3 text-xs text-muted-foreground truncate">{log.description || '—'}</span>
                <span className="lg:col-span-2 text-xs">
                  {log.target_type ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ''}` : '—'}
                </span>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}