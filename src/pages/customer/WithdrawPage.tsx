import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, QrCode, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/shared/StatCard'
import { requestWithdrawal, getPaymentMethods, getWithdrawalSettings, uploadWithdrawalQR } from '@/functions/withdrawals'
import { showError, showSuccess } from '@/components/shared/Toaster'
import { useAuthStore } from '@/store/auth'
import type { PaymentMethod } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function WithdrawPage() {
  const { profile, refreshProfile } = useAuthStore()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [minWithdrawal, setMinWithdrawal] = useState(100)
  const [withdrawalOpen, setWithdrawalOpen] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [accountDetails, setAccountDetails] = useState('')
  const [note, setNote] = useState('')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState('')
  const [qrUploading, setQrUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [methodsData, settings] = await Promise.all([
        getPaymentMethods(true),
        getWithdrawalSettings(),
      ])
      setMethods(methodsData || [])
      if (methodsData && methodsData.length > 0) setSelectedMethod(methodsData[0].name)
      if (settings) {
        setMinWithdrawal(Number(settings.min_withdrawal) || 100)
        setWithdrawalOpen(settings.withdrawal_open)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleQrFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      showError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Image must be under 2MB.')
      return
    }
    setQrFile(file)
    setQrPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      showError('Please enter a valid withdrawal amount.')
      return
    }
    if (amt < minWithdrawal) {
      showError(`Minimum withdrawal amount is ${minWithdrawal} points (${formatCurrency(minWithdrawal)}).`)
      return
    }
    if (amt > (profile?.points_balance ?? 0)) {
      showError('You don\'t have enough available points for this withdrawal.')
      return
    }
    if (!selectedMethod) {
      showError('Please select a payment method.')
      return
    }
    if (!accountDetails.trim()) {
      showError('Please provide your payment account details.')
      return
    }

    setSubmitting(true)
    try {
      let qrUrl: string | undefined
      if (qrFile) {
        setQrUploading(true)
        qrUrl = await uploadWithdrawalQR(qrFile)
      }
      await requestWithdrawal(amt, selectedMethod, accountDetails.trim(), note || undefined, qrUrl)
      await refreshProfile()
      showSuccess('Withdrawal request submitted successfully!')
      navigate('/dashboard/withdrawals')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
      setQrUploading(false)
    }
  }

  const balance = profile?.points_balance ?? 0
  const canWithdraw = balance >= minWithdrawal

  return (
    <div>
      <PageHeader
        title="Withdraw Points"
        description="Convert your points into cash. 1 point = NPR 1."
      />

      {!withdrawalOpen && (
        <Alert variant="warning" className="mb-6">
          Withdrawals are currently closed. Please check again later.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Withdrawal Request
              </CardTitle>
              <CardDescription>
                Your points are only deducted after the admin approves your request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available balance</p>
                    <p className="text-2xl font-bold">{balance.toLocaleString()} points</p>
                    <p className="text-xs text-muted-foreground">≈ {balance >= 0 ? formatCurrency(balance) : 'Negative balance'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Minimum</p>
                    <p className="font-semibold">{minWithdrawal} points</p>
                    <p className="text-xs text-muted-foreground">≈ {formatCurrency(minWithdrawal)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Withdrawal Amount (points)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={minWithdrawal}
                    max={balance}
                    step="1"
                    placeholder={`Enter amount (min ${minWithdrawal})`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!withdrawalOpen}
                    required
                  />
                  {Number(amount) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      You will receive approximately {formatCurrency(Number(amount))}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    id="method"
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    disabled={!withdrawalOpen || methods.length === 0}
                    required
                  >
                    {methods.length === 0 && <option value="">No payment methods available</option>}
                    {methods.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Wallet / Account Details</Label>
                  <Input
                    id="account"
                    placeholder="e.g. 9800000000 (eSewa) / Account number (Bank)"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    disabled={!withdrawalOpen}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>QR Code (optional)</Label>
                  {!qrPreview ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                      <QrCode className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground mb-1">Upload wallet QR code</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG or WEBP · Max 2MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleQrFile(e.target.files[0])}
                        disabled={!withdrawalOpen}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={qrPreview} alt="QR code preview" className="h-32 w-32 object-cover rounded-xl border" />
                      <button
                        type="button"
                        onClick={() => { setQrFile(null); setQrPreview('') }}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Additional Note (optional)</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    placeholder="Any additional information"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={!withdrawalOpen}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting || qrUploading}
                  disabled={!withdrawalOpen}
                >
                  <Upload className="h-4 w-4" /> Submit Withdrawal Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Withdrawal Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Minimum amount</span>
                <span className="font-medium text-foreground">{minWithdrawal} points</span>
              </div>
              <div className="flex justify-between">
                <span>Conversion</span>
                <span className="font-medium text-foreground">1 point = NPR 1</span>
              </div>
              <div className="flex justify-between">
                <span>Current balance</span>
                <span className={`font-medium ${balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>{balance.toLocaleString()} pts</span>
              </div>
            </CardContent>
          </Card>

          <Alert variant="info">
            <p>
              Your points are <strong>not deducted</strong> when you submit a withdrawal request.
              Points are deducted only after the admin <strong>approves</strong> your request.
            </p>
          </Alert>

          {!canWithdraw && balance >= 0 && (
            <Alert variant="warning">
              You need at least {minWithdrawal} available points to withdraw. Keep submitting
              content to earn more points.
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Method</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMethod ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedMethod}</p>
                    <p className="text-xs text-muted-foreground">{methods.find((m) => m.name === selectedMethod)?.description}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment methods configured.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}