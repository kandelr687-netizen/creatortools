import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Link2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { createSubmission, getActiveEvent, getCategories, getCampaigns } from '@/functions/submissions'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { isValidUrl, isGoogleDriveUrl } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { Category, Campaign } from '@/types'

export function SubmitContentPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [event, setEvent] = useState<any>(null)
  const [categoryId, setCategoryId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, camps, evt] = await Promise.all([
        getCategories(),
        getCampaigns(),
        getActiveEvent(),
      ])
      setCategories(cats || [])
      setCampaigns(camps || [])
      setEvent(evt)
      if (cats && cats.length > 0) {
        setCategoryId(cats[0].id)
        setSelectedCategory(cats[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
    setSelectedCategory(categories.find((c) => c.id === id) || null)
  }

  const validateUrl = (url: string): string => {
    if (!url.trim()) return 'Please enter a video link.'
    if (!isValidUrl(url)) return 'Please enter a valid video link.'
    if (!isGoogleDriveUrl(url)) {
      return 'Please enter a valid Google Drive link (drive.google.com).'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateUrl(videoUrl)
    setUrlError(err)
    if (err) return
    if (!categoryId) {
      showError('Please select a category.')
      return
    }
    if (!event?.is_open) {
      showError('Content submissions are currently closed.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createSubmission(
        categoryId,
        videoUrl.trim(),
        notes || undefined,
        campaignId || undefined
      )
      showSuccess('Content submitted successfully! Awaiting review.')
      navigate(`/dashboard/submissions/${result}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to submit content')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isClosed = !event?.is_open

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submit Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your original video to earn points.
        </p>
      </div>

      {isClosed ? (
        <Alert variant="warning" title="Submission Event is currently closed" className="mb-6">
          <p>
            {event?.description || "Content submissions are currently closed. Please check again later."}
            {event?.end_date && new Date(event.end_date) > new Date() && (
              <span className="block mt-1">
                The event ends on {new Date(event.end_date).toLocaleDateString()}.
              </span>
            )}
          </p>
        </Alert>
      ) : (
        event && (
          <Alert variant="success" title="Submission Event is Open" className="mb-6">
            <p>
              {event.title}: {event.description}
              {event.max_submissions && (
                <span className="block mt-1">
                  Slots remaining: {event.max_submissions - (event.current_submission_count || 0)} / {event.max_submissions}
                </span>
              )}
            </p>
          </Alert>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submission Form</CardTitle>
              <CardDescription>
                Select a category, paste your video link, and submit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={isClosed}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.reward_points} pts reward)
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedCategory?.description && (
                  <div className="rounded-lg bg-muted p-4 text-sm">
                    <p className="font-medium mb-1">{selectedCategory.name}</p>
                    <p className="text-muted-foreground">{selectedCategory.description}</p>
                    {selectedCategory.instructions && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="font-medium mb-1">Instructions</p>
                        <p className="text-muted-foreground whitespace-pre-line">{selectedCategory.instructions}</p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-6 pt-3 border-t border-border">
                      <span className="text-sm">
                        Reward: <span className="font-semibold text-green-600">+{selectedCategory.reward_points} pts</span>
                      </span>
                      <span className="text-sm">
                        Reject deduction: <span className="font-semibold text-red-600">−{selectedCategory.rejection_points} pts</span>
                      </span>
                    </div>
                  </div>
                )}

                {campaigns.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign (optional)</Label>
                    <Select
                      id="campaign"
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      disabled={isClosed}
                    >
                      <option value="">Select a campaign (optional)...</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video Link (Google Drive)</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="videoUrl"
                      placeholder="https://drive.google.com/file/d/..."
                      className="pl-9"
                      value={videoUrl}
                      onChange={(e) => { setVideoUrl(e.target.value); setUrlError('') }}
                      disabled={isClosed}
                      required
                    />
                  </div>
                  {urlError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> {urlError}
                    </p>
                  )}
                  {isGoogleDriveUrl(videoUrl) && !urlError && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Google Drive link looks good.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add a note for the reviewer (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isClosed}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting}
                  disabled={isClosed}
                >
                  <Upload className="h-4 w-4" />
                  Submit Content
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Alert variant="warning" title="Important: Google Drive Access">
            <p>
              Make sure your Google Drive file is <strong>accessible to reviewers</strong>.
              If the file cannot be opened, the submission may be rejected.
            </p>
          </Alert>
          <Alert variant="info" title="Account Balance">
            <div className="flex items-center justify-between">
              <span>Current points</span>
              <span className="font-bold text-lg">
                {profile?.points_balance?.toLocaleString() ?? 0} pts
              </span>
            </div>
          </Alert>
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Before you submit
            </h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Video must be your own original content.</li>
              <li>• No copied or re-uploaded content.</li>
              <li>• Follow the campaign/category instructions.</li>
              <li>• Duplicate submissions are not allowed.</li>
              <li>• Approved content earns {selectedCategory?.reward_points ?? 'reward'} points.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}