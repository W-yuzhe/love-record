interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100))
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm text-white/70">
        <span>{label || `${current}/${total}`}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-love-gradient transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
