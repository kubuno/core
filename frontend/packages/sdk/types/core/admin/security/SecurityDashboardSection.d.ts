import type { AdminSectionProps } from '../sections/registry';
/**
 * Security dashboard — the instance's security posture, as panels of counted
 * facts, over a window the operator chooses.
 *
 * ## The rule this page is built on
 *
 * Every number is a `COUNT(*)` over a table the core itself writes. No
 * estimation, no extrapolation, no placeholder series. A panel with nothing to
 * count says so in words; a panel whose data lives somewhere the core cannot
 * read is **not rendered at all**.
 *
 * That last point is the whole architectural story. The console this page is
 * modelled on also charts message authentication, transport encryption, spam
 * filtering and external file shares. Those facts belong to modules, each of
 * which owns a PostgreSQL schema the core never reads — so the core cannot
 * produce them, and inventing a plausible curve would turn a security screen
 * into a reassurance machine. They will arrive the day a module *declares* them,
 * through a channel modelled on the storage-usage one; until then their absence
 * is the honest rendering, and the note under the grid says so out loud rather
 * than leaving the operator to assume the page is complete.
 *
 * ## Withheld, not empty
 *
 * Each panel is an instance-wide aggregate and is gated on its own privilege at
 * instance scope. A delegated administrator who holds `core.alerts.read` over one
 * unit is not shown an instance-wide alert count; the server withholds the panel
 * and names it, and the page says how many were withheld instead of quietly
 * rendering short.
 */
export default function SecurityDashboardSection({ navigate }: AdminSectionProps): import("react").JSX.Element;
