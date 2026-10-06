/**
 * Global host rendered once; shows the re-authentication dialog whenever a
 * sensitive request is refused with `REAUTH_REQUIRED` (see `api/client.ts`).
 *
 * Mounted next to the other hosts in `App.tsx` rather than inside `<Shell>`: a
 * sensitive call can be issued from the administration console, which lives
 * outside the shell, and a dialog that unmounts on navigation would drop the
 * waiting request.
 */
export default function ReauthHost(): import("react").JSX.Element | null;
