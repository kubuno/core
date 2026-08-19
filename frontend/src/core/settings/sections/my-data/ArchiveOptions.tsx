import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox } from '@ui'
import type { MyExportPolicy } from './api'

/**
 * Step 2 — how the archive is built.
 *
 * ## Only controls that do something
 *
 * The archive format is **stated, not offered**: the server produces one format,
 * and a picker with a single entry is a control that teaches the reader a choice
 * exists where none does. The same reasoning keeps a "schedule this export"
 * switch off this page: nothing behind it would honour a schedule, and a switch
 * that silently does nothing is worse than an absent one.
 *
 * What is real is the per-file ceiling. It is applied by the producer, frozen on
 * the request, and it can only ever be *tightened*: the instance's own ceiling
 * is a protection against one object making an archive unusable, not a
 * preference, so the largest value offered here is the instance's.
 */
export interface ArchiveOptionsProps {
  policy:  MyExportPolicy
  format:  string
  maxFileMb: number
  onMaxFileMb: (value: number) => void
}

/** Candidate ceilings, in MiB. Kept to sizes a person recognises. */
const STEPS = [100, 250, 500, 1_024, 2_048, 5_120, 10_240]

function humanMb(mb: number): string {
  return mb >= 1_024 ? `${Math.round(mb / 1_024)} Go` : `${mb} Mo`
}

export default function ArchiveOptions({
  policy, format, maxFileMb, onMaxFileMb,
}: ArchiveOptionsProps) {
  const { t } = useTranslation()

  // The instance's ceiling is always the last option, and nothing above it is
  // ever offered — the server would clamp it and the two would then disagree
  // about what was asked for.
  const options = useMemo(() => {
    const values = STEPS.filter(v => v < policy.max_file_mb).concat(policy.max_file_mb)
    return values.map(v => ({
      value: String(v),
      label: humanMb(v),
      description: v === policy.max_file_mb
        ? t('settings.mde_size_max', { defaultValue: 'Maximum autorisé par l’instance' })
        : undefined,
    }))
  }, [policy.max_file_mb, t])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-text-primary font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('settings.mde_opt_format', { defaultValue: 'Format de l’archive' })}
        </p>
        <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('settings.mde_opt_format_desc', {
            defaultValue:
              'Un fichier {{format}}, avec un dossier par service et une notice qui explique ce qu’il contient.',
            format: format.toUpperCase(),
          })}
        </p>
      </div>

      <div>
        <label
          htmlFor="mde-max-file"
          className="block text-text-primary font-medium"
          style={{ fontSize: 'var(--kb-text-body)' }}
        >
          {t('settings.mde_opt_size', { defaultValue: 'Taille maximale d’un fichier' })}
        </label>
        <p className="mt-1 mb-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('settings.mde_opt_size_desc', {
            defaultValue:
              'Un fichier plus volumineux n’est pas placé dans l’archive : son absence et sa taille réelle sont inscrites dans le manifeste, de sorte que rien ne disparaisse en silence.',
          })}
        </p>
        <Combobox
          id="mde-max-file"
          value={String(maxFileMb)}
          onChange={value => onMaxFileMb(Number(value))}
          options={options}
          width={260}
          aria-label={t('settings.mde_opt_size', { defaultValue: 'Taille maximale d’un fichier' })}
        />
      </div>

      <div>
        <p className="text-text-primary font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('settings.mde_opt_once', { defaultValue: 'Export ponctuel' })}
        </p>
        <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {policy.hold_hours > 0
            ? t('settings.mde_opt_once_hold', {
                defaultValue:
                  'L’archive est produite une fois. Elle sera téléchargeable {{hold}} h après sa production, restera disponible {{days}} jours et pourra être récupérée {{max}} fois. Une nouvelle demande remplace la précédente.',
                hold: policy.hold_hours,
                days: policy.retention_days,
                max:  policy.max_downloads,
              })
            : t('settings.mde_opt_once_desc', {
                defaultValue:
                  'L’archive est produite une fois. Elle reste disponible {{days}} jours et peut être récupérée {{max}} fois ; passé cela, il faut en redemander une. Une nouvelle demande remplace la précédente.',
                days: policy.retention_days,
                max:  policy.max_downloads,
              })}
        </p>
      </div>
    </div>
  )
}
