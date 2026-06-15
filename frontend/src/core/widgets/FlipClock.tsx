import { useEffect, useRef, useState } from 'react'

// Split-flap ("à bascule") clock. Each two-digit group flips when its value changes.

const FLIP_CSS = `
@keyframes kbn-flip-top { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-90deg); } }
@keyframes kbn-flip-bottom { 0% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
.kbn-flip { position: relative; width: 1.5em; height: 2em; border-radius: 0.18em;
  font-variant-numeric: tabular-nums; font-weight: 600; line-height: 2em; text-align: center; }
.kbn-flip-half { position: absolute; left: 0; right: 0; height: 1em; overflow: hidden;
  background: #2b2f33; color: #f5f6f7; }
.kbn-flip-half.top { top: 0; border-radius: 0.18em 0.18em 0 0; line-height: 2em;
  border-bottom: 1px solid rgba(0,0,0,0.4); }
.kbn-flip-half.bottom { bottom: 0; border-radius: 0 0 0.18em 0.18em; line-height: 0; }
.kbn-flip-anim { transform-style: preserve-3d; backface-visibility: hidden; z-index: 2; }
.kbn-flip-anim.top { transform-origin: bottom; animation: kbn-flip-top 0.28s ease-in forwards; }
.kbn-flip-anim.bottom { transform-origin: top; animation: kbn-flip-bottom 0.28s ease-out 0.28s forwards;
  transform: rotateX(90deg); }
`

function FlipGroup({ value }: { value: string }) {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (value === current) return
    setPrevious(current)
    setCurrent(value)
    setFlipping(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlipping(false), 600)
    return () => { if (timer.current) clearTimeout(timer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="kbn-flip">
      {/* Static halves showing the settled state */}
      <div className="kbn-flip-half top">{current}</div>
      <div className="kbn-flip-half bottom">{flipping ? previous : current}</div>
      {flipping && (
        <>
          {/* Old top folds down */}
          <div className="kbn-flip-half top kbn-flip-anim">{previous}</div>
          {/* New bottom folds in */}
          <div className="kbn-flip-half bottom kbn-flip-anim">{current}</div>
        </>
      )}
    </div>
  )
}

interface Props {
  hours:        string
  minutes:      string
  seconds?:     string
  showSeconds:  boolean
  ampm?:        string
  /** Taille de base en px ; les chiffres (em) suivent → responsive au cadre. */
  fontSize?:    number
}

export default function FlipClock({ hours, minutes, seconds, showSeconds, ampm, fontSize = 26 }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-text-primary" style={{ fontSize }}>
      <style>{FLIP_CSS}</style>
      <FlipGroup value={hours} />
      <span className="opacity-50 font-light pb-1">:</span>
      <FlipGroup value={minutes} />
      {showSeconds && seconds !== undefined && (
        <>
          <span className="opacity-50 font-light pb-1">:</span>
          <FlipGroup value={seconds} />
        </>
      )}
      {ampm && <span className="text-xs text-text-secondary self-end pb-1.5 ml-1">{ampm}</span>}
    </div>
  )
}
