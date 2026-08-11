// One day's sheet: what it is called, what kind of day it is, and — the part
// that actually needs an editor — *when* it falls.
//
// The rule builder shows the dates it produces as they are typed, for the three
// coming years. Without that, "Pâques + 39" is a number somebody has to trust;
// with it, they see "jeudi 14 mai 2026" and know immediately whether they meant
// Ascension. The dates come from the server, which owns the one expander — this
// dialog never computes a date itself.

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Dropdown, Input, NumberInput } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FieldLabel from '../resources/FieldLabel'
import { formatDate, monthName, weekdayName } from './ruleText'
import {
  errorMessage, useCreateHoliday, usePreviewRule, useUpdateHoliday,
  type Category, type Holiday, type HolidayInput, type Observance,
  type PreviewDate, type RuleKind, type RuleParams,
} from './api'

const CATEGORIES: Category[] = [
  'public', 'bank', 'government', 'school', 'optional', 'half_day',
  'armed_forces', 'workday', 'observance',
]

const OBSERVANCES: Observance[] = [
  'none', 'next_workday', 'nearest_workday',
  'sunday_to_monday', 'saturday_to_monday', 'saturday_to_friday',
]

const KINDS: RuleKind[] = ['fixed', 'easter', 'nth_weekday', 'dates']

/** The parameters a kind starts from when the editor switches to it. */
function defaultsFor(kind: RuleKind): RuleParams {
  switch (kind) {
    case 'fixed':       return { month: 1, day: 1 }
    case 'easter':      return { offset: 0, basis: 'gregorian' }
    case 'nth_weekday': return { month: 1, weekday: 1, nth: 1 }
    case 'dates':       return { dates: [] }
  }
}

export default function HolidayDialog({
  calendarId, holiday, onClose,
}: {
  calendarId: string
  /** `null` creates. */
  holiday: Holiday | null
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'fr'

  const [name, setName]             = useState(holiday?.name ?? '')
  const [category, setCategory]     = useState<Category>(holiday?.category ?? 'public')
  const [kind, setKind]             = useState<RuleKind>(holiday?.kind ?? 'fixed')
  const [rule, setRule]             = useState<RuleParams>(holiday?.rule ?? defaultsFor('fixed'))
  const [observance, setObservance] = useState<Observance>(holiday?.observance ?? 'none')
  const [fromYear, setFromYear]     = useState<string>(holiday?.from_year?.toString() ?? '')
  const [toYear, setToYear]         = useState<string>(holiday?.to_year?.toString() ?? '')
  const [datesText, setDatesText]   = useState((holiday?.rule.dates ?? []).join('\n'))
  const [error, setError]           = useState<string | null>(null)
  const [preview, setPreview]       = useState<PreviewDate[]>([])

  const create  = useCreateHoliday(calendarId)
  const update  = useUpdateHoliday()
  const runPreview = usePreviewRule()
  const busy = create.isPending || update.isPending

  /** The rule as the server will receive it. */
  const composed: RuleParams = useMemo(() => {
    if (kind !== 'dates') return rule
    return {
      dates: datesText
        .split(/[\s,;]+/)
        .map(s => s.trim())
        .filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    }
  }, [kind, rule, datesText])

  // The preview follows every keystroke, debounced: it is the feedback loop the
  // whole editor exists for, and asking for it on save would be asking too late.
  useEffect(() => {
    const timer = setTimeout(() => {
      runPreview.mutate(
        { kind, rule: composed, observance },
        { onSuccess: setPreview, onError: () => setPreview([]) },
      )
    }, 250)
    return () => clearTimeout(timer)
    // `runPreview` is a stable mutation object; including it would re-run on
    // every render of the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, JSON.stringify(composed), observance])

  const submit = async () => {
    setError(null)
    const input: HolidayInput = {
      name: name.trim(),
      category,
      kind,
      rule: composed,
      observance,
      from_year: fromYear.trim() === '' ? null : Number(fromYear),
      to_year:   toYear.trim() === ''   ? null : Number(toYear),
      color: holiday?.color ?? null,
    }
    try {
      if (holiday) await update.mutateAsync({ id: holiday.id, input })
      else         await create.mutateAsync(input)
      onClose()
    } catch (e) {
      setError(errorMessage(e, t('admin.hol_save_failed')))
    }
  }

  const months   = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(locale, i + 1) }))
  const weekdays = Array.from({ length: 7  }, (_, i) => ({ value: String(i + 1), label: weekdayName(locale, i + 1) }))

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={holiday ? t('admin.hol_edit_day') : t('admin.hol_new_day')}
        onClose={onClose}
        defaultWidth={620}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.hol_save'),
            onClick:  () => void submit(),
            disabled: busy || name.trim() === '',
            loading:  busy,
          },
          cancel: { label: t('admin.hol_cancel') },
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label={t('admin.hol_day_name')}
            value={name}
            maxLength={200}
            autoFocus
            onChange={e => setName(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FieldLabel>{t('admin.hol_day_category')}</FieldLabel>
              <Dropdown
                value={category}
                options={CATEGORIES.map(c => ({ value: c, label: t(`admin.hol_cat_${c}`) }))}
                onChange={v => setCategory(v as Category)}
                width="100%" height={36} focusable
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>{t('admin.hol_day_kind')}</FieldLabel>
              <Dropdown
                value={kind}
                options={KINDS.map(k => ({ value: k, label: t(`admin.hol_kind_${k}`) }))}
                onChange={v => { const next = v as RuleKind; setKind(next); setRule(defaultsFor(next)) }}
                width="100%" height={36} focusable
              />
            </div>
          </div>

          {/* ── The rule itself ─────────────────────────────────────────── */}
          {kind === 'fixed' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <FieldLabel>{t('admin.hol_field_month')}</FieldLabel>
                <Dropdown
                  value={String(rule.month ?? 1)}
                  options={months}
                  onChange={v => setRule({ ...rule, month: Number(v) })}
                  width="100%" height={36} focusable
                />
              </div>
              <NumberInput
                label={t('admin.hol_field_day')}
                value={rule.day ?? 1}
                min={1}
                max={31}
                onChange={v => setRule({ ...rule, day: v })}
              />
            </div>
          )}

          {kind === 'easter' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                label={t('admin.hol_field_offset')}
                value={rule.offset ?? 0}
                min={-200}
                max={200}
                onChange={v => setRule({ ...rule, offset: v })}
                hint={t('admin.hol_field_offset_hint')}
              />
              <div className="flex flex-col gap-1">
                <FieldLabel>{t('admin.hol_field_basis')}</FieldLabel>
                <Dropdown
                  value={rule.basis ?? 'gregorian'}
                  options={[
                    { value: 'gregorian', label: t('admin.hol_basis_gregorian') },
                    { value: 'julian',    label: t('admin.hol_basis_julian') },
                  ]}
                  onChange={v => setRule({ ...rule, basis: v as 'gregorian' | 'julian' })}
                  width="100%" height={36} focusable
                />
              </div>
            </div>
          )}

          {kind === 'nth_weekday' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <FieldLabel>{t('admin.hol_field_rank')}</FieldLabel>
                <Dropdown
                  value={String(rule.nth ?? 1)}
                  options={[
                    { value: '1',  label: t('admin.hol_rank_1') },
                    { value: '2',  label: t('admin.hol_rank_2') },
                    { value: '3',  label: t('admin.hol_rank_3') },
                    { value: '4',  label: t('admin.hol_rank_4') },
                    { value: '5',  label: t('admin.hol_rank_5') },
                    { value: '-1', label: t('admin.hol_rank_last') },
                  ]}
                  onChange={v => setRule({ ...rule, nth: Number(v) })}
                  width="100%" height={36} focusable
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>{t('admin.hol_field_weekday')}</FieldLabel>
                <Dropdown
                  value={String(rule.weekday ?? 1)}
                  options={weekdays}
                  onChange={v => setRule({ ...rule, weekday: Number(v) })}
                  width="100%" height={36} focusable
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>{t('admin.hol_field_month')}</FieldLabel>
                <Dropdown
                  value={String(rule.month ?? 1)}
                  options={months}
                  onChange={v => setRule({ ...rule, month: Number(v) })}
                  width="100%" height={36} focusable
                />
              </div>
            </div>
          )}

          {kind === 'dates' && (
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="hol-dates">{t('admin.hol_field_dates')}</FieldLabel>
              <textarea
                id="hol-dates"
                value={datesText}
                onChange={e => setDatesText(e.target.value)}
                rows={5}
                spellCheck={false}
                className="w-full rounded border border-border bg-surface-0 p-2 font-mono text-text-primary"
                style={{ fontSize: 'var(--kb-text-body)' }}
                placeholder={'2026-03-20\n2027-03-09'}
              />
              {/* An explicit list ends. Saying so here is what keeps somebody
                  from wondering, three years from now, why the day vanished. */}
              <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>
                {t('admin.hol_field_dates_hint')}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <FieldLabel>{t('admin.hol_field_observance')}</FieldLabel>
              <Dropdown
                value={observance}
                options={OBSERVANCES.map(o => ({ value: o, label: t(`admin.hol_obs_${o}`) }))}
                onChange={v => setObservance(v as Observance)}
                width="100%" height={36} focusable
              />
            </div>
            <Input
              label={t('admin.hol_field_from_year')}
              value={fromYear}
              inputMode="numeric"
              maxLength={4}
              onChange={e => setFromYear(e.target.value.replace(/\D/g, ''))}
            />
            <Input
              label={t('admin.hol_field_to_year')}
              value={toYear}
              inputMode="numeric"
              maxLength={4}
              onChange={e => setToYear(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {/* ── What the rule actually produces ─────────────────────────── */}
          <div className="rounded border border-border bg-surface-1 p-3">
            <FieldLabel>{t('admin.hol_preview')}</FieldLabel>
            {preview.length === 0 ? (
              <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.hol_preview_none')}
              </p>
            ) : (
              <ul className="mt-1 flex flex-col gap-0.5">
                {preview.map(d => (
                  <li key={`${d.year}-${d.date}`} className="text-text-primary"
                      style={{ fontSize: 'var(--kb-text-body)' }}>
                    {formatDate(locale, d.date)}
                    {d.observed_from && (
                      <span className="text-text-secondary">
                        {' '}{t('admin.hol_preview_moved', { from: formatDate(locale, d.observed_from) })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {holiday?.is_builtin && !holiday.is_overridden && (
            <Callout variant="warning" t={t}>{t('admin.hol_detach_warning')}</Callout>
          )}

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
