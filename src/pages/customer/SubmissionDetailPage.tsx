import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Check, Calendar, User as UserIcon, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loading'
import { SubmissionStatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, truncate } from '@/lib/utils'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { Alert } from '@/components/ui/alert'
import type { Submission } from '@/types'

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [categoryName, setCategoryName] = useState('General')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSubmission()
  }, [id])

  const loadSubmission = async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      showError('Submission not found.')
      return
    }
    setSubmission(data as Submission)

    if (data.category_id) {
      const { data: cat } = await supabase.from('categories').select('name').eq('id', data.category_id).single()
      if (cat) setCategoryName(cat.name)
    }
    if (data.campaign_id) {
      const { data: camp } = await supabase.from('campaigns').select('title').eq('id', data.campaign_id).single()
      if (camp) setCampaignTitle(camp.title)
    }
  }

  const copyId = async () => {
    if (!submission) return
    await navigator.clipboard.writeText(submission.id)
    setCopied(true)
    showSuccess('Submission ID copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!submission) return <PageLoader />

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/submissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to submissions
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {categoryName}
            <SubmissionStatusBadge status={submission.status} />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            ID: <span className="font-mono">{submission.id.slice(0, 12)}...</span>
            <button onClick={copyId} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </p>
        </div>
      </div>

      {submission.status === 'pending' && (
        <Alert variant="info" className="mb-6">
          Your submission is waiting for review. You'll be notified when it's reviewed.
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 break-all">
              <p className="text-sm text-muted-foreground">{truncate(submission.video_url, 80)}</p>
            </div>
            <a href={submission.video_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4" /> Open Video
              </Button>
            </a>
            <Alert variant="warning">
              Make sure your Google Drive file is accessible. Reviewers may not be able to open private files.
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Submitted
              </span>
              <span>{formatDateTime(submission.created_at)}</span>
            </div>
            {campaignTitle && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4" /> Campaign
                </span>
                <span>{campaignTitle}</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground">Review Status</span>
              <SubmissionStatusBadge status={submission.status} />
            </div>
            {submission.reviewed_at && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Reviewed At</span>
                <span>{formatDateTime(submission.reviewed_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Reward Points</p>
                <p className="text-2xl font-bold text-green-600">
                  {submission.reward_points != null ? `+${submission.reward_points}` : '—'}
                </p>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Deduction Points</p>
                <p className="text-2xl font-bold text-red-600">
                  {submission.deduction_points != null ? `−${submission.deduction_points}` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Notes & Admin Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your note</p>
                <p className="text-sm bg-muted rounded-lg p-3">{submission.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Admin note</p>
              {submission.admin_note ? (
                <p className="text-sm bg-muted rounded-lg p-3">{submission.admin_note}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No admin feedback yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}