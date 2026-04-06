import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Patient } from '@/types/patients'

const columnHelper = createColumnHelper<Patient>()

const columns = [
  columnHelper.accessor((row) => row.user.full_name, {
    id: 'full_name',
    header: 'Nombre',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor((row) => row.user.email, {
    id: 'email',
    header: 'Email',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.accessor((row) => row.user.identification_number, {
    id: 'identification_number',
    header: 'DNI',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.accessor('created_at', {
    header: 'Paciente desde',
    cell: (info) =>
      format(new Date(info.getValue()), "d 'de' MMM yyyy", { locale: es }),
  }),
]

interface Props {
  data: Patient[]
  isFetching: boolean
  pageIndex: number
  hasNextPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

export function PatientsTable({
  data,
  isFetching,
  pageIndex,
  hasNextPage,
  onNextPage,
  onPrevPage,
}: Props) {
  const navigate = useNavigate()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
  })

  if (isFetching) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No encontramos pacientes con esa búsqueda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-outline-variant bg-surface-container-high"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() =>
                  navigate(`/professional/patients/${row.original.patient_id}`)
                }
                className="border-b border-outline-variant last:border-0 hover:bg-surface-container-high cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">Página {pageIndex + 1}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={pageIndex === 0 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage || isFetching}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
