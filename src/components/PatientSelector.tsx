import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RegisterPatientForm } from '@/components/RegisterPatientForm'
import { searchPatients } from '@/service/patients.service'
import type { Patient } from '@/types/patients'

type InternalState = 'idle' | 'searching' | 'not_found' | 'registering'

interface Props {
  /** Currently selected patient */
  value: Patient | null
  organizationId: string
  /** Called when patient is selected or cleared (null = cleared) */
  onChange: (patient: Patient | null) => void
  /** Inline error message (e.g. from RHF) */
  error?: string
  placeholder?: string
}

/**
 * Global patient selector — search existing patients or register a new one on the fly.
 * Designed to work with react-hook-form Controller:
 *
 * <Controller
 *   control={control}
 *   name="patient"
 *   render={({ field, fieldState }) => (
 *     <PatientSelector
 *       value={field.value}
 *       onChange={field.onChange}
 *       organizationId={orgId}
 *       error={fieldState.error?.message}
 *     />
 *   )}
 * />
 */
export function PatientSelector({
  value,
  organizationId,
  onChange,
  error,
  placeholder = 'Buscar por nombre, email o DNI…',
}: Props) {
  const [state, setState] = useState<InternalState>('idle')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) {
      setResults([])
      setDropdownOpen(false)
      setState('idle')
      return
    }
    setState('searching')
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current
      setLoading(true)
      try {
        const data = await searchPatients(val, organizationId)
        if (seq !== seqRef.current) return
        setResults(data)
        setState(data.length === 0 ? 'not_found' : 'searching')
        setDropdownOpen(data.length > 0)
      } catch {
        if (seq === seqRef.current) setState('idle')
      } finally {
        if (seq === seqRef.current) setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (patient: Patient) => {
    setDropdownOpen(false)
    setQuery('')
    setResults([])
    setState('idle')
    onChange(patient)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setState('idle')
    onChange(null)
  }

  // ── Selected ──────────────────────────────────────────────────────────────
  if (value) {
    const { full_name, email, identification_number } = value.user
    return (
      <div className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-xl',
        'bg-surface-container-high',
        error && 'ring-1 ring-destructive'
      )}>
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{full_name ?? '—'}</p>
          <p className="text-xs text-on-surface-variant truncate">
            {email ?? '—'}
            {identification_number ? ` · ${identification_number}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="ml-3 shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Cambiar paciente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ── Registering ───────────────────────────────────────────────────────────
  if (state === 'registering') {
    return (
      <RegisterPatientForm
        organizationId={organizationId}
        onSuccess={(patient) => {
          setState('idle')
          setQuery('')
          onChange(patient)
        }}
        onCancel={() => {
          setQuery('')
          setResults([])
          setState('idle')
        }}
      />
    )
  }

  // ── Search ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant animate-spin" />
        )}
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder={placeholder}
          className={cn('pl-8', error && 'ring-1 ring-destructive')}
        />
      </div>

      {dropdownOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl bg-surface-container shadow-xl overflow-hidden">
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex flex-col items-start px-3 py-2.5 text-sm hover:bg-surface-container-high transition-colors"
            >
              <span className="font-medium text-on-surface">{p.user.full_name ?? '—'}</span>
              <span className="text-xs text-on-surface-variant">
                {p.user.email ?? '—'}
                {p.user.identification_number ? ` · ${p.user.identification_number}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {state === 'not_found' && (
        <div className="space-y-2">
          <p className="text-xs text-on-surface-variant">
            No encontramos ningún paciente con esa búsqueda.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex items-center gap-1.5"
              onClick={() => setState('registering')}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Registrar paciente nuevo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClear}
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
