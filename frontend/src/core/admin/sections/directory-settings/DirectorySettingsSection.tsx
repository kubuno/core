import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Contact, Share2, UserCog } from 'lucide-react'
import { Callout, Card, EmptyState } from '@ui'
import { PRIV } from '../../../authz/types'
import { usePrivileges } from '../../../authz/usePrivileges'
import SettingScopeBar from '../../settings/SettingScopeBar'
import InheritanceChainWindow from '../../settings/InheritanceChainWindow'
import { settingLabel } from '../../settings/SettingControl'
import { INSTANCE_SCOPE, type ActiveScope } from '../../settings/scopeTypes'
import { useDirectoryPolicy } from './useDirectoryPolicy'
import { AudienceRow, CheckboxRow, ToggleRow, UnstoredFieldRow } from './PolicyRow'
import {
  DIRECTORY_KEYS, DIR_AUDIENCE, PERSONAL_DATA_KEYS, PROFILE_FIELDS_NOT_STORED,
  PROFILE_KEYS, SHARING_KEYS,
} from './keys'

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
export default function DirectorySettingsSection() {
  const { t } = useTranslation()
  const { can } = usePrivileges()

  const [scope, setScope] = useState<ActiveScope>(INSTANCE_SCOPE)
  const [chainKey, setChainKey] = useState<string | null>(null)

  const canRead   = can(PRIV.SETTINGS_READ)
  const canManage = can(PRIV.SETTINGS_MANAGE)
  const policy = useDirectoryPolicy(scope)

  const title = (
    <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {t('admin.nav_directory_settings')}
      </h1>
      <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.dirset_meta', { count: DIRECTORY_KEYS.length })}
      </span>
    </div>
  )

  if (!canRead) {
    return (
      <div className="min-w-0">
        {title}
        <EmptyState
          icon={<Contact size={26} />}
          title={t('admin.dirset_forbidden')}
          description={t('admin.dirset_forbidden_desc')}
          t={t}
        />
      </div>
    )
  }

  // Declared keys this instance actually knows. Empty once loading has finished
  // means the migration that declares them has not run — a different situation
  // from "no data", and one an operator must be able to tell apart.
  const known = DIRECTORY_KEYS.filter(k => policy.setting(k))
  const chainSetting = chainKey ? policy.setting(chainKey) : undefined

  return (
    <div className="min-w-0">
      {title}

      <div className="mb-5 max-w-3xl">
        <Callout variant="info" title={t('admin.dirset_intro_title')}>
          {t('admin.dirset_intro')}
        </Callout>
      </div>

      <div className="max-w-3xl">
        <SettingScopeBar scope={scope} onChange={setScope} />

        {!canManage && (
          <div className="mb-4">
            <Callout variant="info">{t('admin.settings_read_only')}</Callout>
          </div>
        )}

        {policy.error && (
          <div className="mb-4">
            <Callout variant="danger" dismissible onDismiss={policy.clearError}>
              {policy.error}
            </Callout>
          </div>
        )}

        {policy.isError ? (
          <EmptyState
            icon={<Contact size={26} />}
            title={t('admin.dirset_load_failed')}
            description={t('admin.dirset_load_failed_desc')}
            action={{ label: t('admin.dirset_retry'), onClick: () => void policy.refetch() }}
            variant="error"
            t={t}
          />
        ) : !policy.isLoading && known.length === 0 ? (
          <EmptyState
            icon={<Contact size={26} />}
            title={t('admin.dirset_undeclared')}
            description={t('admin.dirset_undeclared_desc')}
            t={t}
          />
        ) : (
          <div className="space-y-5">
            {/* 1 — What the directory is, and what it hands out. */}
            <Card
              title={t('admin.dirset_card_sharing')}
              subtitle={t('admin.dirset_card_sharing_desc')}
              icon={<Share2 size={18} />}
            >
              <div className="divide-y divide-border">
                {SHARING_KEYS.map(key => (
                  <ToggleRow
                    key={key}
                    setting={policy.setting(key)}
                    policy={policy}
                    readOnly={!canManage}
                    onShowChain={setChainKey}
                  />
                ))}
              </div>
            </Card>

            {/* 2 — What a person may rewrite about themselves. */}
            <Card
              title={t('admin.dirset_card_profile')}
              subtitle={t('admin.dirset_card_profile_desc')}
              icon={<UserCog size={18} />}
            >
              <div className="divide-y divide-border">
                {PROFILE_KEYS.map(key => (
                  <CheckboxRow
                    key={key}
                    setting={policy.setting(key)}
                    policy={policy}
                    readOnly={!canManage}
                    onShowChain={setChainKey}
                    personal={PERSONAL_DATA_KEYS.includes(key)}
                  />
                ))}
                {/* What the comparable console governs and this one still does
                    not store. One row left; listed, greyed and labelled, so the
                    page can be read line by line against it instead of leaving
                    an operator to work out what is missing. */}
                {PROFILE_FIELDS_NOT_STORED.map(f => (
                  <UnstoredFieldRow key={f} field={f} />
                ))}
              </div>
              {/* Said once, under the card it qualifies, rather than repeated
                  under each box. */}
              <p className="mt-3 border-t border-border pt-3 text-text-tertiary"
                 style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.dirset_profile_fields_note')}
              </p>
              {/* Where the control the model calls "profile discovery" lives
                  here. Without this line, removing its greyed row would read as
                  a feature quietly dropped rather than one answered better. */}
              <p className="mt-2 text-text-tertiary"
                 style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.dirset_profile_discovery_note')}
              </p>
              <p className="mt-2 text-text-tertiary"
                 style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.dirset_personal_fields_note')}
              </p>
            </Card>

            {/* 3 — How far it reaches: the per-unit directory. */}
            <Card
              title={t('admin.dirset_card_reach')}
              subtitle={t('admin.dirset_card_reach_desc')}
              icon={<Building2 size={18} />}
            >
              <AudienceRow
                setting={policy.setting(DIR_AUDIENCE)}
                policy={policy}
                readOnly={!canManage}
                onShowChain={setChainKey}
              />
            </Card>
          </div>
        )}
      </div>

      {chainKey && (
        <InheritanceChainWindow
          settingKey={chainKey}
          scope={scope}
          title={chainSetting ? settingLabel(t, chainSetting) : undefined}
          onClose={() => setChainKey(null)}
        />
      )}
    </div>
  )
}
