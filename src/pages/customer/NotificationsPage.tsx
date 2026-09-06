import { useEffect, useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading'
import { PageHeader } from '@/components/shared/StatCard'
import { formatDateTime } from '@/lib/utils'
import { markAllNotificationsRead, markNotificationsRead } from '@/functions/notifications'
import { showSuccess } from '@/components/shared/Toaster'
import type { Notification } from '@/types'

const typeIcons: Record<string, { bg: string; label: string }> = {
  submission: { bg: 'bg-primary/10 text-primary', label: 'Submission' },
  points: { bg: 'bg-green-50 text-green-600', label: 'Points' },
  withdrawal: { bg: 'bg-blue-50 text-blue-600', label: 'Withdrawal' },
  event: { bg: 'bg-amber-50 text-amber-600', label: 'Event' },
  announcement: { bg: 'bg-violet-50 text-violet-600', label: 'Announcement' },
  system: { bg: 'bg-gray-100 text-gray-600', label: 'System' },
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    showSuccess('All notifications marked as read.')
  }

  const handleMarkOne = async (id: string) => {
    await markNotificationsRead([id])
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}.` : 'You are all caught up.'}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications yet." description="Updates about your submissions and points will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = typeIcons[n.type] || typeIcons.system
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
                className={`rounded-xl border bg-card p-4 shadow-sm cursor-pointer transition-colors ${!n.is_read ? 'border-primary/40 bg-primary/5' : 'hover:bg-accent/50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <span className="text-base">{cfg.label[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 inline-block">{cfg.label}</span>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}