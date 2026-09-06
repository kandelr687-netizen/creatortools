export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  payment_method: string
  account_details: string
  qr_image_url?: string
  note?: string
  status: WithdrawalStatus
  admin_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export type WithdrawalWithUser = Withdrawal & {
  profiles?: { id: string; full_name: string; username: string; email: string; points_balance: number } | null
}
