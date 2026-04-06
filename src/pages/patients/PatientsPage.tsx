import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RegisterPatientDialog } from '@/components/RegisterPatientDialog'
import { useAuth } from '@/contexts/AuthContext'
import { PatientsTable } from './components/PatientsTable'
import { usePatientsSearch } from './hooks/usePatientsSearch'

export function PatientsPage() {
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const organizationId = profile?.organization_id ?? ''

  const {
    data,
    isFetching,
    pageIndex,
    hasNextPage,
    hasSearch,
    goToNextPage,
    goToPrevPage,
  } = usePatientsSearch(query, organizationId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-on-surface">Pacientes</h1>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email o DNI…"
          className="pl-10"
        />
      </div>

      {/* Content */}
      {!hasSearch ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="rounded-full bg-surface-container-high p-5">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-on-surface">Buscá un paciente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escribí el nombre, email o DNI para comenzar
            </p>
          </div>
        </div>
      ) : (
        <PatientsTable
          data={data}
          isFetching={isFetching}
          pageIndex={pageIndex}
          hasNextPage={hasNextPage}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
        />
      )}

      {/* Register dialog */}
      <RegisterPatientDialog
        organizationId={organizationId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patients-search'] })
        }}
      />
    </div>
  )
}
