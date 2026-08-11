import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'

/**
 * Wire types and queries of the backup policy.
 *
 * Everything on this screen is computed server-side: whether the last backup is
 * recent, when the next one is due, and — above all — WHAT the dump covers.
 * The console renders those; it never derives them. A page that decided for
 * itself what a backup contains is a page that keeps promising a file the server
 * stopped writing.
 */

export interface BackupPolicy {
  enabled:          boolean
  frequency:        'daily' | 'weekly'
  hour_utc:         number
  retention_count:  number
  destination:      string
  stale_after_days: number
}

export interface BackupRun {
  id:            string
  trigger_kind:  'scheduled' | 'manual'
  triggered_by:  string | null
  actor_label:   string | null
  status:        'running' | 'success' | 'failed'
  started_at:    string
  finished_at:   string | null
  duration_ms:   number | null
  file_name:     string | null
  destination:   string | null
  size_bytes:    number | null
  tables_count:  number | null
  rows_count:    number | null
  error:         string | null
  file_pruned:   boolean
}

export interface BackupStats {
  last_success_at:      string | null
  last_success_bytes:   number | null
  last_success_file:    string | null
  last_status:          'success' | 'failed' | null
  last_attempt_at:      string | null
  last_error:           string | null
  consecutive_failures: number
  total_runs:           number
}

export interface BackupOverview {
  policy:       BackupPolicy
  next_run_at:  string | null
  running:      boolean
  stats:        BackupStats
  history:      BackupRun[]
  restore_test: { at: string | null; declared: boolean }
  /** Stable identifiers translated as `admin.bk_cov_<id>`. */
  covers:       string[]
  /** Same, as `admin.bk_notcov_<id>`. This half must never silently shrink. */
  not_covers:   string[]
  schema:       string
  can_manage:   boolean
}

export const BACKUP_KEY = ['admin-backup'] as const

export function useBackup() {
  const { can } = usePrivileges()
  const allowed = can(PRIV.BACKUP_READ)

  return useQuery({
    queryKey: BACKUP_KEY,
    enabled:  allowed,
    queryFn:  () => api.get<BackupOverview>('/admin/backup').then(r => r.data),
    // A dump takes minutes. While one is in flight the page follows it rather
    // than making the operator reload to find out whether it worked — which is
    // the moment they would otherwise press the button a second time.
    refetchInterval: query =>
      (query.state.data as BackupOverview | undefined)?.running ? 3_000 : false,
    staleTime: 10_000,
  })
}

function useBackupMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: BACKUP_KEY })
      // The health banner reads `continuity.backup` and `continuity.restore_tested`.
      void qc.invalidateQueries({ queryKey: ['admin-health-checks'] })
    },
  })
}

export function useRunBackup() {
  return useBackupMutation<void>(() => api.post('/admin/backup/run', {}))
}

export function useDeclareRestoreTest() {
  return useBackupMutation<{ note?: string; clear?: boolean }>(body =>
    api.post('/admin/backup/restore-test', body),
  )
}

export function errorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return detail?.message ?? detail?.error ?? fallback
}
