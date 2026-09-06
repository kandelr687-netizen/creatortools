export interface Campaign {
  id: string
  title: string
  description?: string
  requirements?: string
  video_instructions?: string
  reference_info?: string
  reward_points: number
  rejection_points: number
  category_id?: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}
