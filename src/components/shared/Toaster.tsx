import { Toaster, toast } from 'react-hot-toast'
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#0a0a0a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
        },
      }}
    />
  )
}

export function showSuccess(message: string) {
  toast.custom((_t) => (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-green-200 shadow-lg px-4 py-3">
      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  ))
}

export function showError(message: string) {
  toast.custom((_t) => (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-red-200 shadow-lg px-4 py-3">
      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  ))
}

export function showInfo(message: string) {
  toast.custom((_t) => (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-blue-200 shadow-lg px-4 py-3">
      <Info className="h-5 w-5 text-blue-600 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  ))
}

export function showWarning(message: string) {
  toast.custom((_t) => (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-amber-200 shadow-lg px-4 py-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  ))
}
