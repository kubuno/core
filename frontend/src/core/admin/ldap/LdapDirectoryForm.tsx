import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Network, KeyRound, Users, RefreshCw } from 'lucide-react'
import { Button, Callout, Card, Combobox, Input, Textarea, Toggle, Stepper } from '@ui'
import type { ComboboxOption } from '@ui'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { OrgUnit } from '../../types'
import { DEFAULT_PORT, IS_DEFAULT_PORT, PRESETS, type DirectoryForm } from './types'

/**
 * The directory editor, in four steps.
 *
 * A Stepper rather than one long form: an LDAP configuration has around twenty
 * fields and the failures are staged — nothing about the attribute mapping
 * matters until the connection works, and nothing about groups matters until
 * the mapping does. The steps are freely navigable (`allowForward`) so editing
 * an existing directory is not a wizard you have to walk through again.
 *
 * The password field starts empty on every load and is only sent when something
 * was typed: the API never returns it, and sending an empty string would clear
 * the stored one — which is what the explicit control does.
 */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="text-text-secondary">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && (
        <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {hint}
        </p>
      )}
    </label>
  )
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {hint}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
  )
}

export default function LdapDirectoryForm({
  form,
  setForm,
  isEdit,
  hasStoredPassword,
  onSave,
  onCancel,
  saving,
  onClearPassword,
}: {
  form: DirectoryForm
  setForm: (f: DirectoryForm) => void
  isEdit: boolean
  hasStoredPassword: boolean
  onSave: () => void
  onCancel: () => void
  saving: boolean
  onClearPassword?: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState('connection')

  // Where imported accounts land in the organisational tree. It matters beyond
  // tidiness: `auth.methods` is resolved per unit, so an account placed nowhere
  // follows the INSTANCE policy — which may not include the directory that just
  // authenticated them.
  const { data: orgUnits } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const unitOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: t('ldap.unit_none'), description: t('ldap.unit_none_desc') },
      ...(orgUnits ?? []).map(u => ({ value: u.id, label: u.name })),
    ],
    [orgUnits, t],
  )

  const set = <K extends keyof DirectoryForm>(key: K, value: DirectoryForm[K]) =>
    setForm({ ...form, [key]: value })

  const applyPreset = (kind: 'standard' | 'ad') => setForm({ ...form, ...PRESETS[kind] })

  const onSecurityChange = (value: string) => {
    const port = IS_DEFAULT_PORT(form.port) ? DEFAULT_PORT[value] ?? form.port : form.port
    setForm({ ...form, security: value, port })
  }

  const securityOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'starttls', label: t('ldap.sec_starttls'), description: t('ldap.sec_starttls_desc') },
      { value: 'ldaps', label: t('ldap.sec_ldaps'), description: t('ldap.sec_ldaps_desc') },
      { value: 'none', label: t('ldap.sec_none'), description: t('ldap.sec_none_desc') },
    ],
    [t],
  )

  const scopeOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'subtree', label: t('ldap.scope_subtree') },
      { value: 'onelevel', label: t('ldap.scope_onelevel') },
      { value: 'base', label: t('ldap.scope_base') },
    ],
    [t],
  )

  const missingOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'disable', label: t('ldap.missing_disable'), description: t('ldap.missing_disable_desc') },
      { value: 'ignore', label: t('ldap.missing_ignore'), description: t('ldap.missing_ignore_desc') },
    ],
    [t],
  )

  const canSave =
    form.slug.trim() !== '' &&
    form.display_name.trim() !== '' &&
    form.host.trim() !== '' &&
    form.base_dn.trim() !== '' &&
    form.user_filter.includes('{login}')

  const steps = [
    { id: 'connection', label: t('ldap.step_connection') },
    { id: 'service', label: t('ldap.step_service') },
    { id: 'mapping', label: t('ldap.step_mapping') },
    { id: 'sync', label: t('ldap.step_sync') },
  ]

  return (
    <Card
      title={isEdit ? t('ldap.edit_title', { name: form.display_name }) : t('ldap.add_title')}
      icon={<Network size={17} />}
    >
      <div className="space-y-5">
        <Stepper steps={steps} current={step} onStepChange={id => setStep(id)} allowForward t={t} />

        {/* ── 1. Connection ───────────────────────────────────────────── */}
        {step === 'connection' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => applyPreset('standard')}>
                {t('ldap.preset_standard')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applyPreset('ad')}>
                {t('ldap.preset_ad')}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('ldap.slug')} hint={t('ldap.slug_hint')}>
                <Input
                  value={form.slug}
                  disabled={isEdit}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="annuaire"
                  autoComplete="off"
                />
              </Field>
              <Field label={t('ldap.display_name')}>
                <Input
                  value={form.display_name}
                  onChange={e => set('display_name', e.target.value)}
                  placeholder="Annuaire interne"
                  autoComplete="off"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label={t('ldap.host')} hint={t('ldap.host_hint')}>
                  <Input
                    value={form.host}
                    onChange={e => set('host', e.target.value.trim())}
                    placeholder="dc01.exemple.com"
                    autoComplete="off"
                  />
                </Field>
              </div>
              <Field label={t('ldap.port')}>
                <Input
                  type="number"
                  value={form.port}
                  onChange={e => set('port', e.target.value)}
                  min={1}
                  max={65535}
                />
              </Field>
            </div>

            <Field label={t('ldap.security')}>
              <Combobox
                value={form.security}
                onChange={onSecurityChange}
                options={securityOptions}
                width="100%"
                t={t}
              />
            </Field>

            {form.security === 'none' && (
              <Callout variant="warning">{t('ldap.warn_plain')}</Callout>
            )}

            {form.security !== 'none' && (
              <>
                <SwitchRow
                  label={t('ldap.verify_certificate')}
                  hint={t('ldap.verify_certificate_hint')}
                  checked={form.verify_certificate}
                  onChange={v => set('verify_certificate', v)}
                />
                {!form.verify_certificate && (
                  <Callout variant="warning">{t('ldap.warn_no_verify')}</Callout>
                )}
                {form.verify_certificate && (
                  <Field label={t('ldap.ca_certificate')} hint={t('ldap.ca_certificate_hint')}>
                    <Textarea
                      value={form.ca_certificate}
                      onChange={e => set('ca_certificate', e.target.value)}
                      rows={5}
                      placeholder="-----BEGIN CERTIFICATE-----"
                      className="font-mono"
                      style={{ fontSize: 'var(--kb-text-meta)' }}
                      autoComplete="off"
                    />
                  </Field>
                )}
              </>
            )}

            <Field label={t('ldap.timeout')} hint={t('ldap.timeout_hint')}>
              <Input
                type="number"
                value={form.connect_timeout_s}
                onChange={e => set('connect_timeout_s', e.target.value)}
                min={1}
                max={120}
              />
            </Field>
          </div>
        )}

        {/* ── 2. Service account and search ───────────────────────────── */}
        {step === 'service' && (
          <div className="space-y-4">
            <Callout variant="info">{t('ldap.service_intro')}</Callout>

            <Field label={t('ldap.bind_dn')} hint={t('ldap.bind_dn_hint')}>
              <Input
                value={form.bind_dn}
                onChange={e => set('bind_dn', e.target.value)}
                placeholder="cn=kubuno,ou=services,dc=exemple,dc=com"
                autoComplete="off"
              />
            </Field>

            <Field
              label={t('ldap.bind_password')}
              hint={hasStoredPassword ? t('ldap.bind_password_stored') : t('ldap.bind_password_hint')}
            >
              <Input
                type="password"
                value={form.bind_password}
                onChange={e => set('bind_password', e.target.value)}
                placeholder={hasStoredPassword ? '••••••••' : ''}
                autoComplete="new-password"
              />
            </Field>

            {hasStoredPassword && onClearPassword && (
              <Button variant="ghost" size="sm" onClick={onClearPassword} disabled={saving}>
                {t('ldap.bind_password_clear')}
              </Button>
            )}

            <Field label={t('ldap.base_dn')} hint={t('ldap.base_dn_hint')}>
              <Input
                value={form.base_dn}
                onChange={e => set('base_dn', e.target.value)}
                placeholder="dc=exemple,dc=com"
                autoComplete="off"
              />
            </Field>

            <Field label={t('ldap.user_filter')} hint={t('ldap.user_filter_hint')}>
              <Input
                value={form.user_filter}
                onChange={e => set('user_filter', e.target.value)}
                className="font-mono"
                autoComplete="off"
              />
            </Field>

            {!form.user_filter.includes('{login}') && (
              <Callout variant="danger">{t('ldap.err_no_placeholder')}</Callout>
            )}

            <Field label={t('ldap.user_scope')}>
              <Combobox
                value={form.user_scope}
                onChange={v => set('user_scope', v)}
                options={scopeOptions}
                width="100%"
                t={t}
              />
            </Field>
          </div>
        )}

        {/* ── 3. Attribute mapping ────────────────────────────────────── */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <Callout variant="info">{t('ldap.mapping_intro')}</Callout>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t('ldap.attr_username')} hint={t('ldap.attr_username_hint')}>
                <Input
                  value={form.attr_username}
                  onChange={e => set('attr_username', e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
              </Field>
              <Field label={t('ldap.attr_email')} hint={t('ldap.attr_email_hint')}>
                <Input
                  value={form.attr_email}
                  onChange={e => set('attr_email', e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
              </Field>
              <Field label={t('ldap.attr_display_name')}>
                <Input
                  value={form.attr_display_name}
                  onChange={e => set('attr_display_name', e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
              </Field>
              <Field label={t('ldap.attr_unique_id')} hint={t('ldap.attr_unique_id_hint')}>
                <Input
                  value={form.attr_unique_id}
                  onChange={e => set('attr_unique_id', e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── 4. Groups and synchronisation ───────────────────────────── */}
        {step === 'sync' && (
          <div className="space-y-4">
            <SwitchRow
              label={t('ldap.allow_signup')}
              hint={t('ldap.allow_signup_hint')}
              checked={form.allow_signup}
              onChange={v => set('allow_signup', v)}
            />

            <Field label={t('ldap.default_org_unit')} hint={t('ldap.default_org_unit_hint')}>
              <Combobox
                value={form.default_org_unit_id ?? ''}
                onChange={v => set('default_org_unit_id', v === '' ? null : v)}
                options={unitOptions}
                width="100%"
                t={t}
              />
            </Field>

            <SwitchRow
              label={t('ldap.sync_groups')}
              hint={t('ldap.sync_groups_hint')}
              checked={form.sync_groups}
              onChange={v => set('sync_groups', v)}
            />

            {form.sync_groups && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t('ldap.group_base_dn')} hint={t('ldap.group_base_dn_hint')}>
                  <Input
                    value={form.group_base_dn}
                    onChange={e => set('group_base_dn', e.target.value)}
                    placeholder="ou=groupes,dc=exemple,dc=com"
                    autoComplete="off"
                  />
                </Field>
                <Field label={t('ldap.group_filter')}>
                  <Input
                    value={form.group_filter}
                    onChange={e => set('group_filter', e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                </Field>
                <Field label={t('ldap.attr_group_name')}>
                  <Input
                    value={form.attr_group_name}
                    onChange={e => set('attr_group_name', e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                </Field>
                <Field label={t('ldap.attr_group_member')} hint={t('ldap.attr_group_member_hint')}>
                  <Input
                    value={form.attr_group_member}
                    onChange={e => set('attr_group_member', e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                </Field>
                <Field label={t('ldap.attr_member_of')} hint={t('ldap.attr_member_of_hint')}>
                  <Input
                    value={form.attr_member_of}
                    onChange={e => set('attr_member_of', e.target.value)}
                    className="font-mono"
                    placeholder="memberOf"
                    autoComplete="off"
                  />
                </Field>
              </div>
            )}

            <SwitchRow
              label={t('ldap.sync_enabled')}
              hint={t('ldap.sync_enabled_hint')}
              checked={form.sync_enabled}
              onChange={v => set('sync_enabled', v)}
            />

            {form.sync_enabled && (
              <Field label={t('ldap.sync_interval')} hint={t('ldap.sync_interval_hint')}>
                <Input
                  type="number"
                  value={form.sync_interval_min}
                  onChange={e => set('sync_interval_min', e.target.value)}
                  min={5}
                  max={10080}
                />
              </Field>
            )}

            <Field label={t('ldap.on_missing')}>
              <Combobox
                value={form.on_missing}
                onChange={v => set('on_missing', v)}
                options={missingOptions}
                width="100%"
                t={t}
              />
            </Field>

            {/* Stated on screen because it is the promise the code makes and the
                one operators most need to be able to trust. */}
            <Callout variant="info" title={t('ldap.never_delete_title')}>
              {t('ldap.never_delete_body')}
            </Callout>

            <SwitchRow
              label={t('ldap.enabled')}
              hint={t('ldap.enabled_hint')}
              checked={form.enabled}
              onChange={v => set('enabled', v)}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!canSave} loading={saving} onClick={onSave}>
            {isEdit ? t('common.save') : t('ldap.create')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/** Icons re-exported so the section can label its cards consistently. */
export const StepIcons = { Network, KeyRound, Users, RefreshCw }
