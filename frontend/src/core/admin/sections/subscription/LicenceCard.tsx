import { useTranslation } from 'react-i18next'
import { Scale } from 'lucide-react'
import { Badge, Card } from '@ui'
import { ExternalLink } from './Field'
import type { LicenceInfo } from './api'

/**
 * What this software is held under — a fact, not a purchase.
 *
 * The card leads with the SPDX identifier the repository actually declares
 * (`LICENSE` at the root, `license = "AGPL-3.0"` in every module manifest), then
 * says in two sentences what the licence grants and what it asks in return. The
 * second sentence matters more than the first here: the AGPL's network clause is
 * the one obligation an operator of a *self-hosted, modified* instance can
 * breach without noticing, and a page about licensing that omitted it would be
 * decorative.
 */
export default function LicenceCard({ licence }: { licence: LicenceInfo }) {
  const { t } = useTranslation()

  return (
    <Card
      title={t('admin.sub_licence_title')}
      icon={<Scale size={16} />}
      subtitle={t('admin.sub_licence_subtitle')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary">{licence.spdx}</Badge>
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sub_licence_free')}
        </span>
      </div>

      <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.sub_licence_grants')}
      </p>
      <p className="mt-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.sub_licence_network')}
      </p>

      <div
        className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3"
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        <ExternalLink href={licence.text_url}>{t('admin.sub_licence_text_link')}</ExternalLink>
        <ExternalLink href={licence.source_url}>{t('admin.sub_licence_source_link')}</ExternalLink>
      </div>
    </Card>
  )
}
