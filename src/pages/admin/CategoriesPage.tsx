import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, FolderTree, ArrowUp, ArrowDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { LoadingState } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { slugify } from '@/lib/utils'
import type { Category } from '@/types'

interface CategoryForm {
  name: string
  description: string
  instructions: string
  reward_points: string
  rejection_points: string
  status: 'active' | 'inactive'
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  instructions: '',
  reward_points: '50',
  rejection_points: '20',
  status: 'active',
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      description: cat.description || '',
      instructions: cat.instructions || '',
      reward_points: String(cat.reward_points),
      rejection_points: String(cat.rejection_points),
      status: cat.status,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError('Category name is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name.trim()),
        description: form.description || null,
        instructions: form.instructions || null,
        reward_points: Number(form.reward_points),
        rejection_points: Number(form.rejection_points),
        status: form.status,
        sort_order: editingId
          ? (categories.find((c) => c.id === editingId)?.sort_order ?? 0)
          : categories.length,
      }

      let error: any
      if (editingId) {
        const res = await supabase.from('categories').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('categories').insert(payload)
        error = res.error
      }

      if (error) {
        if (error.message.includes('duplicate')) showError('A category with this name already exists.')
        else showError(error.message)
        return
      }
      showSuccess(editingId ? 'Category updated!' : 'Category created!')
      setModalOpen(false)
      loadCategories()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id)
      if (error) {
        showError(error.message.includes('foreign key') ? 'This category has submissions. Deactivate it instead.' : error.message)
        return
      }
      showSuccess('Category deleted.')
      setDeleteTarget(null)
      loadCategories()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const newList = [...categories]
    const temp = newList[index]
    newList[index] = newList[target]
    newList[target] = temp
    setCategories(newList)

    await supabase.from('categories').update({ sort_order: index }).eq('id', newList[target].id)
    await supabase.from('categories').update({ sort_order: target }).eq('id', newList[index].id)
  }

  const toggleStatus = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ status: cat.status === 'active' ? 'inactive' : 'active' })
      .eq('id', cat.id)
    if (error) {
      showError(error.message)
      return
    }
    showSuccess(cat.status === 'active' ? 'Category deactivated.' : 'Category activated.')
    loadCategories()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage content categories. Customers only see active categories.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet."
          description="Create your first category to let customers submit content."
          action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, index) => (
            <div key={cat.id} className="rounded-xl border bg-card shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">#{cat.sort_order + 1}</p>
                  </div>
                </div>
                <Badge variant={cat.status === 'active' ? 'success' : 'secondary'}>
                  {cat.status}
                </Badge>
              </div>

              {cat.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{cat.description}</p>
              )}
              {cat.instructions && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2 mb-3 line-clamp-2">{cat.instructions}</p>
              )}

              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-green-600">Reward: +{cat.reward_points}</span>
                <span className="text-red-600">Reject: −{cat.rejection_points}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => moveCategory(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === categories.length - 1} onClick={() => moveCategory(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(cat)}>
                    {cat.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat)}>
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
        title={editingId ? 'Edit Category' : 'Add Category'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Viral Video"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe this category"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              placeholder="Instructions for creators submitting to this category"
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reward Points</Label>
              <Input
                type="number"
                min="0"
                value={form.reward_points}
                onChange={(e) => setForm({ ...form, reward_points: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rejection Deduction</Label>
              <Input
                type="number"
                min="0"
                value={form.rejection_points}
                onChange={(e) => setForm({ ...form, rejection_points: e.target.value })}
              />
            </div>
          </div>
          <Alert variant="info">
            Points are stored on each submission at review time. Changing category points
            will not affect already-reviewed submissions.
          </Alert>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={deleteTarget
          ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
          : ''}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}