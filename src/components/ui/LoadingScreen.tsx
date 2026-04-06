export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className="font-display font-bold tracking-[0.3em] uppercase text-sm"
          style={{ color: 'var(--color-primary)' }}
        >
          EVALPRO
        </span>
        <div
          className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: 'var(--color-primary)',
            borderRightColor: 'var(--color-primary)',
          }}
        />
      </div>
    </div>
  )
}
