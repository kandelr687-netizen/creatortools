import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  icon,
  label,
  value,
  sub,
  variant = "default",
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
  variant?: "default" | "primary" | "success" | "warning" | "destructive"
}) {
  const iconColor = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-green-600",
    warning: "bg-warning/20 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  }[variant]

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function QuickActionCard({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
