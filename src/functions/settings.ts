import { supabase } from '@/lib/supabase'

export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}