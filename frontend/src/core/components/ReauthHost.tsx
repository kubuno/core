import { useReauthStore } from '../store/reauthStore'
import { ReauthDialog } from '../auth/ReauthDialog'

/**
 * Global host rendered once; shows the re-authentication dialog whenever a
 * sensitive request is refused with `REAUTH_REQUIRED` (see `api/client.ts`).
 *
 * Mounted next to the other hosts in `App.tsx` rather than inside `<Shell>`: a
 * sensitive call can be issued from the administration console, which lives
 * outside the shell, and a dialog that unmounts on navigation would drop the
 * waiting request.
 */
export default function ReauthHost() {
  const pending = useReauthStore((s) => s.pending)
  const resolve = useReauthStore((s) => s.resolve)
  const cancel = useReauthStore((s) => s.cancel)

  if (!pending) return null

  return <ReauthDialog onProof={resolve} onCancel={cancel} />
}
