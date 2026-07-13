import type { TeacherGender } from '@/utils/iinTeacherReviewWizard'
import manAvatar from '../../../logos/men.png'
import womanAvatar from '../../../logos/woman.png'

interface TeacherPersonAvatarProps {
  gender: TeacherGender
  className?: string
}

export function TeacherPersonAvatar({ gender, className = '' }: TeacherPersonAvatarProps) {
  const src = gender === 'female' ? womanAvatar : manAvatar

  return (
    <img
      src={src}
      alt=""
      width={44}
      height={44}
      draggable={false}
      className={`h-11 w-11 shrink-0 select-none object-contain ${className}`}
      aria-hidden="true"
    />
  )
}
