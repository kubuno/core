// Creating and editing one content detector.
//
// Four blocks, in the order somebody actually thinks: what it is, what it looks
// for, what makes it credible (checksum and proximity), and how much of it is
// enough (the three thresholds). The trial panel sits beside them so a pattern
// can be tried **before** it is saved — tuning a detector by saving it, arming
// it and watching production is how false positives get shipped.

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save } from 'lucide-react'
import { Button, Callout, Card, Combobox, Input, Toggle, type ComboboxOption } from '@ui'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import {
  errorMessage, useCreateDetector, useDetector, useUpdateDetector,
  type ChecksumAlgo, type Detector, type DetectorInput, type DetectorKind, type DetectorLimits,
} from './api'
import { asPercent } from './labels'
import DetectorTrial from './DetectorTrial'

const KINDS: DetectorKind[] = ['regex', 'wordlist', 'checksum']
const CHECKSUMS: ChecksumAlgo[] = ['luhn', 'iban', 'nir', 'siret', 'rib_fr']
const CATEGORIES = ['identity', 'finance', 'contact', 'technical', 'secret', 'other']

interface Props {
  /** `null` creates a new detector. */
  id:      string | null
  limits?: DetectorLimits
  onClose: () => void
}

/** Form state. Kept as strings where the field is typed into. */
interface Form {
  key:                string
  label:              string
  description:        string
  category:           string
  kind:               DetectorKind
  pattern:            string
  terms:              string
  checksum:           ChecksumAlgo | ''
  proximity_terms:    string
  proximity_window:   number
  proximity_required: boolean
  base_confidence:    number
  checksum_bonus:     number
  proximity_bonus:    number
  min_confidence:     number
  min_matches:        number
  min_unique_matches: number
  is_enabled:         boolean
}

const BLANK: Form = {
  key: '', label: '', description: '', category: 'other', kind: 'regex',
  pattern: '', terms: '', checksum: '', proximity_terms: '', proximity_window: 120,
  proximity_required: false, base_confidence: 0.5, checksum_bonus: 0.35,
  proximity_bonus: 0.2, min_confidence: 0.7, min_matches: 1, min_unique_matches: 1,
  is_enabled: true,
}

/**
 * Rounds a confidence to two decimals.
 *
 * The column is a PostgreSQL `REAL`, so 0.7 comes back as 0.699999988079071 and
 * 0.6 as 0.6000000238418579. Putting that in a number field is not a rounding
 * detail — it reads as a value somebody typed wrong, and the next administrator
 * "fixes" it. Two decimals is also more precision than a confidence has.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formOf(d: Detector): Form {
  return {
    key: d.key,
    label: d.label,
    description: d.description ?? '',
    category: d.category,
    kind: d.kind,
    pattern: d.pattern ?? '',
    // One term per line: a comma is a legitimate character inside a term, and a
    // separator a term may contain is a separator that eventually splits one.
    terms: d.terms.join('\n'),
    checksum: d.checksum ?? '',
    proximity_terms: d.proximity_terms.join('\n'),
    proximity_window: d.proximity_window,
    proximity_required: d.proximity_required,
    base_confidence: round2(d.base_confidence),
    checksum_bonus: round2(d.checksum_bonus),
    proximity_bonus: round2(d.proximity_bonus),
    min_confidence: round2(d.min_confidence),
    min_matches: d.min_matches,
    min_unique_matches: d.min_unique_matches,
    is_enabled: d.is_enabled,
  }
}

function lines(raw: string): string[] {
  return raw.split('\n').map(s => s.trim()).filter(Boolean)
}

function inputOf(form: Form): DetectorInput {
  return {
    key: form.key.trim().toLowerCase(),
    label: form.label.trim(),
    description: form.description.trim() || null,
    category: form.category,
    kind: form.kind,
    pattern: form.kind === 'wordlist' ? null : form.pattern.trim() || null,
    terms: form.kind === 'wordlist' ? lines(form.terms) : [],
    checksum: form.kind === 'checksum' ? (form.checksum || null) : null,
    proximity_terms: lines(form.proximity_terms),
    proximity_window: form.proximity_window,
    proximity_required: form.proximity_required,
    base_confidence: form.base_confidence,
    checksum_bonus: form.checksum_bonus,
    proximity_bonus: form.proximity_bonus,
    min_confidence: form.min_confidence,
    min_matches: form.min_matches,
    min_unique_matches: form.min_unique_matches,
    is_enabled: form.is_enabled,
  }
}

export default function DetectorEditor({ id, limits, onClose }: Props) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(PRIV.RULES_MANAGE)

  const { data, isLoading } = useDetector(id)
  const create = useCreateDetector()
  const update = useUpdateDetector()

  const [form, setForm]   = useState<Form>(BLANK)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data?.detector) setForm(formOf(data.detector))
  }, [data])

  const detector = data?.detector
  const usedBy   = data?.used_by ?? []

  /**
   * Why the draft cannot be tried yet — and only that. The server does the real
   * validation (it is the one that has to compile the pattern); this exists so
   * the trial button says "no pattern yet" instead of round-tripping to a 400.
   */
  const draftError = useMemo(() => {
    if (form.kind === 'wordlist' && lines(form.terms).length === 0) return t('admin.det_need_terms')
    if (form.kind !== 'wordlist' && !form.pattern.trim()) return t('admin.det_need_pattern')
    if (form.kind === 'checksum' && !form.checksum) return t('admin.det_need_checksum')
    if (form.proximity_required && lines(form.proximity_terms).length === 0) {
      return t('admin.det_need_proximity')
    }
    if (form.min_unique_matches > form.min_matches) return t('admin.det_unreachable_threshold')
    return null
  }, [form, t])

  const save = async () => {
    setError(null)
    setSaved(false)
    try {
      const input = inputOf(form)
      if (id) await update.mutateAsync({ id, input })
      else await create.mutateAsync(input)
      setSaved(true)
      onClose()
    } catch (e) {
      setError(errorMessage(e, t('admin.det_save_failed')))
    }
  }

  const kindOptions: ComboboxOption[] = KINDS.map(k => ({
    value: k,
    label: t(`admin.det_kind_${k}`),
    description: t(`admin.det_kind_${k}_help`),
  }))
  const checksumOptions: ComboboxOption[] = [
    { value: '', label: t('admin.det_sum_none') },
    ...CHECKSUMS.map(c => ({ value: c, label: t(`admin.det_sum_${c}`) })),
  ]
  const categoryOptions: ComboboxOption[] = CATEGORIES.map(c => ({
    value: c,
    label: t(`admin.det_cat_${c}`),
  }))

  const busy = create.isPending || update.isPending

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onClose}>
          {t('admin.det_back')}
        </Button>
      </div>

      <h1 className="mt-2 min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {id ? (detector?.label ?? t('admin.det_edit')) : t('admin.det_new')}
      </h1>

      {isLoading && id && (
        <p className="mt-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.det_loading')}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Callout variant="danger" title={t('admin.det_save_failed')} t={t}>{error}</Callout>
        </div>
      )}

      {detector?.is_builtin && (
        <div className="mt-3">
          <Callout variant="info" title={t('admin.det_builtin_title')} t={t}>
            {t('admin.det_builtin_body')}
          </Callout>
        </div>
      )}

      {usedBy.length > 0 && (
        <div className="mt-3">
          <Callout variant="info" title={t('admin.det_used_by_title', { count: usedBy.length })} t={t}>
            {usedBy.join(' · ')}
          </Callout>
        </div>
      )}

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        {/* ── Identity ─────────────────────────────────────────────── */}
        <Card title={t('admin.det_block_identity')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.det_field_label')}
              value={form.label}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
            <Input
              label={t('admin.det_field_key')}
              value={form.key}
              disabled={!canManage || !!detector?.is_builtin}
              hint={t('admin.det_field_key_hint')}
              onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <Input
              label={t('admin.det_field_description')}
              value={form.description}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="mt-3 max-w-xs">
            <span className="block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.det_field_category')}
            </span>
            <div className="mt-1">
              <Combobox
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={categoryOptions}
                disabled={!canManage}
                aria-label={t('admin.det_field_category')}
                t={t}
              />
            </div>
          </div>
          <div className="mt-4">
            <Toggle
              label={t('admin.det_field_enabled')}
              description={t('admin.det_field_enabled_hint')}
              checked={form.is_enabled}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, is_enabled: e.target.checked }))}
            />
          </div>
        </Card>

        {/* ── What it looks for ────────────────────────────────────── */}
        <Card title={t('admin.det_block_shape')}>
          <span className="block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.det_field_kind')}
          </span>
          <div className="mt-1 max-w-xs">
            <Combobox
              value={form.kind}
              onChange={v => setForm(f => ({ ...f, kind: v as DetectorKind }))}
              options={kindOptions}
              disabled={!canManage}
              aria-label={t('admin.det_field_kind')}
              t={t}
            />
          </div>

          {form.kind === 'wordlist'
            ? (
              <div className="mt-3">
                <label
                  htmlFor="detector-terms"
                  className="block text-text-secondary"
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                >
                  {t('admin.det_field_terms')}
                </label>
                <textarea
                  id="detector-terms"
                  value={form.terms}
                  rows={5}
                  disabled={!canManage}
                  spellCheck={false}
                  onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                  className="mt-1 w-full resize-y rounded-md border border-border bg-surface-0 px-3 py-2 text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  style={{ fontSize: 'var(--kb-text-body)' }}
                />
                <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.det_field_terms_hint', { max: limits?.terms ?? 200 })}
                </p>
              </div>
            )
            : (
              <div className="mt-3">
                <label
                  htmlFor="detector-pattern"
                  className="block text-text-secondary"
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                >
                  {t('admin.det_field_pattern')}
                </label>
                <textarea
                  id="detector-pattern"
                  value={form.pattern}
                  rows={3}
                  disabled={!canManage}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))}
                  className="mt-1 w-full resize-y rounded-md border border-border bg-surface-0 px-3 py-2 font-mono text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  style={{ fontSize: 'var(--kb-text-body)' }}
                />
                <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.det_field_pattern_hint', { max: limits?.pattern_len ?? 2000 })}
                </p>
              </div>
            )}

          {form.kind === 'checksum' && (
            <div className="mt-3 max-w-xs">
              <span className="block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.det_field_checksum')}
              </span>
              <div className="mt-1">
                <Combobox
                  value={form.checksum}
                  onChange={v => setForm(f => ({ ...f, checksum: v as ChecksumAlgo | '' }))}
                  options={checksumOptions}
                  disabled={!canManage}
                  aria-label={t('admin.det_field_checksum')}
                  t={t}
                />
              </div>
              <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.det_field_checksum_hint')}
              </p>
            </div>
          )}
        </Card>

        {/* ── Proximity ────────────────────────────────────────────── */}
        <Card title={t('admin.det_block_proximity')} subtitle={t('admin.det_block_proximity_help')}>
          <label
            htmlFor="detector-proximity"
            className="block text-text-secondary"
            style={{ fontSize: 'var(--kb-text-meta)' }}
          >
            {t('admin.det_field_proximity_terms')}
          </label>
          <textarea
            id="detector-proximity"
            value={form.proximity_terms}
            rows={4}
            disabled={!canManage}
            spellCheck={false}
            onChange={e => setForm(f => ({ ...f, proximity_terms: e.target.value }))}
            className="mt-1 w-full resize-y rounded-md border border-border bg-surface-0 px-3 py-2 text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            style={{ fontSize: 'var(--kb-text-body)' }}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.det_field_proximity_window')}
              type="number"
              min={0}
              max={4000}
              value={String(form.proximity_window)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, proximity_window: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="mt-3">
            <Toggle
              label={t('admin.det_field_proximity_required')}
              description={t('admin.det_field_proximity_required_hint')}
              checked={form.proximity_required}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, proximity_required: e.target.checked }))}
            />
          </div>
        </Card>

        {/* ── Confidence and the three thresholds ──────────────────── */}
        <Card title={t('admin.det_block_thresholds')} subtitle={t('admin.det_block_thresholds_help')}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label={t('admin.det_field_base_confidence')}
              type="number" min={0} max={1} step={0.05}
              value={String(form.base_confidence)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, base_confidence: Number(e.target.value) }))}
            />
            <Input
              label={t('admin.det_field_checksum_bonus')}
              type="number" min={0} max={1} step={0.05}
              value={String(form.checksum_bonus)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, checksum_bonus: Number(e.target.value) }))}
            />
            <Input
              label={t('admin.det_field_proximity_bonus')}
              type="number" min={0} max={1} step={0.05}
              value={String(form.proximity_bonus)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, proximity_bonus: Number(e.target.value) }))}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input
              label={t('admin.det_field_min_confidence')}
              type="number" min={0} max={1} step={0.05}
              value={String(form.min_confidence)}
              hint={asPercent(form.min_confidence)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, min_confidence: Number(e.target.value) }))}
            />
            <Input
              label={t('admin.det_field_min_matches')}
              type="number" min={1} max={10000}
              value={String(form.min_matches)}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, min_matches: Number(e.target.value) || 1 }))}
            />
            <Input
              label={t('admin.det_field_min_unique')}
              type="number" min={1} max={10000}
              value={String(form.min_unique_matches)}
              hint={t('admin.det_field_min_unique_hint')}
              error={form.min_unique_matches > form.min_matches
                ? t('admin.det_unreachable_threshold')
                : undefined}
              disabled={!canManage}
              onChange={e => setForm(f => ({ ...f, min_unique_matches: Number(e.target.value) || 1 }))}
            />
          </div>
        </Card>

        {/* ── The trial ────────────────────────────────────────────── */}
        <div className="min-w-0 lg:col-span-2">
          <DetectorTrial
            detectorId={id}
            draft={canManage && !draftError ? inputOf(form) : null}
            draftError={draftError}
          />
        </div>
      </div>

      {canManage && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" icon={<Save size={14} />} loading={busy} onClick={() => void save()}>
            {t('admin.det_save')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            {t('admin.det_cancel')}
          </Button>
          {saved && (
            <span className="text-success" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.det_saved')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
