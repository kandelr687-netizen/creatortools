export type CategoryStatus = 'active' | 'inactive'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  instructions?: string
  reward_points: number
  rejection_points: number
  status: CategoryStatus
  sort_order: number
  created_at: string
  updated_at: string
}
