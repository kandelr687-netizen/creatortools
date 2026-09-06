import { useState } from 'react'
import { Send, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/StatCard'
import { showError, showSuccess } from '@/components/shared/Toaster'

export function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!title.trim()) {
      showError('Title is required.')
      return
    }
    if (!message.trim()) {
      showError('Message is required.')
      return
    }
    setSending(true)
    try {
      const { error } = await supabase.rpc('admin_send_announcement', {
        p_title: title.trim(),
        p_message: message.trim(),
      })
      if (error) throw error
      showSuccess('Announcement sent to all creators!')
      setTitle('')
      setMessage('')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Send announcements to all creators."
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> Broadcast Announcement
            </CardTitle>
            <CardDescription>
              Send a notification to every active creator on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notifTitle">Title</Label>
              <Input
                id="notifTitle"
                placeholder="e.g. New campaign live!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifMessage">Message</Label>
              <Textarea
                id="notifMessage"
                rows={5}
                placeholder="Enter the announcement message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleSend} loading={sending} className="gap-2">
              <Send className="h-4 w-4" /> Send to All Creators
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}