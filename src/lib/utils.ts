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

export function cefrColor(level: string | null): string {
  switch (level) {
    case 'A1': return 'bg-green-500'
    case 'A2': return 'bg-green-400'
    case 'B1': return 'bg-yellow-500'
    case 'B2': return 'bg-orange-500'
    case 'C1': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}
