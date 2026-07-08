import type { RefObject } from 'react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import {
  ClassBlockDetail,
  type ClassBlockInfo,
} from '@/components/schedule/ClassBlockDetail'
import type { CourseSection } from '@/types/academic'

interface ClassBlockPopoverLayerProps {
  activeBlock: ClassBlockInfo | null
  anchorRef: RefObject<HTMLElement | null>
  popoverRef: RefObject<HTMLDivElement | null>
  sectionsById: Map<string, CourseSection>
  coursesById: Map<string, { name: string; code: string | null }>
  removingId: string | null
  onClose: () => void
  onRemove: (sectionId: string) => void
  onViewAlternatives?: (courseId: string) => void
  onPopoverMouseEnter: () => void
  onPopoverMouseLeave: () => void
}

export function ClassBlockPopoverLayer({
  activeBlock,
  anchorRef,
  popoverRef,
  sectionsById,
  coursesById,
  removingId,
  onClose,
  onRemove,
  onViewAlternatives,
  onPopoverMouseEnter,
  onPopoverMouseLeave,
}: ClassBlockPopoverLayerProps) {
  return (
    <AnimatedPopover
      open={Boolean(activeBlock)}
      anchorRef={anchorRef}
      popoverRef={popoverRef}
      align="left"
      offset={6}
      strategy={
        activeBlock?.hasConflict && activeBlock.conflictDetails.length > 0
          ? 'viewport'
          : 'anchor'
      }
      className="max-w-[min(18rem,calc(100vw-1.5rem))]"
    >
      {activeBlock && (
        <div onMouseEnter={onPopoverMouseEnter} onMouseLeave={onPopoverMouseLeave}>
          <ClassBlockDetail
            block={activeBlock}
            sectionsById={sectionsById}
            coursesById={coursesById}
            onClose={onClose}
            onRemove={onRemove}
            onViewAlternatives={onViewAlternatives}
            removingId={removingId}
          />
        </div>
      )}
    </AnimatedPopover>
  )
}
