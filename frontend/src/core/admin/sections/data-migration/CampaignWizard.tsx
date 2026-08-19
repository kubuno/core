// Composing a migration campaign, in four steps.
//
// ## Why a wizard and not a form
//
// The four questions depend on each other in one direction and cannot be
// answered out of order: the service decides which module will work, the server
// decides whether a credential is even testable, the credentials decide which
// folders exist, and only then can a range exclude one of them by name. A single
// long form would present the fourth question before its answer is knowable.
//
// ## The bulk field is the feature
//
// An organisation migrating is migrating two hundred mailboxes, not two. So the
// mapping step is a paste area first — one line per account, the shape a
// spreadsheet exports — and a per-row editor second. Rows whose destination
// could not be resolved are kept and shown in red rather than dropped: silently
// discarding four lines out of two hundred is how a migration finishes
// "successfully" with four people missing their mail.
//
// ## What the passwords do here
//
// They are typed, held in this component's state for the length of the wizard,
// posted once, and never read back. Nothing in the page re-displays them, and
// the API cannot return them.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Check, Trash2, X } from 'lucide-react'
import { Badge, Button, Callout, Combobox, Input, Stepper, Toggle, type StepDef } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { api } from '../../../api/client'
import type { User } from '../../../types'
import {
  errorMessage, useCreateCampaign, useProbeSource,
  type Campaign, type MigrationService, type SourceFolder,
} from './api'

/** One mapping being composed. `targetId` empty = not resolved yet. */
interface Draft {
  key:      string
  login:    string
  password: string
  targetId: string
}

let draftSeq = 0
const newDraft = (login = '', password = '', targetId = ''): Draft =>
  ({ key: `d${draftSeq++}`, login, password, targetId })

/**
 * Splits a pasted line into its three fields.
 *
 * Comma, semicolon and tab all separate, because the three are what a
 * spreadsheet, a CSV export and a copied table column actually produce, and
 * asking an operator which one they used is a question with no good answer.
 */
function parseLine(line: string): { login: string; password: string; target: string } | null {
  const parts = line.split(/[,;\t]/).map(p => p.trim())
  if (parts.length < 2 || parts[0] === '') return null
  return { login: parts[0], password: parts[1] ?? '', target: parts[2] ?? '' }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
      {children}
    </span>
  )
}

export default function CampaignWizard({
  services, onClose, onCreated,
}: {
  services: MigrationService[]
  onClose: () => void
  onCreated: (campaign: Campaign) => void
}) {
  const { t } = useTranslation()

  const usable = services.filter(s => s.available)
  const [service, setService] = useState(usable[0]?.id ?? '')
  const [step, setStep]       = useState('service')

  const [name, setName]         = useState('')
  const [host, setHost]         = useState('')
  const [port, setPort]         = useState('993')
  const [security, setSecurity] = useState('ssl')

  const [bulk, setBulk]     = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])

  const [since, setSince]     = useState('')
  const [folders, setFolders] = useState<SourceFolder[] | null>(null)
  const [excluded, setExcluded] = useState<string[]>([])
  const [startNow, setStartNow] = useState(true)

  const [error, setError]     = useState<string | null>(null)
  const [probeMsg, setProbeMsg] = useState<string | null>(null)

  const probe  = useProbeSource()
  const create = useCreateCampaign()

  // The directory, once. A migration maps onto accounts that already exist, so
  // this list is the vocabulary the whole mapping step is written in.
  const { data: users } = useQuery({
    queryKey: ['admin-data-migration-users'],
    queryFn:  async () =>
      (await api.get<{ users: User[] }>('/admin/users', { params: { limit: 500 } })).data.users,
  })

  const userOptions = useMemo(
    () => (users ?? []).map(u => ({
      value:       u.id,
      label:       u.display_name?.trim() || u.email,
      description: u.email,
      keywords:    `${u.email} ${u.username}`,
    })),
    [users],
  )

  /** Resolves a pasted destination (an address, a username) to an account id. */
  const resolve = useMemo(() => {
    const index = new Map<string, string>()
    for (const u of users ?? []) {
      index.set(u.email.toLowerCase(), u.id)
      index.set(u.username.toLowerCase(), u.id)
    }
    return (raw: string) => index.get(raw.trim().toLowerCase()) ?? ''
  }, [users])

  const applyBulk = () => {
    const lines = bulk.split('\n').map(l => l.trim()).filter(l => l !== '')
    const parsed = lines
      .map(parseLine)
      .filter((p): p is { login: string; password: string; target: string } => p !== null)
      // A destination left blank falls back to the source login: migrating
      // "jean@ancien.fr" to the account whose address is the same is the common
      // case, and making an operator retype it two hundred times is not a
      // safeguard, it is friction.
      .map(p => newDraft(p.login, p.password, resolve(p.target || p.login)))
    if (parsed.length === 0) {
      setError(t('admin.migr_bulk_none'))
      return
    }
    setError(null)
    setDrafts(current => [...current, ...parsed])
    setBulk('')
  }

  const runProbe = async () => {
    const first = drafts.find(d => d.password !== '')
    if (!first) {
      setProbeMsg(t('admin.migr_probe_needs_account'))
      return
    }
    setProbeMsg(null)
    try {
      const result = await probe.mutateAsync({
        service,
        source: { kind: 'imap', host: host.trim(), port: Number(port) || 0, security },
        login:  first.login,
        password: first.password,
      })
      if (result.ok) {
        setFolders(result.folders ?? [])
        setProbeMsg(null)
      } else {
        setFolders(null)
        setProbeMsg(result.error ?? t('admin.migr_probe_failed'))
      }
    } catch (e) {
      setFolders(null)
      setProbeMsg(errorMessage(e, t('admin.migr_probe_failed')))
    }
  }

  const ready = drafts.filter(d => d.targetId !== '' && d.password !== '')
  const unresolved = drafts.length - ready.length

  const submit = async () => {
    setError(null)
    try {
      const campaign = await create.mutateAsync({
        name:    name.trim(),
        service,
        source:  { kind: 'imap', host: host.trim(), port: Number(port) || 0, security },
        since:   since === '' ? null : since,
        exclude_folders: excluded,
        accounts: ready.map(d => ({
          source_login:   d.login,
          password:       d.password,
          target_user_id: d.targetId,
        })),
        start: startNow,
      })
      onCreated(campaign)
    } catch (e) {
      setError(errorMessage(e, t('admin.migr_save_failed')))
    }
  }

  const steps: StepDef[] = [
    { id: 'service', label: t('admin.migr_step_service') },
    { id: 'source',  label: t('admin.migr_step_source') },
    { id: 'mapping', label: t('admin.migr_step_mapping') },
    { id: 'range',   label: t('admin.migr_step_range') },
  ]

  const canLeaveService = service !== ''
  const canLeaveSource  = host.trim() !== '' && Number(port) > 0 && name.trim() !== ''
  const canSubmit       = ready.length > 0 && !create.isPending

  const last = step === 'range'
  const order = steps.map(s => s.id)
  const index = Math.max(0, order.indexOf(step))
  const forward = () => setStep(order[Math.min(index + 1, order.length - 1)])
  const back    = () => setStep(order[Math.max(index - 1, 0)])

  const nextDisabled =
    (step === 'service' && !canLeaveService) || (step === 'source' && !canLeaveSource)

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.migr_new_title')}
        onClose={onClose}
        defaultWidth={860}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    last ? t('admin.migr_create') : t('admin.migr_next'),
            onClick:  () => { if (last) void submit(); else forward() },
            disabled: last ? !canSubmit : nextDisabled,
            loading:  last && create.isPending,
          },
          cancel: { label: t('admin.migr_cancel') },
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          <Stepper steps={steps} current={step} onStepChange={id => setStep(id)} t={t} />

          {step === 'service' && (
            <div className="flex flex-col gap-3">
              <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.migr_service_intro')}
              </p>
              {services.map(s => (
                <label
                  key={s.id}
                  className={`flex gap-3 rounded border p-3 transition-colors ${
                    !s.available
                      ? 'cursor-not-allowed border-border bg-surface-1'
                      : service === s.id
                        ? 'cursor-pointer border-primary bg-primary-light'
                        : 'cursor-pointer border-border hover:bg-surface-1'
                  }`}
                >
                  <input
                    type="radio"
                    name="migration-service"
                    className="mt-1 accent-[var(--color-primary)]"
                    checked={service === s.id}
                    disabled={!s.available}
                    onChange={() => setService(s.id)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                      {t(`admin.migr_service_${s.id}`)}
                    </span>
                    <span className="block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {s.available
                        ? t(`admin.migr_service_${s.id}_desc`)
                        : t('admin.migr_service_unavailable', { module: s.module_id })}
                    </span>
                  </span>
                </label>
              ))}
              {usable.length === 0 && (
                <Callout variant="warning" t={t}>{t('admin.migr_no_service')}</Callout>
              )}
            </div>
          )}

          {step === 'source' && (
            <div className="flex flex-col gap-4">
              <Input
                label={t('admin.migr_field_name')}
                value={name}
                autoFocus
                maxLength={200}
                placeholder={t('admin.migr_field_name_ph')}
                onChange={e => setName(e.target.value)}
                hint={t('admin.migr_field_name_hint')}
              />
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-56 flex-1">
                  <Input
                    label={t('admin.migr_field_host')}
                    value={host}
                    maxLength={255}
                    placeholder="imap.exemple.fr"
                    onChange={e => setHost(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label={t('admin.migr_field_port')}
                    value={port}
                    inputMode="numeric"
                    onChange={e => setPort(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                <div className="flex w-48 flex-col gap-1">
                  <FieldLabel>{t('admin.migr_field_security')}</FieldLabel>
                  <Combobox
                    value={security}
                    onChange={value => { setSecurity(value); setPort(value === 'ssl' ? '993' : '143') }}
                    options={[
                      { value: 'ssl',  label: t('admin.migr_security_ssl') },
                      { value: 'none', label: t('admin.migr_security_none') },
                    ]}
                    t={t}
                  />
                </div>
              </div>
              {/* STARTTLS is deliberately absent, and the note says so rather
                  than leaving an operator hunting for a missing option. */}
              <Callout variant="info" t={t}>{t('admin.migr_source_note')}</Callout>
              {security === 'none' && (
                <Callout variant="warning" t={t}>{t('admin.migr_security_none_warn')}</Callout>
              )}
            </div>
          )}

          {step === 'mapping' && (
            <div className="flex flex-col gap-4">
              <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.migr_mapping_intro')}
              </p>

              <div className="flex flex-col gap-2">
                <FieldLabel>{t('admin.migr_bulk_label')}</FieldLabel>
                <textarea
                  value={bulk}
                  rows={4}
                  spellCheck={false}
                  placeholder={'jean@ancien.fr, motdepasse, jean@exemple.fr'}
                  className="w-full resize-y rounded border border-border bg-surface-0 px-2 py-1.5 font-mono text-text-primary outline-none focus:border-primary"
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                  onChange={e => setBulk(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled={bulk.trim() === ''} onClick={applyBulk}>
                    {t('admin.migr_bulk_apply')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDrafts(d => [...d, newDraft()])}>
                    {t('admin.migr_add_one')}
                  </Button>
                  <span className="ms-auto text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {t('admin.migr_bulk_hint')}
                  </span>
                </div>
              </div>

              {drafts.length > 0 && (
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded border border-border p-2">
                  {drafts.map(d => {
                    const complete = d.targetId !== '' && d.password !== ''
                    return (
                      <div key={d.key} className="flex flex-wrap items-end gap-2">
                        <div className="min-w-48 flex-1">
                          <Input
                            label={t('admin.migr_col_source')}
                            value={d.login}
                            onChange={e => setDrafts(list =>
                              list.map(x => (x.key === d.key ? { ...x, login: e.target.value } : x)))}
                          />
                        </div>
                        <div className="w-40">
                          <Input
                            label={t('admin.migr_col_password')}
                            type="password"
                            value={d.password}
                            onChange={e => setDrafts(list =>
                              list.map(x => (x.key === d.key ? { ...x, password: e.target.value } : x)))}
                          />
                        </div>
                        <div className="flex min-w-56 flex-1 flex-col gap-1">
                          <FieldLabel>{t('admin.migr_col_target')}</FieldLabel>
                          <Combobox
                            value={d.targetId === '' ? null : d.targetId}
                            onChange={value => setDrafts(list =>
                              list.map(x => (x.key === d.key ? { ...x, targetId: value } : x)))}
                            options={userOptions}
                            placeholder={t('admin.migr_col_target_ph')}
                            t={t}
                          />
                        </div>
                        <span className="flex items-center gap-1 pb-2">
                          {complete
                            ? <Check size={16} className="text-success" />
                            : <AlertTriangle size={16} className="text-warning" />}
                          <button
                            type="button"
                            aria-label={t('admin.migr_remove_row')}
                            title={t('admin.migr_remove_row')}
                            className="rounded p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-danger"
                            onClick={() => setDrafts(list => list.filter(x => x.key !== d.key))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={ready.length > 0 ? 'primary' : 'neutral'}>
                  {t('admin.migr_ready_count', { count: ready.length })}
                </Badge>
                {unresolved > 0 && (
                  <span className="flex items-center gap-1.5 text-warning" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    <AlertTriangle size={14} /> {t('admin.migr_unresolved_count', { count: unresolved })}
                  </span>
                )}
              </div>
            </div>
          )}

          {step === 'range' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-52">
                  <Input
                    label={t('admin.migr_field_since')}
                    type="date"
                    value={since}
                    onChange={e => setSince(e.target.value)}
                    hint={t('admin.migr_field_since_hint')}
                  />
                </div>
                <Button variant="secondary" disabled={probe.isPending} onClick={() => void runProbe()}>
                  {probe.isPending ? t('admin.migr_probe_running') : t('admin.migr_probe')}
                </Button>
              </div>

              {probeMsg && (
                <Callout variant="warning" t={t}>{probeMsg}</Callout>
              )}

              {folders && folders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t('admin.migr_exclude_label')}</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {folders.map(f => {
                      const off = excluded.includes(f.name)
                      return (
                        <button
                          key={f.name}
                          type="button"
                          className={`flex items-center gap-1.5 rounded border px-2 py-1 transition-colors ${
                            off
                              ? 'border-border bg-surface-2 text-text-tertiary line-through'
                              : 'border-border bg-surface-0 text-text-primary hover:bg-surface-1'
                          }`}
                          style={{ fontSize: 'var(--kb-text-meta)' }}
                          onClick={() => setExcluded(list =>
                            off ? list.filter(n => n !== f.name) : [...list, f.name])}
                        >
                          {off && <X size={12} />}
                          {f.display_name || f.name}
                          <span className="text-text-tertiary">{f.messages}</span>
                        </button>
                      )
                    })}
                  </div>
                  <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {t('admin.migr_exclude_hint')}
                  </span>
                </div>
              )}

              {folders === null && (
                <Callout variant="info" t={t}>{t('admin.migr_probe_intro')}</Callout>
              )}

              <div className="rounded border border-border bg-surface-1 px-3 py-2">
                <Toggle
                  checked={startNow}
                  onChange={e => setStartNow(e.target.checked)}
                  label={t('admin.migr_start_now')}
                  description={t('admin.migr_start_now_desc')}
                />
              </div>

              <Callout variant="info" t={t}>
                {t('admin.migr_summary', { accounts: ready.length, host: host.trim() })}
              </Callout>
            </div>
          )}

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
          )}

          {index > 0 && (
            <div>
              <Button variant="ghost" size="sm" onClick={back}>{t('admin.migr_back')}</Button>
            </div>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
