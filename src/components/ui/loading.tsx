import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingState({ className, message = "Loading..." }: { className?: string; message?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-muted-foreground", className)}>
      <Loader2 className="h-8 w-8 animate-spin mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Creators Point...</p>
      </div>
    </div>
  )
}
