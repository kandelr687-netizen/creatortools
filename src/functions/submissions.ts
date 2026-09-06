import { supabase } from '@/lib/supabase'

/**
 * Create a submission. The RPC function checks:
 * - user is active
 * - event is open
 * - campaign/category is active
 * - submission limits
 * - duplicate URL detection
 */
export async function createSubmission(
  categoryId: string,
  videoUrl: string,
  notes?: string,
  campaignId?: string
) {
  const { data, error } = await supabase.rpc('submit_content', {
    p_category_id: categoryId,
    p_video_url: videoUrl,
    p_notes: notes || null,
    p_campaign_id: campaignId || null,
  })
  if (error) throw error
  return data
}

/**
 * Get the active submission event (public safe data).
 */
export async function getActiveEvent() {
  const { data, error } = await supabase
    .from('submission_events')
    .select('id, title, description, is_open, start_date, end_date, max_submissions, current_submission_count, max_per_user_per_day, max_per_user_per_event')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}