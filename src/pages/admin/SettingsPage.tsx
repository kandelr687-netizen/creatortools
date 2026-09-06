import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Loader2, Settings as SettingsIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/StatCard'
import { showError, showSuccess } from '@/components/shared/Toaster'

interface SettingsForm {
  website_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  support_info: string
  default_reward_points: string
  default_rejection_points: string
  min_withdrawal: string
  point_to_npr: string
  maintenance_mode: boolean
  registration_open: boolean
  withdrawal_open: boolean
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [settingsId, setSettingsId] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Payment methods
  const [methods, setMethods] = useState<any[]>([])
  const [newMethod, setNewMethod] = useState('')
  const [newMethodDesc, setNewMethodDesc] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (settingsError) throw settingsError

      if (settings) {
        setSettingsId(settings.id)
        setForm({
          website_name: settings.website_name || 'Creators Point',
          site_description: settings.site_description || '',
          contact_email: settings.contact_email || '',
          contact_phone: settings.contact_phone || '',
          support_info: settings.support_info || '',
          default_reward_points: String(settings.default_reward_points),
          default_rejection_points: String(settings.default_rejection_points),
          min_withdrawal: String(settings.min_withdrawal),
          point_to_npr: String(settings.point_to_npr),
          maintenance_mode: settings.maintenance_mode,
          registration_open: settings.registration_open,
          withdrawal_open: settings.withdrawal_open,
        })
      }

      const { data: methodsData } = await supabase.from('payment_methods').select('*').order('name')
      setMethods(methodsData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!form) return
    setSaving(true)
    try {
      const payload = {
        website_name: form.website_name.trim(),
        site_description: form.site_description || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        support_info: form.support_info || null,
        default_reward_points: Number(form.default_reward_points),
        default_rejection_points: Number(form.default_rejection_points),
        min_withdrawal: Number(form.min_withdrawal),
        point_to_npr: Number(form.point_to_npr),
        maintenance_mode: form.maintenance_mode,
        registration_open: form.registration_open,
        withdrawal_open: form.withdrawal_open,
      }
      const { error } = await supabase.from('site_settings').update(payload).eq('id', settingsId)
      if (error) throw error
      showSuccess('Settings saved!')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addMethod = async () => {
    if (!newMethod.trim()) {
      showError('Method name is required.')
      return
    }
    try {
      const { error } = await supabase.from('payment_methods').insert({
        name: newMethod.trim(),
        description: newMethodDesc.trim() || null,
        is_active: true,
      })
      if (error) {
        showError(error.message.includes('duplicate') ? 'This payment method already exists.' : error.message)
        return
      }
      showSuccess('Payment method added.')
      setNewMethod('')
      setNewMethodDesc('')
      loadData()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add method')
    }
  }

  const toggleMethod = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('payment_methods').update({ is_active: !isActive }).eq('id', id)
    if (error) {
      showError(error.message)
      return
    }
    loadData()
  }

  const deleteMethod = async (id: string) => {
    const { error } = await supabase.from('payment_methods').delete().eq('id', id)
    if (error) {
      showError(error.message)
      return
    }
    loadData()
  }

  if (loading || !form) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage platform configuration." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-4 w-4" /> Site Settings
            </CardTitle>
            <CardDescription>Core platform configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Website Name</Label>
              <Input value={form.website_name} onChange={(e) => setForm({ ...form, website_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Site Description</Label>
              <Textarea rows={2} value={form.site_description} onChange={(e) => setForm({ ...form, site_description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Information</Label>
              <Textarea rows={2} value={form.support_info} onChange={(e) => setForm({ ...form, support_info: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Point Configuration</CardTitle>
            <CardDescription>These are defaults. Categories can override.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Reward Points</Label>
                <Input type="number" min="0" value={form.default_reward_points} onChange={(e) => setForm({ ...form, default_reward_points: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Default Rejection Deduction</Label>
                <Input type="number" min="0" value={form.default_rejection_points} onChange={(e) => setForm({ ...form, default_rejection_points: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Withdrawal (points)</Label>
                <Input type="number" min="1" value={form.min_withdrawal} onChange={(e) => setForm({ ...form, min_withdrawal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Point to NPR Conversion</Label>
                <Input type="number" min="0" step="0.01" value={form.point_to_npr} onChange={(e) => setForm({ ...form, point_to_npr: e.target.value })} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-medium">Platform Switches</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Registration Open</p>
                  <p className="text-xs text-muted-foreground">Allow new customers to register</p>
                </div>
                <ToggleSwitch checked={form.registration_open} onChange={(v) => setForm({ ...form, registration_open: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Withdrawals Open</p>
                  <p className="text-xs text-muted-foreground">Allow customers to request withdrawals</p>
                </div>
                <ToggleSwitch checked={form.withdrawal_open} onChange={(v) => setForm({ ...form, withdrawal_open: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Temporarily disable the platform</p>
                </div>
                <ToggleSwitch checked={form.maintenance_mode} onChange={(v) => setForm({ ...form, maintenance_mode: v })} />
              </div>
            </div>

            <Button onClick={saveSettings} className="w-full gap-2" loading={saving}>
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment methods */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal Payment Methods</CardTitle>
            <CardDescription>Methods available to customers when withdrawing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="space-y-2 md:col-span-1">
                <Label>Method Name</Label>
                <Input
                  placeholder="e.g. eSewa, Khalti, Bank"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={newMethodDesc}
                  onChange={(e) => setNewMethodDesc(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addMethod} className="gap-2 w-full">
                  <Plus className="h-4 w-4" /> Add Method
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {methods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment methods configured.</p>
              ) : (
                methods.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={m.is_active ? 'success' : 'secondary'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleMethod(m.id, m.is_active)}>
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMethod(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert variant="info" className="mt-6">
        Changes to default reward/deduction points affect new categories only.
        Already-reviewed submissions keep their original points.
      </Alert>
    </div>
  )
}