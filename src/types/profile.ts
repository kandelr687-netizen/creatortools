export type Role = 'customer' | 'admin'

export type UserStatus = 'active' | 'suspended' | 'banned'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  username: string
  email: string
  phone?: string
  avatar_url?: string
  role: Role
  points_balance: number
  status: UserStatus
  created_at: string
  updated_at: string
}
