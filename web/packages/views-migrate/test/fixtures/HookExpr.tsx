import { useLocation } from 'react-router-dom'

/** Hooks called inside an expression: still called on every render, in order. */
export function HookExpr({ fallback }: { fallback: string }) {
  const pathname = useLocation().pathname
  const hash = useLocation().hash || fallback
  return <p>{pathname}{hash}</p>
}
