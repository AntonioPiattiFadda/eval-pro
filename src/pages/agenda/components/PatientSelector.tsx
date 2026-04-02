import { useState, useRef, useEffect } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchPatientsByName, type Patient } from '../services/patients.service'

interface Props {
  selectedPatient: Patient | null
  onSelect: (patient: Patient | null) => void
  onNewPatient: () => void
}

export function PatientSelector({ selectedPatient, onSelect, onNewPatient }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current
      setLoading(true)
      try {
        const data = await searchPatientsByName(value)
        if (seq === seqRef.current) {
          setResults(data)
          setOpen(true)
        }
      } finally {
        if (seq === seqRef.current) setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (patient: Patient) => {
    onSelect(patient)
    setQuery('')
    setOpen(false)
  }

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant">
        <div>
          <p className="text-sm font-medium text-foreground">{selectedPatient.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{selectedPatient.email ?? '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar paciente por nombre…"
          className="pl-8"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-outline-variant bg-surface-container shadow-lg overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
          )}
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex flex-col items-start px-3 py-2 text-sm hover:bg-surface-container-high transition-colors"
            >
              <span className="font-medium text-foreground">{p.full_name ?? '—'}</span>
              <span className="text-xs text-muted-foreground">{p.email ?? '—'}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onNewPatient}
        className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Paciente nuevo
      </button>
    </div>
  )
}
