import { supabase } from '@/lib/supabase'

/**
 * Create a withdrawal request. Balance is NOT deducted at request time.
 * Validations run inside the RPC: min amount, enough balance, active method.
 */
export async function requestWithdrawal(
  amount: number,
  paymentMethod: string,
  accountDetails: string,
  note?: string,
  qrImageUrl?: string
) {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_amount: amount,
    p_payment_method: paymentMethod,
    p_account_details: accountDetails,
    p_note: note || null,
    p_qr_image_url: qrImageUrl || null,
  })
  if (error) throw error
  return data
}

export async function getPaymentMethods(activeOnly = true) {
  let query = supabase.from('payment_methods').select('*').order('name')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getWithdrawalSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('min_withdrawal, withdrawal_open, point_to_npr')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function uploadWithdrawalQR(file: File) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${user.id}/withdrawal-qr/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('private-files')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('private-files').getPublicUrl(path)
  return data.publicUrl
}