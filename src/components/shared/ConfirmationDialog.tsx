import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "success"
  loading?: boolean
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading,
}: ConfirmationDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex items-start gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          variant === 'destructive' ? 'bg-red-50 text-red-600' :
          variant === 'success' ? 'bg-green-50 text-green-600' :
          'bg-primary/10 text-primary'
        }`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : variant === 'success' ? 'success' : 'default'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
