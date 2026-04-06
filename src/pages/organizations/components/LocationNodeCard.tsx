import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dumbbell, HeartPulse, Stethoscope, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteLocation } from '../services/locations.service'
import { type Location, LOCATION_TYPE_LABELS, LOCATION_TYPE_COLORS } from '../types/location.types'

const LOCATION_ICONS = {
  GYM: Dumbbell,
  REHAB_CENTER: HeartPulse,
  CLINIC: Stethoscope,
}

interface Props {
  location: Location
  orgId: string
}

export function LocationNodeCard({ location, orgId }: Props) {
  const queryClient = useQueryClient()
  const color = LOCATION_TYPE_COLORS[location.type]
  const Icon = LOCATION_ICONS[location.type]

  const toastId = `delete-location-${location.location_id}`

  const { mutate: remove, isPending } = useMutation({
    mutationFn: () => deleteLocation(location.location_id),
    onMutate: () => { toast.loading(`Eliminando "${location.name}"…`, { id: toastId }) },
    onSuccess: () => {
      toast.success(`"${location.name}" eliminada`, { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['locations', orgId] })
    },
    onError: (err: Error) => toast.error(err.message, { id: toastId }),
  })

  return (
    <div className="flex flex-col items-center">
      {/* Connector */}
      <div className="w-px h-8" style={{ backgroundColor: 'var(--color-outline-variant)' }} />

      {/* Card */}
      <div
        className="group relative w-52 rounded-2xl border border-outline-variant bg-surface-container overflow-hidden transition-all duration-200 hover:border-outline hover:shadow-lg"
        style={{ borderTopColor: color, borderTopWidth: '3px' }}
      >
        {/* Type badge */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              color,
              borderColor: color + '40',
              backgroundColor: color + '15',
            }}
          >
            {LOCATION_TYPE_LABELS[location.type]}
          </span>
        </div>

        {/* Icon + name */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 mt-1">
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {location.name}
            </p>
          </div>
        </div>

        {/* Delete on hover */}
        <button
          onClick={() => remove()}
          disabled={isPending}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-6 h-6 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive disabled:pointer-events-none"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
