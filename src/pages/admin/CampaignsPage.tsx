import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Megaphone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { formatDate } from '@/lib/utils'
import type { Campaign } from '@/types'

interface CampaignForm {
  title: string
  description: string
  requirements: string
  video_instructions: string
  reference_info: string
  reward_points: string
  rejection_points: string
  category_id: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive'
}

const emptyForm: CampaignForm = {
  title: '',
  description: '',
  requirements: '',
  video_instructions: '',
  reference_info: '',
  reward_points: '50',
  rejection_points: '20',
  category_id: '',
  start_date: '',
  end_date: '',
  status: 'active',
}

export function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CampaignForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [campsRes, catsRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('sort_order'),
      ])
      if (campsRes.error) throw campsRes.error
      setCampaigns(campsRes.data || [])
      setCategories(catsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' })
    setModalOpen(true)
  }

  const openEdit = (camp: Campaign) => {
    setEditingId(camp.id)
    setForm({
      title: camp.title,
      description: camp.description || '',
      requirements: camp.requirements || '',
      video_instructions: camp.video_instructions || '',
      reference_info: camp.reference_info || '',
      reward_points: String(camp.reward_points),
      rejection_points: String(camp.rejection_points),
      category_id: camp.category_id || '',
      start_date: camp.start_date ? camp.start_date.slice(0, 10) : '',
      end_date: camp.end_date ? camp.end_date.slice(0, 10) : '',
      status: camp.status,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      showError('Campaign title is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        requirements: form.requirements || null,
        video_instructions: form.video_instructions || null,
        reference_info: form.reference_info || null,
        reward_points: Number(form.reward_points),
        rejection_points: Number(form.rejection_points),
        category_id: form.category_id || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        status: form.status,
      }

      let error: any
      if (editingId) {
        const res = await supabase.from('campaigns').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('campaigns').insert(payload)
        error = res.error
      }
      if (error) {
        showError(error.message)
        return
      }
      showSuccess(editingId ? 'Campaign updated!' : 'Campaign created!')
      setModalOpen(false)
      loadData()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', deleteTarget.id)
      if (error) {
        showError(error.message)
        return
      }
      showSuccess('Campaign deleted.')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setDeleting(false)
    }
  }

  const toggleStatus = async (camp: Campaign) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ status: camp.status === 'active' ? 'inactive' : 'active' })
      .eq('id', camp.id)
    if (error) {
      showError(error.message)
      return
    }
    loadData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define content requirements that creators must follow.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Campaign
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet."
          description="Create campaigns to define content requirements and rewards."
          action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Campaign</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className="rounded-xl border bg-card shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{camp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {camp.start_date ? formatDate(camp.start_date) : 'Start'} — {camp.end_date ? formatDate(camp.end_date) : 'No end'}
                    </p>
                  </div>
                </div>
                <Badge variant={camp.status === 'active' ? 'success' : 'secondary'}>
                  {camp.status}
                </Badge>
              </div>

              {camp.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{camp.description}</p>
              )}
              {camp.requirements && (
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium mb-1">Requirements</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{camp.requirements}</p>
                </div>
              )}

              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-green-600">Reward: +{camp.reward_points}</span>
                <span className="text-red-600">Reject: −{camp.rejection_points}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(camp)}>
                  {camp.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(camp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(camp)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Campaign' : 'Add Campaign'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. New Offer Viral Video"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="What is this campaign about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Content Requirements</Label>
            <Textarea
              rows={4}
              placeholder={"• Create an original video about the specified offer\n• Video must be your own content\n• No copied/reuploaded content"}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Video Instructions</Label>
            <Textarea
              rows={3}
              placeholder="Specific instructions for the video"
              value={form.video_instructions}
              onChange={(e) => setForm({ ...form, video_instructions: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Example / Reference Information</Label>
            <Textarea
              rows={2}
              placeholder="Links or reference material"
              value={form.reference_info}
              onChange={(e) => setForm({ ...form, reference_info: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Reward Points</Label>
              <Input type="number" min="0" value={form.reward_points} onChange={(e) => setForm({ ...form, reward_points: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rejection Deduction</Label>
              <Input type="number" min="0" value={form.rejection_points} onChange={(e) => setForm({ ...form, rejection_points: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}