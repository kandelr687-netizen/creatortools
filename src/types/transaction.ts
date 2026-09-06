export type TransactionType =
  | 'submission_reward'
  | 'submission_rejection'
  | 'withdrawal'
  | 'admin_adjustment'
  | 'bonus'
  | 'penalty'

export interface PointTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  reference_type?: string
  reference_id?: string
  description?: string
  created_by?: string
  created_at: string
}
