import type { NavigateFunction } from 'react-router-dom';
/**
 * The account sheet — the screen an operator diagnoses from.
 *
 * Reached at `/admin/users?user=<id>` (and `&pane=security` to land
 * directly on a tab), which is what finally gives `GET /admin/users/:id` a
 * consumer. The pane lives in the URL so a sheet can be linked to, and so the
 * browser's Back button walks the tabs the way the user expects.
 *
 * Mobile is not the desktop layout narrowed: the header keeps the back arrow,
 * the identity and ONE action; everything else moves into a bottom sheet, and
 * the tables inside the tabs switch to cards on their own (DataTable follows
 * its container's width).
 *
 * There is no "Modifier" button here any more, and that is the design: the sheet
 * IS the editor. Each card of the profile tab turns into its own form (see
 * `cards/`), so every value the server accepts is changed where it is read
 * rather than in a window that offered a quarter of them. What remains in this
 * header is the one thing that is a verb and not a field — activation — kept
 * behind a confirmation.
 */
export default function UserDetailSection({ userId, params, navigate, }: {
    userId: string;
    params: URLSearchParams;
    navigate: NavigateFunction;
}): import("react").JSX.Element;
