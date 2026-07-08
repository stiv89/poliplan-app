import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-surface text-text border border-slate-200 hover:bg-slate-50',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
