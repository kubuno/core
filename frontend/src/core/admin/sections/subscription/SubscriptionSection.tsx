import { useTranslation } from 'react-i18next'
import { Scale } from 'lucide-react'
import { Callout, EmptyState, Spinner } from '@ui'
import { PRIV } from '../../../authz/types'
import { usePrivileges } from '../../../authz/usePrivileges'
import InstanceCard from './InstanceCard'
import LicenceCard from './LicenceCard'
import ModulesLicenceCard from './ModulesLicenceCard'
import SupportCard from './SupportCard'
import { useSubscription } from './api'

/**
 * "Abonnement et licence" — the page a free, self-hosted product can honestly
 * put under Billing.
 *
 * ## Why it is not a billing page
 *
 * The console this administration is modelled on puts a subscription here: a
 * plan, a seat count, a payment method, a renewal date. None of it transposes.
 * Kubuno is AGPL-3.0-or-later and is **not sold** — every instance already holds
 * every right the licence grants, unconditionally, and there is nothing to
 * enforce, meter or upgrade. A seat counter on this page would be a number that
 * governs nothing, and a "Passer à l'offre supérieure" button would be a button
 * that lies about what the product is.
 *
 * What *is* sold is support, so that is what the page models: the terms the
 * software is held under (a constant), which installation this is (facts the
 * schema already had), and whether anybody is contractually obliged to answer
 * when it breaks (the one thing that needed storing).
 *
 * ## Nothing here gates anything
 *
 * No card on this page can disable a feature, and no route behind it is
 * consulted by any other code path. That is a property to preserve: the moment a
 * feature asks "is there a contract?", this stops being an administration page
 * and becomes a licence check in a copyleft product.
 *
 * ## Reading it with fewer privileges than an owner
 *
 * The menu entry is gated on `core.settings.read`. The account counts and the
 * module inventory belong to other keys (`core.stats.read`,
 * `core.modules.read`), so the server omits those blocks for a caller who does
 * not hold them and the page simply renders one card fewer — rather than
 * answering 403 and blanking a page whose main subject the caller may read.
 */
export default function SubscriptionSection() {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(PRIV.SETTINGS_MANAGE)

  const { data, isLoading, isError, refetch } = useSubscription()

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<Scale size={26} />}
        variant="error"
        title={t('admin.sub_load_failed')}
        description={t('admin.sub_load_failed_desc')}
        action={{ label: t('admin.sub_retry'), onClick: () => void refetch() }}
        t={t}
      />
    )
  }

  return (
    <div className="min-w-0">
      <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {t('admin.nav_subscription')}
      </h1>
      <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.sub_intro')}
      </p>

      {/* The framing, once, at the top — because an operator arriving at a page
          filed under "Facturation" arrives expecting an invoice. */}
      <Callout variant="info" className="mt-4" title={t('admin.sub_model_title')} t={t}>
        {t('admin.sub_model_desc')}
      </Callout>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LicenceCard licence={data.licence} />
        <InstanceCard instance={data.instance} accounts={data.accounts} />
      </div>

      <div className="mt-4">
        <SupportCard support={data.support} canManage={canManage} />
      </div>

      {data.modules && data.modules.length > 0 && (
        <div className="mt-4">
          <ModulesLicenceCard modules={data.modules} />
        </div>
      )}
    </div>
  )
}
