import { Toaster as Sonner } from 'sonner'
import { toast } from 'sonner'

// Extend error duration so users have time to read
const originalError = toast.error.bind(toast)
toast.error = (message, options) =>
  originalError(message, { duration: 16000, ...options })

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      closeButton
      toastOptions={{
        style: {
          background: 'var(--color-card)',
          color: 'var(--color-card-foreground)',
          border: '1px solid var(--color-border)',
        },
        classNames: {
          closeButton: '!left-auto !right-1 !top-4',
          success: '[&>[data-icon]]:text-green-400',
          error: '[&>[data-icon]]:text-destructive',
          loading: '[&>[data-icon]]:text-muted-foreground',
          info: '[&>[data-icon]]:text-primary',
        },
      }}
      {...props}
    />
  )
}
