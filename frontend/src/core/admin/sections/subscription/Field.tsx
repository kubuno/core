import type { ReactNode } from 'react'

/**
 * One labelled fact, stacked: the label above in the metadata size, the value
 * below in the body size.
 *
 * A local helper rather than a shared primitive: three cards on this page show
 * the same shape, and lifting it any higher would make it a component the rest
 * of the console has to be kept in step with.
 */
export default function Field({
  label, children, mono,
}: {
  label:    string
  children: ReactNode
  /** Renders the value in the monospace face — for identifiers read aloud. */
  mono?:    boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {label}
      </div>
      <div
        className={`mt-0.5 min-w-0 break-words text-text-primary${mono ? ' font-mono' : ''}`}
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * An outgoing link, styled once for the whole page.
 *
 * `rel="noreferrer"` on every one of them: these point at public pages, and the
 * address of a private instance is not something a click should hand to them.
 */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary-hover"
    >
      {children}
    </a>
  )
}
