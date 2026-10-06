import type { ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/** A component narrowed by its condition and written as a tag, and links next to the screen's own `navigate`. */
export function NarrowTag({ cfg }: { cfg: { Body?: ComponentType; title: string } }) {
  const navigate = useNavigate()
  return (
    <div>
      {cfg.Body ? <cfg.Body /> : <p>{cfg.title}</p>}
      <Link to="/home">home</Link>
      <button onClick={() => navigate('/back')}>back</button>
    </div>
  )
}
