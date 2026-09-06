export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface Submission {
  id: string
  user_id: string
  category_id: string
  campaign_id?: string
  video_url: string
  notes?: string
  status: SubmissionStatus
  admin_note?: string
  reward_points?: number
  deduction_points?: number
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export type SubmissionWithRelations = Submission & {
  categories?: { id: string; name: string; slug: string } | null
  profiles?: { id: string; full_name: string; username: string } | null
  campaigns?: { id: string; title: string } | null
}
