import { supabase } from '@/lib/supabase'

export async function markNotificationsRead(notificationIds: string[]) {
  const { data, error } = await supabase.rpc('mark_notifications_read', {
    p_ids: notificationIds,
  })
  if (error) throw error
  return data
}

export async function markAllNotificationsRead() {
  const { data, error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
  return data
}

export async function getMyNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}