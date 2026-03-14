import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import './StreakCalendar.css'

interface CalendarDay {
  date: string
  count: number
}

interface CalendarResponse {
  dates: CalendarDay[]
}

interface Props {
  userId: number | undefined
}

const CELL_SIZE = 11
const CELL_GAP = 3
const CELL_ROUND = 2
const LABEL_WIDTH = 20
const TOP_LABEL_HEIGHT = 16
const WEEKS = 13
const DAYS = 7

const DAY_LABELS: { day: number; label: string }[] = [
  { day: 1, label: 'M' },
  { day: 3, label: 'W' },
  { day: 5, label: 'F' },
]

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 5) return 1
  if (count <= 15) return 2
  if (count <= 30) return 3
  return 4
}

const LEVEL_COLORS = [
  'var(--app-surface)',
  'rgba(255, 107, 53, 0.25)',
  'rgba(255, 107, 53, 0.5)',
  'rgba(255, 107, 53, 0.75)',
  'var(--app-accent)',
]

function buildGrid(dates: CalendarDay[]): { date: string; count: number }[][] {
  const countMap = new Map<string, number>()
  for (const d of dates) {
    countMap.set(d.date, d.count)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the end of the grid: today
  // Find the start: go back so we fill exactly 13 weeks (91 days)
  // The grid is columns = weeks, rows = day-of-week (0=Sun..6=Sat)
  // Last column's last filled cell is today.
  const todayDow = today.getDay() // 0=Sun

  // End date of the grid is the Saturday of today's week (or today if today is Saturday)
  // Actually, the last column should end at today, and the column goes from Sun to today's dow.
  // But to keep a clean grid, let's have each column be a full week (Sun-Sat).
  // The last column contains today. We fill 13 columns total.

  // Start of last column (Sunday of today's week)
  const lastColSunday = new Date(today)
  lastColSunday.setDate(today.getDate() - todayDow)

  // Start of grid
  const gridStart = new Date(lastColSunday)
  gridStart.setDate(gridStart.getDate() - (WEEKS - 1) * 7)

  const columns: { date: string; count: number }[][] = []

  for (let w = 0; w < WEEKS; w++) {
    const col: { date: string; count: number }[] = []
    for (let d = 0; d < DAYS; d++) {
      const cellDate = new Date(gridStart)
      cellDate.setDate(gridStart.getDate() + w * 7 + d)

      // Don't show future dates
      if (cellDate > today) {
        col.push({ date: '', count: -1 }) // -1 = hidden
      } else {
        const iso = cellDate.toISOString().slice(0, 10)
        col.push({ date: iso, count: countMap.get(iso) ?? 0 })
      }
    }
    columns.push(col)
  }

  return columns
}

function getMonthLabels(columns: { date: string; count: number }[][]): { week: number; label: string }[] {
  const labels: { week: number; label: string }[] = []
  let lastMonth = -1

  for (let w = 0; w < columns.length; w++) {
    // Use the first visible day of the week
    const firstVisible = columns[w].find(c => c.count >= 0)
    if (!firstVisible || !firstVisible.date) continue

    const month = parseInt(firstVisible.date.slice(5, 7), 10) - 1
    if (month !== lastMonth) {
      labels.push({ week: w, label: MONTH_NAMES[month] })
      lastMonth = month
    }
  }

  return labels
}

export function StreakCalendar({ userId }: Props) {
  const { data } = useQuery({
    queryKey: ['study-calendar', userId],
    queryFn: () => apiGet<CalendarResponse>('/api/study/calendar'),
    enabled: !!userId,
    staleTime: 60_000,
  })

  const columns = buildGrid(data?.dates ?? [])
  const monthLabels = getMonthLabels(columns)

  const svgWidth = LABEL_WIDTH + WEEKS * (CELL_SIZE + CELL_GAP)
  const svgHeight = TOP_LABEL_HEIGHT + DAYS * (CELL_SIZE + CELL_GAP)

  return (
    <div className="streak-calendar">
      <h3 className="streak-calendar__title">90-day activity</h3>
      <svg
        className="streak-calendar__svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Month labels */}
        {monthLabels.map(ml => (
          <text
            key={ml.week}
            x={LABEL_WIDTH + ml.week * (CELL_SIZE + CELL_GAP)}
            y={TOP_LABEL_HEIGHT - 4}
            fontSize="9"
            fill="var(--app-text-secondary)"
          >
            {ml.label}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map(dl => (
          <text
            key={dl.day}
            x={0}
            y={TOP_LABEL_HEIGHT + dl.day * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1}
            fontSize="9"
            fill="var(--app-text-secondary)"
          >
            {dl.label}
          </text>
        ))}

        {/* Cells */}
        {columns.map((col, w) =>
          col.map((cell, d) => {
            if (cell.count < 0) return null
            const level = getLevel(cell.count)
            return (
              <rect
                key={`${w}-${d}`}
                x={LABEL_WIDTH + w * (CELL_SIZE + CELL_GAP)}
                y={TOP_LABEL_HEIGHT + d * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={CELL_ROUND}
                ry={CELL_ROUND}
                fill={LEVEL_COLORS[level]}
              >
                {cell.date && <title>{`${cell.date}: ${cell.count} reviews`}</title>}
              </rect>
            )
          })
        )}
      </svg>
    </div>
  )
}
