import { supabase } from '@/lib/supabase'

/**
 * Admin: Review a submission. Uses a secure RPC function with
 * database-level authorization so the user's role is verified server-side.
 * Atomic point operations happen inside the database transaction.
 */
export async function reviewSubmission(
  submissionId: string,
  decision: 'approve' | 'reject',
  points: number,
  adminNote?: string
) {
  const { data, error } = await supabase.rpc('admin_review_submission', {
    p_submission_id: submissionId,
    p_decision: decision,
    p_points: points,
    p_admin_note: adminNote || null,
  })
  if (error) throw error
  return data
}

/**
 * Admin: Review a withdrawal. Points are only deducted when approved.
 * Cannot be approved twice due to status check inside the transaction.
 */
export async function reviewWithdrawal(
  withdrawalId: string,
  decision: 'approve' | 'reject',
  adminNote?: string
) {
  const { data, error } = await supabase.rpc('admin_review_withdrawal', {
    p_withdrawal_id: withdrawalId,
    p_decision: decision,
    p_admin_note: adminNote || null,
  })
  if (error) throw error
  return data
}

/**
 * Admin: Manually adjust a user's points with an audit trail.
 */
export async function adjustUserPoints(
  userId: string,
  amount: number,
  reason: string,
  type: 'admin_adjustment' | 'bonus' | 'penalty' = 'admin_adjustment'
) {
  const { data, error } = await supabase.rpc('admin_adjust_points', {
    p_user_id: userId,
    p_amount: amount,
    p_description: reason,
    p_type: type,
  })
  if (error) throw error
  return data
}