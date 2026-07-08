import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, MoreHorizontal, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { Button } from '@/components/ui/Button'
import type { SavedScheduleRecord } from '@/types/schedule'

export interface SchedulePickerPanelProps {
  activeSchedule: SavedScheduleRecord | null
  schedules: SavedScheduleRecord[]
  deletedSchedules: SavedScheduleRecord[]
  periodName: string | null
  periodLabelsById?: Record<string, string>
  onSelect: (scheduleId: string) => void
  onCreate: (name: string, copyFromScheduleId?: string | null) => void
  onRename: (scheduleId: string, name: string) => void
  onDelete: (scheduleId: string) => void
  onRestore: (scheduleId: string) => void
  onPermanentDelete: (scheduleId: string) => void
  onClose: () => void
  open: boolean
}

export function SchedulePickerPanel({
  activeSchedule,
  schedules,
  deletedSchedules,
  periodLabelsById = {},
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
  onClose,
  open,
}: SchedulePickerPanelProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'trash'>('list')
  const [newName, setNewName] = useState('')
  const [copyCurrent, setCopyCurrent] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setMode('list')
      setNewName('')
      setCopyCurrent(false)
      setEditingId(null)
      setOpenMenuId(null)
    }
  }, [open])

  useEffect(() => {
    if (!openMenuId) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest('[data-schedule-menu]')) return
      setOpenMenuId(null)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [openMenuId])

  return (
    <div className="flex max-h-[min(70vh,400px)] w-[min(18.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        {mode === 'list' && (
          <>
            <p className="min-w-0 truncate text-sm text-text">Tus horarios</p>
            <button
              type="button"
              onClick={() => setMode('create')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-muted transition hover:border-slate-300 hover:bg-slate-50 hover:text-text"
              aria-label="Nuevo horario"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </>
        )}
        {mode === 'create' && (
          <>
            <p className="text-sm font-medium text-text">Nuevo horario</p>
            <button
              type="button"
              onClick={() => setMode('list')}
              className="text-xs text-muted transition hover:text-text"
            >
              Volver
            </button>
          </>
        )}
        {mode === 'trash' && (
          <>
            <p className="text-sm font-medium text-text">Eliminados</p>
            <button
              type="button"
              onClick={() => setMode('list')}
              className="text-xs text-muted transition hover:text-text"
            >
              Volver
            </button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {mode === 'list' && (
          <div className="space-y-0.5">
            {schedules.map((schedule) => {
              const isActive = schedule.id === activeSchedule?.id
              const isEditing = editingId === schedule.id
              const periodLabel = periodLabelsById[schedule.academicPeriodId]

              return (
                <div
                  key={schedule.id}
                  className={`rounded-lg px-2 py-1.5 ${
                    isActive
                      ? 'bg-primary/[0.04] ring-1 ring-primary/20'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && editingName.trim()) {
                            onRename(schedule.id, editingName)
                            setEditingId(null)
                          }
                          if (event.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <Button
                        className="shrink-0 px-2 py-1 text-xs"
                        onClick={() => {
                          onRename(schedule.id, editingName)
                          setEditingId(null)
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="min-w-0 flex-1 py-0.5 text-left"
                        onClick={() => {
                          onSelect(schedule.id)
                          onClose()
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-text">
                            {schedule.name}
                          </p>
                          {isActive && (
                            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              En uso
                            </span>
                          )}
                        </div>
                        {periodLabel && (
                          <p className="mt-0.5 truncate text-[11px] text-muted">{periodLabel}</p>
                        )}
                        {!isActive && !periodLabel && (
                          <p className="mt-0.5 text-[11px] text-muted/80">Tocá para cambiar</p>
                        )}
                      </button>

                      <div className="flex shrink-0 items-center gap-0.5">
                        {isActive && (
                          <Check
                            className="h-4 w-4 text-primary"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        )}
                        <ScheduleItemMenu
                          scheduleName={schedule.name}
                          open={openMenuId === schedule.id}
                          onOpenChange={(next) => setOpenMenuId(next ? schedule.id : null)}
                          onRename={() => {
                            setEditingId(schedule.id)
                            setEditingName(schedule.name)
                            setOpenMenuId(null)
                          }}
                          onDelete={() => {
                            onDelete(schedule.id)
                            setOpenMenuId(null)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {schedules.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-muted">
                No tenés horarios activos. Creá uno nuevo.
              </p>
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3 px-1">
            <label className="block text-xs text-muted" htmlFor="schedule-name">
              Nombre del horario
            </label>
            <input
              id="schedule-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ej. Plan mañana, Sin conflictos…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <label className="flex items-center gap-2 text-xs text-text">
              <input
                type="checkbox"
                checked={copyCurrent}
                onChange={(event) => setCopyCurrent(event.target.checked)}
              />
              Copiar materias del horario actual
            </label>
            <Button
              className="w-full justify-center py-2 text-sm"
              onClick={() => {
                onCreate(newName, copyCurrent ? activeSchedule?.id : null)
                onClose()
              }}
              disabled={!newName.trim()}
            >
              Crear horario
            </Button>
          </div>
        )}

        {mode === 'trash' && (
          <div className="space-y-0.5">
            {deletedSchedules.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-muted">
                No hay horarios eliminados.
              </p>
            ) : (
              deletedSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{schedule.name}</p>
                    <p className="text-[11px] text-muted/80">Eliminado</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[11px] text-primary hover:bg-primary/5"
                      onClick={() => onRestore(schedule.id)}
                    >
                      <RotateCcw className="mr-1 inline h-3 w-3" />
                      Recuperar
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-danger"
                      aria-label={`Eliminar ${schedule.name} permanentemente`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar "${schedule.name}" para siempre? No se puede deshacer.`,
                          )
                        ) {
                          onPermanentDelete(schedule.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {mode === 'list' && (
        <div className="shrink-0 border-t border-slate-100 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setMode('trash')}
            className="w-full py-1 text-center text-[11px] text-muted/70 transition hover:text-muted"
          >
            Ver eliminados
            {deletedSchedules.length > 0 && (
              <span className="text-muted/50"> · {deletedSchedules.length}</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function ScheduleItemMenu({
  scheduleName,
  open,
  onOpenChange,
  onRename,
  onDelete,
}: {
  scheduleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: () => void
  onDelete: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  return (
    <div data-schedule-menu>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpenChange(!open)
        }}
        className="rounded-md p-1.5 text-muted transition hover:bg-slate-100 hover:text-text"
        aria-label={`Opciones de ${scheduleName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={menuRef}
        align="right"
        offset={4}
      >
        <div
          role="menu"
          data-schedule-menu
          className="min-w-[8.5rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-1.5 text-left text-xs text-text hover:bg-slate-50"
            onClick={(event) => {
              event.stopPropagation()
              onRename()
            }}
          >
            Renombrar
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-1.5 text-left text-xs text-danger hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            Eliminar
          </button>
        </div>
      </AnimatedPopover>
    </div>
  )
}

interface SchedulePickerMenuProps extends Omit<SchedulePickerPanelProps, 'onClose' | 'open'> {
  scheduleName: string
  titleClassName?: string
  embedded?: boolean
  /** @deprecated Usar pill */
  embeddedCapsule?: boolean
  pill?: boolean
}

const SELECTABLE_PILL_BASE =
  'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50/90 active:bg-slate-100/70'

function selectablePillClass(open: boolean): string {
  return `${SELECTABLE_PILL_BASE} ${
    open
      ? 'border-slate-300 bg-slate-50 ring-1 ring-slate-200/70'
      : 'border-slate-200/90'
  }`
}

export function SchedulePickerMenu({
  scheduleName,
  periodName,
  titleClassName = 'text-xl',
  embedded = false,
  embeddedCapsule = false,
  pill = false,
  ...panelProps
}: SchedulePickerMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group flex max-w-full items-center gap-1 text-left ${
          pill
            ? selectablePillClass(open)
            : embeddedCapsule
              ? 'rounded-md px-0.5 py-0.5'
              : ''
        }`}
        aria-label="Cambiar horario"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <h1
          className={`truncate tracking-tight ${
            pill || embedded ? 'text-sm font-semibold text-slate-800' : 'font-semibold text-text'
          } ${titleClassName}`}
        >
          {scheduleName}
        </h1>
        <ChevronDown
          className={`shrink-0 text-slate-400/80 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-slate-500 ${
            embedded ? 'h-3 w-3' : 'h-3.5 w-3.5 text-muted/70 group-hover:text-muted'
          } ${open ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        />
      </button>
      {!embedded && periodName && (
        <p className="mt-0.5 truncate text-xs text-muted/70">{periodName}</p>
      )}

      <AnimatedPopover open={open} anchorRef={buttonRef} popoverRef={popoverRef} align="left">
        <SchedulePickerPanel
          {...panelProps}
          periodName={periodName}
          open={open}
          onClose={() => setOpen(false)}
        />
      </AnimatedPopover>
    </div>
  )
}

export { ScheduleUndoToast } from './SchedulePickerUndoToast'
