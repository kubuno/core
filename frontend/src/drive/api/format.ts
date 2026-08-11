import { i18n } from '@kubuno/sdk'

/** Human-readable byte size, localised through the drive namespace. */
export function formatSize(bytes: number): string {
  const u = (k: string) => i18n.t(`drive:common.${k}`)
  if (bytes < 1024) return `${bytes} ${u('byte')}`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} ${u('kb')}`
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} ${u('mb')}`
  return `${(bytes / 1_073_741_824).toFixed(2)} ${u('gb')}`
}
