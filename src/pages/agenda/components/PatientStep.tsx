import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RegisterPatientForm } from '@/components/RegisterPatientForm'
import { searchPatients, type Patient } from '../services/patients.service'

type State = 'idle' | 'searching' | 'not_found' | 'registering'

interface Props {
  selectedPatient: Patient | null
  organizationId: string
  onSelect: (patient: Patient) => void
  onClear: () => void
}

export function PatientStep({ selectedPatient, organizationId, onSelect, onClear }: Props) {
  const [state, setState] = useState<State>('idle')
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

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
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
        const data = await searchPatients(value, organizationId)
        if (seq !== seqRef.current) return
        setResults(data)
        if (data.length === 0) {
          setState('not_found')
          setDropdownOpen(false)
        } else {
          setState('searching')
          setDropdownOpen(true)
        }
      } catch {
        if (seq === seqRef.current) setState('idle')
      } finally {
        if (seq === seqRef.current) setLoading(false)
      }
    }, 300)
  }

  const handleSelectFromDropdown = (patient: Patient) => {
    setDropdownOpen(false)
    setQuery('')
    onSelect(patient)
  }

  const handleBackToIdle = () => {
    setQuery('')
    setResults([])
    setState('idle')
  }

  // Selected state
  if (selectedPatient) {
    const { full_name, email: patEmail, identification_number } = selectedPatient.user
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant">
        <div>
          <p className="text-sm font-medium text-foreground">{full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {patEmail ?? '—'}
            {identification_number ? ` · ${identification_number}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cambiar
        </button>
      </div>
    )
  }

  // Registering state — uses shared form
  if (state === 'registering') {
    return (
      <RegisterPatientForm
        organizationId={organizationId}
        onSuccess={(patient) => {
          setState('idle')
          setQuery('')
          onSelect(patient)
        }}
        onCancel={handleBackToIdle}
      />
    )
  }

  // Search state (idle / searching / not_found)
  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder="Buscar por nombre, email o DNI…"
          className="pl-8"
        />
      </div>

      {dropdownOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-outline-variant bg-surface-container shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => handleSelectFromDropdown(p)}
              className={cn(
                'w-full flex flex-col items-start px-3 py-2 text-sm',
                'hover:bg-surface-container-high transition-colors'
              )}
            >
              <span className="font-medium text-foreground">{p.user.full_name ?? '—'}</span>
              <span className="text-xs text-muted-foreground">
                {p.user.email ?? '—'}
                {p.user.identification_number ? ` · ${p.user.identification_number}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {state === 'not_found' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
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
              onClick={handleBackToIdle}
            >
              × Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
