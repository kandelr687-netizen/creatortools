export type NotificationType =
  | 'submission'
  | 'points'
  | 'withdrawal'
  | 'event'
  | 'announcement'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}
