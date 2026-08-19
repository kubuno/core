import { useTranslation } from 'react-i18next'
import { InstanceLogo } from '../../../shell/InstanceLogo'
import type { ReportModel } from '../model'

/**
 * The front sheet — optional, and off by default.
 *
 * A report that circulates outside the console (a board pack, an audit file, a
 * printout handed across a desk) is read by somebody who needs to know what
 * they are holding before they see a single figure. A report consulted for two
 * minutes and thrown away does not, and a cover would just be a sheet of paper
 * to skip. So it is a switch, next to the paper format, and the operator
 * decides — which is what "ajouter ou retirer une page de garde" means.
 *
 * It carries nothing the document does not already state on page 1. That is
 * deliberate: a cover holding a fact of its own would be a second source for
 * it, and the two would eventually disagree.
 */
export default function CoverSheet({
  instance, title, about, periodLabel, generatedAt, generatedBy, model,
}: {
  instance:    string
  title:       string
  about:       string
  periodLabel: string
  generatedAt: string
  generatedBy: string
  model:       ReportModel
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <InstanceLogo size={26} className="text-primary" />
        <span style={{ fontSize: 'var(--kb-text-heading)' }}>{instance}</span>
      </div>

      {/* The title sits at the optical centre rather than the top: a cover is
          read at arm's length, from the middle out. */}
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.rep_document')}
        </p>
        <h1 className="mt-2" style={{ fontSize: '32pt', lineHeight: 1.15 }}>{title}</h1>
        <p className="mt-3 max-w-2xl" style={{ fontSize: 'var(--kb-text-heading)' }}>{about}</p>
        <p className="mt-6" style={{ fontSize: 'var(--kb-text-body)' }}>
          {periodLabel} — {t('admin.rep_window_value', { from: model.from, to: model.to })}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-x-6 border-t border-border pt-3">
        <div>
          <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rep_timezone')}
          </dt>
          <dd style={{ fontSize: 'var(--kb-text-body)' }}>{model.timezone}</dd>
        </div>
        <div>
          <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rep_generated')}
          </dt>
          <dd style={{ fontSize: 'var(--kb-text-body)' }}>{generatedAt}</dd>
        </div>
        <div>
          <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rep_generated_by')}
          </dt>
          <dd style={{ fontSize: 'var(--kb-text-body)' }}>{generatedBy}</dd>
        </div>
      </dl>
    </div>
  )
}
