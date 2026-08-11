import { Badge } from '@ui'
import type { User } from '../../../types'

/**
 * The small, repeated pieces of the account sheet. They live here rather than
 * inline so the three tabs describe layout only, and so a role or a status is
 * painted identically wherever it appears.
 */

/** Colour of a role badge. Tokens only — no literal hex, both themes remap. */
const ROLE_VARIANT: Record<string, 'danger' | 'primary' | 'default'> = {
  admin: 'danger',
  user:  'primary',
  guest: 'default',
}

export function RoleBadge({ role, label }: { role: string; label: string }) {
  return <Badge variant={ROLE_VARIANT[role] ?? 'default'}>{label}</Badge>
}

export function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return <Badge variant={active ? 'success' : 'default'} dot>{label}</Badge>
}

/**
 * The definition row and the em-dash placeholder are shared with the other
 * record sheets — three of them draw the same row now, so it lives one level up
 * (`inline-edit/Field`) and is re-exported here for the tabs that already
 * import it from this file.
 */
export { Field, orDash } from '../../inline-edit/Field'

/** Circular monogram — the account has no avatar in the vast majority of cases. */
export function UserAvatar({ user, size = 40 }: { user: User; size?: number }) {
  const name = user.display_name || user.username || user.email
  const initials = name.trim().slice(0, 2).toUpperCase()
  return user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-light font-medium text-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  )
}

