/**
 * Landing page of the link sent by "forgot my password".
 *
 * This page is what was missing for the whole flow to exist: the backend has
 * had `POST /auth/reset-password` all along, the relay now delivers the link,
 * and this is where the link lands. The token travels in the query string
 * (`/reset-password?token=…`); it is single-use and short-lived, and is never
 * stored anywhere by this component — it goes straight into the one request.
 *
 * Deliberately public and unauthenticated: whoever follows the link has, by
 * definition, no session.
 */
export default function ResetPasswordPage(): import("react").JSX.Element;
