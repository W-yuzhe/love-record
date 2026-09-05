import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-glass',
        'shadow-glass transition-all duration-300',
        hover && 'hover:bg-glass-hover hover:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.12)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
