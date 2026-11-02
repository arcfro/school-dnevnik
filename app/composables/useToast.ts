export type ToastKind = 'error' | 'success'

export type ToastItem = {
  id: number
  message: string
  kind: ToastKind
}

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])
  const seq = useState('toast-seq', () => 0)

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message: string, kind: ToastKind = 'error') {
    seq.value += 1
    const id = seq.value
    toasts.value = [...toasts.value, { id, message, kind }]
    setTimeout(() => dismiss(id), 4000)
  }

  return {
    toasts,
    show,
    dismiss,
    error: (message: string) => show(message, 'error'),
    success: (message: string) => show(message, 'success'),
  }
}
