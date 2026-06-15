interface Props {
  date:        Date
  showSeconds: boolean
  /** Côté du cadran en px ; l'horloge s'adapte au cadre du widget. */
  size?:       number
}

/** SVG analog clock — scales to `size` (responsive au cadre du widget). */
export default function AnalogClock({ date, showSeconds, size = 96 }: Props) {
  const h = date.getHours() % 12
  const m = date.getMinutes()
  const s = date.getSeconds()
  const hourAngle   = (h + m / 60) * 30          // 360/12
  const minuteAngle = (m + s / 60) * 6           // 360/60
  const secondAngle = s * 6

  const hand = (angle: number, len: number, w: number, color: string) => (
    <line
      x1="50" y1="50"
      x2={50 + len * Math.sin((angle * Math.PI) / 180)}
      y2={50 - len * Math.cos((angle * Math.PI) / 180)}
      stroke={color} strokeWidth={w} strokeLinecap="round"
    />
  )

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="47" fill="var(--color-surface-1)" stroke="var(--color-border)" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
          <line key={i}
            x1={50 + 40 * Math.sin(a)} y1={50 - 40 * Math.cos(a)}
            x2={50 + 44 * Math.sin(a)} y2={50 - 44 * Math.cos(a)}
            stroke="var(--color-text-tertiary)" strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        )
      })}
      {hand(hourAngle, 24, 3.5, 'var(--color-text-primary)')}
      {hand(minuteAngle, 34, 2.5, 'var(--color-text-primary)')}
      {showSeconds && hand(secondAngle, 38, 1, 'var(--color-primary)')}
      <circle cx="50" cy="50" r="2.5" fill="var(--color-primary)" />
    </svg>
  )
}
