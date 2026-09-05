interface ChipProps {
  label: string
  active?: boolean
  onClick?: () => void
  icon?: React.ReactNode
}

export function Chip({ label, active = false, onClick, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-star-pink to-star-rose text-white shadow-glow'
          : 'border border-glass-border bg-glass text-white/80 hover:bg-glass-hover hover:text-white',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
