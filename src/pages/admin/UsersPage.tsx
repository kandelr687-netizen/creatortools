import { useEffect, useState } from 'react'
import {
  Search, User as UserIcon, Coins, Ban, ShieldCheck, Eye, TrendingUp, TrendingDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { UserStatusBadge, RoleBadge } from '@/components/shared/StatusBadge'
import { adjustUserPoints } from '@/functions/adminActions'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { formatDateTime } from '@/lib/utils'
import type { UserStatus } from '@/types'

const PAGE_SIZE = 10

interface AdminUser {
  id: string
  full_name: string
  username: string
  email: string
  phone?: string
  role: 'customer' | 'admin'
  points_balance: number
  status: UserStatus
  created_at: string
  submissionsCount?: number
  withdrawalsCount?: number
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [adjustUser, setAdjustUser] = useState<AdminUser | null>(null)
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const [statusConfirm, setStatusConfirm] = useState<{ user: AdminUser | null; newStatus: UserStatus }>({ user: null, newStatus: 'active' })
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [search, statusFilter, page])

  const loadUsers = async () => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' })
      if (statusFilter) query = query.eq('status', statusFilter)
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
      }
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error

      const enriched = await enrichUsers(data || [])
      setUsers(enriched)
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const enrichUsers = async (profiles: any[]): Promise<AdminUser[]> => {
    if (profiles.length === 0) return []
    const ids = profiles.map((u) => u.id)

    const [subsRes, wdRes] = await Promise.all([
      supabase.from('submissions').select('user_id').in('user_id', ids as string[]),
      supabase.from('withdrawals').select('user_id').in('user_id', ids as string[]),
    ])

    const subCount = new Map<string, number>()
    const wdCount = new Map<string, number>()
    for (const s of subsRes.data || []) subCount.set(s.user_id, (subCount.get(s.user_id) || 0) + 1)
    for (const w of wdRes.data || []) wdCount.set(w.user_id, (wdCount.get(w.user_id) || 0) + 1)

    return (profiles as AdminUser[]).map((u) => ({
      ...u,
      submissionsCount: subCount.get(u.id) || 0,
      withdrawalsCount: wdCount.get(u.id) || 0,
    }))
  }

  const handleAdjust = async () => {
    if (!adjustUser) return
    const amt = Number(adjustAmount)
    if (!amt || amt <= 0) {
      showError('Please enter a valid amount.')
      return
    }
    if (!adjustReason.trim()) {
      showError('A reason is required for point adjustments.')
      return
    }
    setAdjusting(true)
    try {
      const signed = adjustType === 'add' ? amt : -amt
      await adjustUserPoints(adjustUser.id, signed, adjustReason.trim())
      showSuccess(`Adjusted ${adjustUser.username}'s points by ${signed}.`)
      setAdjustUser(null)
      setAdjustAmount('')
      setAdjustReason('')
      loadUsers()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to adjust points')
    } finally {
      setAdjusting(false)
    }
  }

  const handleStatusChange = async () => {
    if (!statusConfirm.user) return
    setStatusUpdating(true)
    try {
      const { error } = await supabase.rpc('admin_update_user_status', {
        p_user_id: statusConfirm.user.id,
        p_status: statusConfirm.newStatus,
      })
      if (error) throw error
      showSuccess(`${statusConfirm.user.username} is now ${statusConfirm.newStatus}.`)
      setStatusConfirm({ user: null, newStatus: 'active' })
      loadUsers()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update user status')
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user accounts, status, and points.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="sm:w-48">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState title="No users found." description="Users matching your filters will appear here." />
      ) : (
        <>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
              <span className="col-span-3">User</span>
              <span className="col-span-2">Email</span>
              <span className="col-span-1">Role</span>
              <span className="col-span-1">Points</span>
              <span className="col-span-2">Subs / WDs</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="lg:grid lg:grid-cols-12 items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-accent/40 transition-colors">
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 text-sm truncate">{user.email}</div>
                <div className="lg:col-span-1"><RoleBadge role={user.role} /></div>
                <div className="lg:col-span-1">
                  <span className={`text-sm font-semibold ${user.points_balance < 0 ? 'text-red-600' : ''}`}>
                    {user.points_balance.toLocaleString()}
                  </span>
                </div>
                <div className="lg:col-span-2 text-xs text-muted-foreground">
                  {user.submissionsCount} subs · {user.withdrawalsCount} wds
                </div>
                <div className="lg:col-span-1"><UserStatusBadge status={user.status} /></div>
                <div className="lg:col-span-2 flex justify-end gap-1.5 mt-2 lg:mt-0">
                  <Button size="sm" variant="ghost" onClick={() => setDetailUser(user)} title="View profile">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {user.role === 'customer' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setAdjustUser(user); setAdjustType('add'); setAdjustAmount(''); setAdjustReason('') }} title="Adjust points">
                        <Coins className="h-4 w-4 text-primary" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button size="sm" variant="ghost" onClick={() => setStatusConfirm({ user, newStatus: 'suspended' })} title="Suspend">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setStatusConfirm({ user, newStatus: 'active' })} title="Activate">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="User Profile" size="lg">
        {detailUser && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{detailUser.full_name || '—'}</p>
                <p className="text-muted-foreground">@{detailUser.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{detailUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p>{detailUser.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Points Balance</p>
                <p className={`font-bold text-lg ${detailUser.points_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {detailUser.points_balance.toLocaleString()} pts
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p>{formatDateTime(detailUser.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <UserStatusBadge status={detailUser.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submissions</p>
                <p>{detailUser.submissionsCount}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust points modal */}
      <Modal
        open={!!adjustUser}
        onClose={() => setAdjustUser(null)}
        title="Adjust Points"
        description={adjustUser ? `Adjusting points for ${adjustUser.full_name} (@${adjustUser.username})` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjustUser(null)} disabled={adjusting}>
              Cancel
            </Button>
            <Button variant={adjustType === 'add' ? 'success' : 'destructive'} onClick={handleAdjust} loading={adjusting}>
              {adjustType === 'add' ? 'Add Points' : 'Deduct Points'}
            </Button>
          </>
        }
      >
        {adjustUser && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current balance</span>
              <span className="font-semibold">{adjustUser.points_balance.toLocaleString()} pts</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustType === 'add' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setAdjustType('add')}
              >
                <TrendingUp className="h-4 w-4" /> Add
              </Button>
              <Button
                type="button"
                variant={adjustType === 'deduct' ? 'destructive' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setAdjustType('deduct')}
              >
                <TrendingDown className="h-4 w-4" /> Deduct
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Amount (points)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Promotional bonus"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {adjustType === 'add' && adjustAmount ? `New balance: ${(adjustUser.points_balance + Number(adjustAmount)).toLocaleString()} pts` : ''}
                {adjustType === 'deduct' && adjustAmount ? `New balance: ${(adjustUser.points_balance - Number(adjustAmount)).toLocaleString()} pts` : ''}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Status confirm */}
      <ConfirmationDialog
        open={!!statusConfirm.user}
        onClose={() => setStatusConfirm({ user: null, newStatus: 'active' })}
        onConfirm={handleStatusChange}
        title={statusConfirm.newStatus === 'active' ? 'Activate User' : `Suspend User`}
        message={statusConfirm.user
          ? `Are you sure you want to mark ${statusConfirm.user.full_name} (@${statusConfirm.user.username}) as ${statusConfirm.newStatus}? They will ${statusConfirm.newStatus === 'active' ? 'regain access to the platform and be able to submit content.' : 'not be able to submit content or use the platform.'}`
          : ''}
        confirmLabel={statusConfirm.newStatus === 'active' ? 'Activate' : 'Suspend'}
        variant={statusConfirm.newStatus === 'active' ? 'success' : 'destructive'}
        loading={statusUpdating}
      />
    </div>
  )
}