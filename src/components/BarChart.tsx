import './BarChart.css'

interface Bucket {
  label: string
  new: number
  review: number
}

interface Props {
  buckets: Bucket[]
  height?: number
}

export function BarChart({ buckets, height = 180 }: Props) {
  if (buckets.length === 0) return null

  const maxVal = Math.max(...buckets.map(b => b.new + b.review), 1)
  const barWidth = Math.max(12, Math.min(32, (280 / buckets.length) - 4))
  const chartWidth = buckets.length * (barWidth + 4) + 40
  const avg = buckets.reduce((sum, b) => sum + b.new + b.review, 0) / buckets.length

  const padTop = 16
  const padBottom = 24
  const barArea = height - padTop - padBottom

  return (
    <div className="bar-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const y = padTop + barArea * (1 - frac)
          return (
            <line
              key={frac}
              x1={0} x2={chartWidth - 30}
              y1={y} y2={y}
              stroke="var(--app-border)" strokeWidth={0.5}
            />
          )
        })}

        {/* Average line */}
        {avg > 0 && (
          <line
            x1={0}
            x2={chartWidth - 30}
            y1={padTop + barArea * (1 - avg / maxVal)}
            y2={padTop + barArea * (1 - avg / maxVal)}
            stroke="var(--app-text-secondary)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Y-axis labels */}
        <text x={chartWidth - 4} y={padTop + 4} className="bar-chart__axis-label" textAnchor="end">
          {maxVal}
        </text>
        <text x={chartWidth - 4} y={padTop + barArea / 2 + 4} className="bar-chart__axis-label" textAnchor="end">
          {Math.round(maxVal / 2)}
        </text>
        <text x={chartWidth - 4} y={padTop + barArea + 4} className="bar-chart__axis-label" textAnchor="end">
          0
        </text>

        {/* Avg label */}
        {avg > 0 && (
          <text
            x={chartWidth - 4}
            y={padTop + barArea * (1 - avg / maxVal) - 4}
            className="bar-chart__avg-label"
            textAnchor="end"
          >
            avg
          </text>
        )}

        {/* Bars */}
        {buckets.map((bucket, i) => {
          const x = i * (barWidth + 4) + 4
          const totalH = ((bucket.new + bucket.review) / maxVal) * barArea
          const reviewH = (bucket.review / maxVal) * barArea
          const newH = (bucket.new / maxVal) * barArea

          return (
            <g key={i}>
              {/* Review (bottom) */}
              <rect
                x={x} y={padTop + barArea - totalH}
                width={barWidth} height={reviewH}
                rx={barWidth > 16 ? 4 : 2}
                fill="var(--app-accent)"
                opacity={0.85}
              />
              {/* New (top of stack) */}
              {newH > 0 && (
                <rect
                  x={x} y={padTop + barArea - totalH + reviewH}
                  width={barWidth} height={newH}
                  rx={barWidth > 16 ? 4 : 2}
                  fill="#06b6d4"
                  opacity={0.85}
                />
              )}
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - 4}
                className="bar-chart__bucket-label"
                textAnchor="middle"
              >
                {bucket.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
