import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export function GradientButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: GradientButtonProps) {
  const base =
    'relative overflow-hidden rounded-full px-8 py-3 font-medium text-white transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'
  const primary =
    'bg-love-gradient shadow-[0_4px_24px_rgba(255,107,157,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,107,157,0.45)]'
  const secondary =
    'border border-glass-border bg-glass backdrop-blur-glass hover:bg-glass-hover'

  return (
    <button className={`${base} ${variant === 'primary' ? primary : secondary} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-white/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}
