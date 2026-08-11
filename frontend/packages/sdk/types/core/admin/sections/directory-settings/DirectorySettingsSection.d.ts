/**
 * Directory ▸ Directory settings.
 *
 * ── Three questions, three cards ─────────────────────────────────────────────
 * Who can see the directory and what it discloses; what a person may rewrite
 * about themselves; and how far the directory reaches. That last one is where
 * this console differs from the model it borrows the shape from: rather than
 * administering a separate "custom directory" object per organisational unit,
 * the reach is an ordinary scoped setting, so a unit's directory is simply the
 * value that unit resolves.
 *
 * ── Everything here is posted through the scope engine ──────────────────────
 * No bespoke column, no bespoke route: `PUT/DELETE /admin/settings/scoped/:key`
 * and `POST /admin/settings/lock/:key`, exactly like every other settings page.
 * That buys inheritance down the unit tree, the lock that forbids an override
 * underneath, the provenance line under every control, and the inheritance
 * chain window — none of which is reimplemented here.
 *
 * ── And every key is read by a handler ──────────────────────────────────────
 * A per-unit switch that resolves correctly and governs nothing is the defect
 * this console has already shipped once. Each of the eleven keys below has a
 * reader on the server (`crate::settings::directory`): the profile ones refuse
 * a forbidden `PATCH /api/v1/me` with a message naming the field, and the
 * sharing ones shape what `/users/search` answers.
 *
 * ── Why the inert list is down to one row ───────────────────────────────────
 * Six of the eight fields the comparable console governs became real with
 * migration `000114`: a column, a `/me` field, a form control, a place they are
 * displayed, and only then a switch. Two never will be, for opposite reasons:
 *
 *   • `profile_discovery` is not a profile field at all, it is a visibility
 *     control — and this instance already answers it, more finely, with
 *     `directory.enabled` and `directory.audience` in the first and third cards.
 *     Those are posted per organisational unit and can be locked, which a single
 *     instance-wide toggle cannot be. Leaving it greyed out claimed a gap that
 *     does not exist, so it is gone from the list and named in the card's note
 *     instead — an operator looking for it is told where it is;
 *   • `other_personal_info` is a catch-all with no defined content. There is
 *     nothing to add a column *for*, so it stays listed as an honest absence.
 */
export default function DirectorySettingsSection(): import("react").JSX.Element;
