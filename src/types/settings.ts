export interface SiteSettings {
  id: string
  website_name: string
  logo_url?: string
  favicon_url?: string
  site_description?: string
  contact_email?: string
  contact_phone?: string
  support_info?: string
  default_reward_points: number
  default_rejection_points: number
  min_withdrawal: number
  point_to_npr: number
  submission_event_status: 'open' | 'closed'
  maintenance_mode: boolean
  registration_open: boolean
  withdrawal_open: boolean
  updated_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  description?: string
  is_active: boolean
  icon_url?: string
  created_at: string
}

export interface SubmissionEvent {
  id: string
  title: string
  description?: string
  is_open: boolean
  start_date?: string
  end_date?: string
  max_submissions?: number
  current_submission_count: number
  max_per_user_per_day?: number
  max_per_user_per_event?: number
  created_at: string
  updated_at: string
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}
