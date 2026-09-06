import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "destructive" | "warning" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    success: "bg-success/10 text-green-700 border-success/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-warning/20 text-amber-700 border-warning/30",
    outline: "text-foreground border-border",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
