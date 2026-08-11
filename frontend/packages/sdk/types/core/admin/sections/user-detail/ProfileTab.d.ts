import type { User } from '../../../types';
/**
 * Profile tab — everything the server knows about the account, and everything it
 * accepts back.
 *
 * The tab is only a layout now: each card owns its own reading state, its own
 * edit state, its own privilege check and its own `PATCH`. That split is the
 * point of the redesign. The console used to answer "Modifier" with a floating
 * window that knew five fields — name, role, quota, activation, unit — while
 * this tab displayed twenty; the six personal columns in particular were
 * readable here and writable nowhere. Every value the server accepts is now
 * edited in the card that shows it (see `cards/`), and there is no second form
 * left to drift from this one.
 *
 * Strictly limited to what `GET /admin/users/:id` serialises: the model hides
 * `password_hash`, `totp_secret` and `totp_pending_secret`, so nothing here can
 * leak them. `preferences` is deliberately absent: a free JSON blob owned by the
 * user, not administrative data.
 *
 * The "personal profile" card is the **only** administrative surface where the
 * six fields of migration `000114` are read, and the only place at all where
 * `gender` and `birthday` are shown to somebody other than their owner. That is
 * a deliberate boundary, not an oversight of the other screens: the directory
 * search and every people picker in every module answer name, username and
 * photo, because `handlers::users::DIRECTORY_COLUMNS` says so. A sheet somebody
 * opened on purpose is where a personal datum belongs; a dropdown of colleagues
 * is not.
 */
export default function ProfileTab({ user }: {
    user: User;
}): import("react").JSX.Element;
