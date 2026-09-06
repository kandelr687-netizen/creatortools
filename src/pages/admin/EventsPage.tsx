import { useEffect, useState } from 'react'
import { Plus, Pencil, Power, CalendarRange, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { EmptyState } from '@/components/ui/empty-state'
import { EventStatusBadge } from '@/components/shared/StatusBadge'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { formatDateTime } from '@/lib/utils'

interface EventForm {
  title: string
  description: string
  start_date: string
  end_date: string
  max_submissions: string
  max_per_user_per_day: string
  max_per_user_per_event: string
}

const emptyForm: EventForm = {
  title: 'Submission Event',
  description: '',
  start_date: '',
  end_date: '',
  max_submissions: '',
  max_per_user_per_day: '',
  max_per_user_per_event: '',
}

export function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<any>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('submission_events')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEvents(data || [])
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

  const openEdit = (evt: any) => {
    setEditingId(evt.id)
    setForm({
      title: evt.title || '',
      description: evt.description || '',
      start_date: evt.start_date ? evt.start_date.slice(0, 10) : '',
      end_date: evt.end_date ? evt.end_date.slice(0, 10) : '',
      max_submissions: evt.max_submissions ? String(evt.max_submissions) : '',
      max_per_user_per_day: evt.max_per_user_per_day ? String(evt.max_per_user_per_day) : '',
      max_per_user_per_event: evt.max_per_user_per_event ? String(evt.max_per_user_per_event) : '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      showError('Event title is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        max_submissions: form.max_submissions ? Number(form.max_submissions) : null,
        max_per_user_per_day: form.max_per_user_per_day ? Number(form.max_per_user_per_day) : null,
        max_per_user_per_event: form.max_per_user_per_event ? Number(form.max_per_user_per_event) : null,
      }

      let error: any
      if (editingId) {
        const res = await supabase.from('submission_events').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('submission_events').insert(payload)
        error = res.error
      }
      if (error) {
        showError(error.message)
        return
      }
      showSuccess(editingId ? 'Event updated!' : 'Event created!')
      setModalOpen(false)
      loadEvents()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const toggleEvent = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const { error } = await supabase.rpc('admin_set_event_status', {
        p_is_open: !toggleTarget.is_open,
      })
      if (error) throw error
      showSuccess(toggleTarget.is_open
        ? 'Submission event closed. Customers can no longer submit.'
        : 'Submission event opened! Customers can now submit content.')
      setToggleTarget(null)
      loadEvents()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to toggle event')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const activeEvent = events.find((e) => e.is_open) || events[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control the global submission event. When OFF, no one can submit content.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Event
        </Button>
      </div>

      {/* Current event status */}
      {activeEvent ? (
        <div className={`rounded-2xl border p-6 mb-8 shadow-sm ${activeEvent.is_open ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${activeEvent.is_open ? 'bg-green-600' : 'bg-red-600'}`}>
                <CalendarRange className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xl font-bold">{activeEvent.title}</p>
                  <EventStatusBadge isOpen={activeEvent.is_open} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeEvent.is_open
                    ? (activeEvent.description || 'Submissions are currently OPEN.')
                    : 'Submissions are currently CLOSED. Please check again later.'}
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  {activeEvent.start_date && <span>Start: {formatDateTime(activeEvent.start_date)}</span>}
                  {activeEvent.end_date && <span>End: {formatDateTime(activeEvent.end_date)}</span>}
                  {activeEvent.max_submissions != null && (
                    <span>
                      Submissions: {activeEvent.current_submission_count} / {activeEvent.max_submissions}
                    </span>
                  )}
                  {activeEvent.max_per_user_per_day != null && (
                    <span>Daily/user limit: {activeEvent.max_per_user_per_day}</span>
                  )}
                  {activeEvent.max_per_user_per_event != null && (
                    <span>Event/user limit: {activeEvent.max_per_user_per_event}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant={activeEvent.is_open ? 'destructive' : 'success'}
                size="lg"
                className="gap-2"
                onClick={() => setToggleTarget(activeEvent)}
              >
                <Power className="h-4 w-4" />
                {activeEvent.is_open ? 'Close Event' : 'Open Event'}
              </Button>
              <Button variant="outline" onClick={() => openEdit(activeEvent)}>
                <Pencil className="h-4 w-4" /> Edit Event
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Alert variant="warning" className="mb-8">
          No event has been created yet. Create an event to enable the submission system.
        </Alert>
      )}

      {/* All events */}
      <h2 className="text-lg font-semibold mb-4">All Events</h2>
      {events.length === 0 ? (
        <EmptyState
          title="No events yet."
          description="Create your first submission event."
          action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {events.map((evt) => (
            <div key={evt.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{evt.title}</p>
                  <EventStatusBadge isOpen={evt.is_open} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {formatDateTime(evt.created_at)}
                  {evt.max_submissions != null && ` · ${evt.current_submission_count}/${evt.max_submissions} submissions`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(evt)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant={evt.is_open ? 'destructive' : 'success'}
                  onClick={() => setToggleTarget(evt)}
                >
                  <Power className="h-4 w-4" /> {evt.is_open ? 'Close' : 'Open'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Event' : 'Create Event'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Event'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Event Title <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Create videos for our new viral offer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Describe this submission event"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Submissions (event)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.max_submissions}
                onChange={(e) => setForm({ ...form, max_submissions: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Per User / Day</Label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.max_per_user_per_day}
                onChange={(e) => setForm({ ...form, max_per_user_per_day: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Per User / Event</Label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.max_per_user_per_event}
                onChange={(e) => setForm({ ...form, max_per_user_per_event: e.target.value })}
              />
            </div>
          </div>
          <Alert variant="info">
            The event status can be toggled ON/OFF at any time from the dashboard.
            Backend enforcement ensures submissions are blocked when the event is closed.
          </Alert>
        </div>
      </Modal>

      {/* Toggle confirm */}
      <ConfirmationDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={toggleEvent}
        title={toggleTarget?.is_open ? 'Close Submission Event' : 'Open Submission Event'}
        message={toggleTarget?.is_open
          ? 'Closing the event will immediately stop all customers from submitting content. Continue?'
          : 'Opening the event will allow all active customers to submit content. Continue?'}
        confirmLabel={toggleTarget?.is_open ? 'Close Event' : 'Open Event'}
        variant={toggleTarget?.is_open ? 'destructive' : 'success'}
        loading={toggling}
      />
    </div>
  )
}