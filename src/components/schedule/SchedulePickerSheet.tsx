import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MoreHorizontal, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { Button } from '@/components/ui/Button'
import type { SavedScheduleRecord } from '@/types/schedule'

export type SchedulePickerMode = 'list' | 'create' | 'trash'

export interface SchedulePickerPanelProps {
  activeSchedule: SavedScheduleRecord | null
  schedules: SavedScheduleRecord[]
  deletedSchedules: SavedScheduleRecord[]
  periodName: string | null
  periodLabelsById?: Record<string, string>
  careerLabelsById?: Record<string, string>
  onSelect: (scheduleId: string) => void
  onCreate: (name: string, copyFromScheduleId?: string | null) => void
  onRename: (scheduleId: string, name: string) => void
  onDelete: (scheduleId: string) => void
  onRestore: (scheduleId: string) => void
  onPermanentDelete: (scheduleId: string) => void
  onClose: () => void
  open: boolean
  embedded?: boolean
  /** When embedding inside a parent navigator, hide the panel chrome header. */
  hideChrome?: boolean
  initialMode?: SchedulePickerMode
  onModeChange?: (mode: SchedulePickerMode) => void
  onRequestCareerPeriod?: (scheduleId: string) => void
  onDuplicate?: (scheduleId: string) => void
  onShare?: (scheduleId: string) => void
  showManageFooter?: boolean
  manageLabel?: string
  onManage?: () => void
}

export function SchedulePickerPanel({
  activeSchedule,
  schedules,
  deletedSchedules,
  periodLabelsById = {},
  careerLabelsById = {},
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
  onClose,
  open,
  embedded = false,
  hideChrome = false,
  initialMode = 'list',
  onModeChange,
  onRequestCareerPeriod,
  onDuplicate,
  onShare,
  showManageFooter = false,
  manageLabel = 'Administrar horarios',
  onManage,
}: SchedulePickerPanelProps) {
  const [mode, setMode] = useState<SchedulePickerMode>(initialMode)
  const [newName, setNewName] = useState('')
  const [copyCurrent, setCopyCurrent] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  function updateMode(next: SchedulePickerMode) {
    setMode(next)
    onModeChange?.(next)
  }

  useEffect(() => {
    if (!open) {
      setMode('list')
      setNewName('')
      setCopyCurrent(false)
      setEditingId(null)
      setOpenMenuId(null)
      return
    }
    setMode(initialMode)
  }, [open, initialMode])

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
    <div
      className={
        embedded
          ? 'flex w-full flex-col overflow-hidden'
          : 'flex max-h-[min(70vh,400px)] w-[min(18.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl'
      }
    >
      {!hideChrome && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          {mode === 'list' && (
            <>
              <p className="min-w-0 truncate text-sm text-text">Tus horarios</p>
              <button
                type="button"
                onClick={() => updateMode('create')}
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
                onClick={() => updateMode('list')}
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
                onClick={() => updateMode('list')}
                className="text-xs text-muted transition hover:text-text"
              >
                Volver
              </button>
            </>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {mode === 'list' && (
          <div className="space-y-1">
            {schedules.map((schedule) => {
              const isActive = schedule.id === activeSchedule?.id
              const isEditing = editingId === schedule.id
              const periodLabel = periodLabelsById[schedule.academicPeriodId]
              const careerLabel = schedule.selectedCareerId
                ? careerLabelsById[schedule.selectedCareerId]
                : undefined
              const meta = [careerLabel, periodLabel].filter(Boolean).join(' · ')

              return (
                <div
                  key={schedule.id}
                  className={`rounded-xl px-2.5 py-2 transition ${
                    isActive
                      ? 'bg-primary/[0.04] ring-1 ring-primary/15'
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
                          <p className="truncate text-[13px] font-semibold text-slate-800">
                            {schedule.name}
                          </p>
                          {isActive && (
                            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                              En uso
                            </span>
                          )}
                        </div>
                        {meta ? (
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">{meta}</p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-slate-400">Sin carrera · periodo</p>
                        )}
                      </button>

                      <ScheduleItemMenu
                        scheduleName={schedule.name}
                        open={openMenuId === schedule.id}
                        onOpenChange={(next) => setOpenMenuId(next ? schedule.id : null)}
                        onRename={() => {
                          setEditingId(schedule.id)
                          setEditingName(schedule.name)
                          setOpenMenuId(null)
                        }}
                        onChangeCareerPeriod={() => {
                          setOpenMenuId(null)
                          onRequestCareerPeriod?.(schedule.id)
                        }}
                        onDuplicate={() => {
                          setOpenMenuId(null)
                          onDuplicate?.(schedule.id)
                        }}
                        onShare={() => {
                          setOpenMenuId(null)
                          onShare?.(schedule.id)
                        }}
                        onDelete={() => {
                          onDelete(schedule.id)
                          setOpenMenuId(null)
                        }}
                        showCareerPeriod={Boolean(onRequestCareerPeriod)}
                        showDuplicate={Boolean(onDuplicate)}
                        showShare={Boolean(onShare)}
                      />
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

      {mode === 'list' && showManageFooter && onManage && (
        <div className="shrink-0 border-t border-slate-100/80 px-3 py-1.5">
          <button
            type="button"
            onClick={onManage}
            className="w-full py-1.5 text-center text-[11px] text-slate-400 transition hover:text-slate-600"
          >
            {manageLabel}
          </button>
        </div>
      )}

      {mode === 'list' && !hideChrome && !showManageFooter && (
        <div className="shrink-0 border-t border-slate-100 px-3 py-1.5">
          <button
            type="button"
            onClick={() => updateMode('trash')}
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
  onChangeCareerPeriod,
  onDuplicate,
  onShare,
  onDelete,
  showCareerPeriod = false,
  showDuplicate = false,
  showShare = false,
}: {
  scheduleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: () => void
  onChangeCareerPeriod?: () => void
  onDuplicate?: () => void
  onShare?: () => void
  onDelete: () => void
  showCareerPeriod?: boolean
  showDuplicate?: boolean
  showShare?: boolean
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
          className="min-w-[11rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg"
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
            Editar nombre
          </button>
          {showCareerPeriod && onChangeCareerPeriod && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 text-left text-xs text-text hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation()
                onChangeCareerPeriod()
              }}
            >
              Cambiar carrera y periodo
            </button>
          )}
          {showDuplicate && onDuplicate && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 text-left text-xs text-text hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation()
                onDuplicate()
              }}
            >
              Duplicar horario
            </button>
          )}
          {showShare && onShare && (
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 text-left text-xs text-text hover:bg-slate-50"
              onClick={(event) => {
                event.stopPropagation()
                onShare()
              }}
            >
              Compartir link
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-1.5 text-left text-xs text-danger hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            Eliminar horario
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
  compact?: boolean
}

const SELECTABLE_PILL_BASE =
  'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50/90 active:bg-slate-100/70'

function selectablePillClass(open: boolean, compact = false): string {
  const base = compact
    ? 'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-left text-xs transition hover:border-slate-300 hover:bg-slate-50/90 active:bg-slate-100/70'
    : SELECTABLE_PILL_BASE

  return `${base} ${
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
  compact = false,
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
            ? selectablePillClass(open, compact)
            : embeddedCapsule
              ? 'rounded-md px-0.5 py-0.5'
              : ''
        }`}
        aria-label="Cambiar horario"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span
          className={`truncate tracking-tight ${
            titleClassName ??
            (pill || embedded
              ? compact
                ? 'text-xs font-medium text-slate-800'
                : 'text-sm font-semibold text-slate-800'
              : 'font-semibold text-text')
          }`}
        >
          {scheduleName}
        </span>
        <ChevronDown
          className={`shrink-0 text-slate-400/80 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-slate-500 ${
            compact ? 'h-2.5 w-2.5' : embedded ? 'h-3 w-3' : 'h-3.5 w-3.5 text-muted/70 group-hover:text-muted'
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
