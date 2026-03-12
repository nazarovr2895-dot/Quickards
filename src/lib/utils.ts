export function endOfToday(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function pluralCards(n: number): string {
  if (n === 1) return '1 card'
  return `${n} cards`
}

export function cefrColor(level: string | null): { background: string } {
  switch (level) {
    case 'A1': return { background: 'linear-gradient(135deg, #22c55e, #16a34a)' }
    case 'A2': return { background: 'linear-gradient(135deg, #4ade80, #22c55e)' }
    case 'B1': return { background: 'linear-gradient(135deg, #eab308, #f59e0b)' }
    case 'B2': return { background: 'linear-gradient(135deg, #f97316, #ea580c)' }
    case 'C1': return { background: 'linear-gradient(135deg, #ef4444, #dc2626)' }
    default:   return { background: 'linear-gradient(135deg, #9ca3af, #6b7280)' }
  }
}
