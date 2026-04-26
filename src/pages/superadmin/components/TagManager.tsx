import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Plus, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listExerciseTags, createExerciseTag, deleteExerciseTag } from '@/service/exerciseTags.service'

const TOAST_CREATE = 'create-exercise-tag'
const TOAST_DELETE = 'delete-exercise-tag'

interface TagManagerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function TagManager({ open, onOpenChange }: TagManagerProps) {
  const [input, setInput] = useState('')
  const queryClient = useQueryClient()

  const { data: tags = [] } = useQuery({
    queryKey: ['exercise-tags'],
    queryFn: listExerciseTags,
    staleTime: 60_000,
  })

  const createMutation = useMutation({
    mutationFn: createExerciseTag,
    onMutate: () => { toast.loading('Creando etiqueta…', { id: TOAST_CREATE }) },
    onSuccess: () => {
      toast.success('Etiqueta creada', { id: TOAST_CREATE })
      queryClient.invalidateQueries({ queryKey: ['exercise-tags'] })
      setInput('')
    },
    onError: (err: Error) => { toast.error(err.message, { id: TOAST_CREATE }) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExerciseTag,
    onMutate: () => { toast.loading('Eliminando…', { id: TOAST_DELETE }) },
    onSuccess: () => {
      toast.success('Etiqueta eliminada', { id: TOAST_DELETE })
      queryClient.invalidateQueries({ queryKey: ['exercise-tags'] })
    },
    onError: (err: Error) => { toast.error(err.message, { id: TOAST_DELETE }) },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    createMutation.mutate(name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Gestionar etiquetas
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="Nueva etiqueta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={createMutation.isPending || !input.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 min-h-[52px]">
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay etiquetas todavía.</p>
          )}
          {tags.map((tag) => (
            <span
              key={tag.tag_id}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => deleteMutation.mutate(tag.tag_id)}
                disabled={deleteMutation.isPending}
                className="rounded-full p-0.5 hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
