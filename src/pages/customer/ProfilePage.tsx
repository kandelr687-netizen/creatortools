import { useState, useRef, useEffect } from 'react'
import { User, Camera, Save, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/StatCard'
import { useAuthStore } from '@/store/auth'
import { showError, showSuccess, showInfo } from '@/components/shared/Toaster'

export function ProfilePage() {
  const { profile, refreshProfile } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
      setPhone(profile.phone || '')
      setEmail(profile.email || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleAvatarUpload = async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      showError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Image must be under 2MB.')
      return
    }
    setAvatarUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${user.id}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      showSuccess('Profile image uploaded.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      showError('Username is required.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('user_id', profile?.user_id)
      if (error) {
        if (error.message.includes('duplicate')) {
          showError('Username is already taken.')
        } else {
          showError(error.message)
        }
        return
      }
      await refreshProfile()
      showSuccess('Profile updated successfully!')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.')
      return
    }
    if (!currentPassword) {
      showError('Please enter your current password.')
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showSuccess('Password updated successfully! Please log in again.')
      await supabase.auth.signOut()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) {
      showError('Please enter your new email.')
      return
    }
    setEmailLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        showError('Please reconfirm your current password, or this email is already in use.')
        return
      }
      showInfo('Email change requested. Check your inbox (and current email) to confirm.')
      setNewEmail('')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setEmailLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information and account settings." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Image</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="w-full">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileRef.current?.click()}
                  loading={avatarUploading}
                >
                  <Camera className="h-4 w-4" /> Upload Image
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points Balance</span>
                <span className="font-semibold">{profile.points_balance.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize text-green-600">{profile.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your profile details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    placeholder="98XXXXXXXX"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                  <p className="text-xs text-muted-foreground">
                    To change your email, use the form below.
                  </p>
                </div>
                <Button type="submit" className="gap-2" loading={saving}>
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" className="gap-2" loading={passwordLoading}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Email</CardTitle>
              <CardDescription>
                We'll send a confirmation to both your current and new email addresses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    placeholder="new-email@example.com"
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" className="gap-2" loading={emailLoading}>
                  Request Email Change
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}