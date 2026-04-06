import { Plus } from 'lucide-react'
import { AddLocationDialog } from './AddLocationDialog'

export function AddLocationGhostNode({ orgId }: { orgId: string }) {
  return (
    <div className="flex flex-col items-center">
      <AddLocationDialog
        orgId={orgId}
        trigger={
          <div
            className="group flex flex-col items-center justify-center gap-2 w-52 rounded-2xl border border-dashed border-outline-variant cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5"
            style={{ minHeight: '100px' }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl border border-outline-variant bg-surface-container-high group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-200">
              <Plus className="h-4 w-4 text-on-surface-variant group-hover:text-primary transition-colors duration-200" />
            </div>
            <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors duration-200">
              Nueva location
            </span>
          </div>
        }
      />
    </div>
  )
}
