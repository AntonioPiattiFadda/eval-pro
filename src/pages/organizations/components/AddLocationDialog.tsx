import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createLocation } from '../services/locations.service'
import {
  type LocationType,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPE_COLORS,
} from '../types/location.types'

const LOCATION_TYPES: LocationType[] = ['GYM', 'REHAB_CENTER', 'CLINIC']

interface Props {
  orgId: string
  trigger?: React.ReactNode
}

export function AddLocationDialog({ orgId, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<LocationType>('CLINIC')

  const queryClient = useQueryClient()

  const toastId = 'add-location'

  const { mutate, isPending } = useMutation({
    mutationFn: () => createLocation({ name: name.trim(), type, organization_id: orgId }),
    onMutate: () => { toast.loading('Creando location…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Location creada', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['locations', orgId] })
      setOpen(false)
      setName('')
      setType('CLINIC')
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus />
            Nueva location
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            Nueva Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Nombre</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Sede Centro"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex flex-col gap-2">
              {LOCATION_TYPES.map((t) => {
                const color = LOCATION_TYPE_COLORS[t]
                const selected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150"
                    style={{
                      borderColor: selected ? color : 'var(--color-outline-variant)',
                      backgroundColor: selected ? color + '18' : 'var(--color-surface-container-high)',
                      color: selected ? color : 'var(--color-on-surface-variant)',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {LOCATION_TYPE_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
              {isPending ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
