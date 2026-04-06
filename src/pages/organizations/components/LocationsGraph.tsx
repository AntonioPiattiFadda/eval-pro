import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLocationsForOrg, getUserOrg } from '../services/locations.service'
import { LocationNodeCard } from './LocationNodeCard'
import { AddLocationGhostNode } from './AddLocationGhostNode'

export function LocationsGraph() {
  const { user } = useAuth()

  const { data: orgData } = useQuery({
    queryKey: ['user-org', user?.id],
    queryFn: () => getUserOrg(user!.id),
    enabled: !!user?.id,
  })

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', orgData?.organization_id],
    queryFn: () => getLocationsForOrg(orgData!.organization_id),
    enabled: !!orgData?.organization_id,
  })

  // ── Grab-to-pan ───────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const startScrollLeft = useRef(0)
  const startScrollTop = useRef(0)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setIsScrollable(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [locations])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrollable) return
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    startScrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    startScrollTop.current = scrollRef.current?.scrollTop ?? 0
    setIsGrabbing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !scrollRef.current) return
      scrollRef.current.scrollLeft = startScrollLeft.current - (e.clientX - startX.current)
      scrollRef.current.scrollTop = startScrollTop.current - (e.clientY - startY.current)
    }
    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      setIsGrabbing(false)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-outline-variant"
      style={{
        backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundColor: 'var(--color-surface-container-low)',
      }}
    >
      <div
        ref={scrollRef}
        className="overflow-auto select-none p-16 noWebKitScrollbar"
        style={{
          height: '75vh',
          cursor: isGrabbing ? 'grabbing' : isScrollable ? 'grab' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col items-center min-w-max">

          {/* Org root node */}
          <div data-no-drag className="relative w-full max-w-sm cursor-default">
            <div
              className="bg-surface-container-high rounded-2xl border border-outline-variant px-5 py-4 flex flex-col gap-3"
              style={{ borderTopColor: 'var(--color-primary)', borderTopWidth: '3px' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {orgData?.organization_name ?? 'Mi Organización'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isLoading ? '…' : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical connector to row */}
          <div className="w-px h-8 bg-outline-variant" />

          {/* Locations row */}
          <div className="relative">
            {locations.length > 0 && (
              <div className="absolute top-8 left-0 right-0 h-px bg-outline-variant" />
            )}
            <div className="flex items-start gap-16 px-4">
              {locations.map((loc) => (
                <div key={loc.location_id} data-no-drag className="cursor-default">
                  <LocationNodeCard location={loc} orgId={orgData!.organization_id} />
                </div>
              ))}
              <div data-no-drag className="flex flex-col items-center cursor-default">
                <div className="w-px h-8" style={{ backgroundColor: 'var(--color-outline-variant)' }} />
                <AddLocationGhostNode orgId={orgData?.organization_id ?? ''} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
