export function getMonthsBetween(startDate: string) {
  const start = new Date(startDate)
  const now = new Date()
  const months: { key: string; monthName: string; year: string; label: string }[] = []

  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    months.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      monthName: monthNames[current.getMonth()],
      year: String(year),
      label: `${monthNames[current.getMonth()]} ${year}`,
    })
    current.setMonth(current.getMonth() + 1)
  }

  return months.reverse()
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${names[month - 1]} ${year}`
}
