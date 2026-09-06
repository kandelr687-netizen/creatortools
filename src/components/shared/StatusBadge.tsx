import { Badge } from "@/components/ui/badge"
import type { SubmissionStatus, WithdrawalStatus } from "@/types"

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const config: Record<SubmissionStatus, { label: string; variant: "warning" | "success" | "destructive" }> = {
    pending: { label: "Pending Review", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    rejected: { label: "Rejected", variant: "destructive" },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const config: Record<WithdrawalStatus, { label: string; variant: "warning" | "success" | "destructive" | "secondary" }> = {
    pending: { label: "Processing", variant: "warning" },
    approved: { label: "Paid", variant: "success" },
    rejected: { label: "Rejected", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "secondary" },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function RoleBadge({ role }: { role: 'customer' | 'admin' }) {
  return <Badge variant={role === 'admin' ? 'destructive' : 'secondary'}>{role === 'admin' ? 'Admin' : 'Creator'}</Badge>
}

export function UserStatusBadge({ status }: { status: 'active' | 'suspended' | 'banned' }) {
  const config = {
    active: { label: "Active", variant: "success" as const },
    suspended: { label: "Suspended", variant: "warning" as const },
    banned: { label: "Banned", variant: "destructive" as const },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function EventStatusBadge({ isOpen }: { isOpen: boolean }) {
  return <Badge variant={isOpen ? 'success' : 'destructive'}>{isOpen ? 'OPEN' : 'CLOSED'}</Badge>
}
