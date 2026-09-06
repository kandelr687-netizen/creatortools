import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react"

type AlertVariant = "info" | "warning" | "success" | "error"

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const icons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
}

const styles: Record<AlertVariant, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4", styles[variant], className)}>
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
