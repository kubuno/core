/**
 * Public facade of the drive client API.
 *
 * The endpoints live in `./api/` grouped by domain (folders, files, search,
 * archives, shares, transfers, versions, activity, remotes, system, recents);
 * this file keeps the historical import path and recomposes `filesApi` with
 * exactly the same keys as before, so `@kubuno/drive` consumers are unaffected.
 */
import { folderApi } from './api/folders'
import { fileApi } from './api/files'
import { searchApi } from './api/search'
import { archiveApi } from './api/archives'
import { shareApi } from './api/shares'
import { transferApi } from './api/transfers'
import { versionApi } from './api/versions'
import { activityApi } from './api/activity'
import { remoteApi } from './api/remotes'

export * from './api/types'
export { formatSize } from './api/format'
export { SYSTEM_ROOT_ID, systemApi } from './api/system'
export { recentApi } from './api/recent'
export type { RecentFile } from './api/recent'

/** Single flat API object consumed across the host and every file-backed module. */
export const filesApi = {
  // ── Folders ───────────────────────────────────────────────────────────
  ...folderApi,
  // ── Files ─────────────────────────────────────────────────────────────
  ...fileApi,
  ...searchApi,
  // ── Archives ──────────────────────────────────────────────────────────
  ...archiveApi,
  // ── Shares ────────────────────────────────────────────────────────────
  ...shareApi,
  // ── Thumbnails & downloads ────────────────────────────────────────────
  ...transferApi,
  // ── Versioning ────────────────────────────────────────────────────────
  ...versionApi,
  // ── Activity & extra info ─────────────────────────────────────────────
  ...activityApi,
  // ── Remote connections ────────────────────────────────────────────────
  ...remoteApi,
}
