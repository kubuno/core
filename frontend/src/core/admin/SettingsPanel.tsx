import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Toggle, Checkbox, Button, Dropdown, Input } from '@ui'
import type { DropdownOption } from '@ui'

interface Setting {
  key: string
  value: unknown
  category: string
  label: string | null
  description: string | null
  is_public: boolean
}

// ── IANA timezone list ────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS: DropdownOption[] = (
  typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
    ? (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone')
    : ['UTC', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']
).map(tz => ({ value: tz, label: tz }))

// ── Category display ──────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'general', 'auth', 'storage', 'security', 'navigation', 'mcp',
  'calendar', 'notes', 'office', 'photos',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState(false)

  const SELECT_SETTINGS: Record<string, DropdownOption[]> = {
    'calendar.default_timezone': TIMEZONE_OPTIONS,
    'calendar.week_starts_on': [
      { value: 'monday',   label: t('admin.opt_monday') },
      { value: 'sunday',   label: t('admin.opt_sunday') },
      { value: 'saturday', label: t('admin.opt_saturday') },
    ],
    'calendar.time_format': [
      { value: '24h', label: '24h  (14:30)' },
      { value: '12h', label: '12h  (2:30 PM)' },
    ],
    'notes.default_editor': [
      { value: 'wysiwyg',  label: t('admin.opt_wysiwyg') },
      { value: 'markdown', label: 'Markdown' },
    ],
    'office.default_format': [
      { value: 'docx', label: 'Word (.docx)' },
      { value: 'odt',  label: 'OpenDocument (.odt)' },
    ],
    'office.default_margins': [
      { value: 'normal', label: t('admin.opt_margin_normal') },
      { value: 'narrow', label: t('admin.opt_margin_narrow') },
      { value: 'wide',   label: t('admin.opt_margin_wide') },
    ],
  }

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<{ settings: Setting[] }>('/admin/settings').then(r => r.data.settings),
  })

  const update = useMutation({
    mutationFn: (updates: Record<string, unknown>) => api.patch('/admin/settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setEdits({})
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const currentValue = (s: Setting): unknown =>
    s.key in edits ? edits[s.key] : s.value

  const setEdit = (key: string, value: unknown) =>
    setEdits(prev => ({ ...prev, [key]: value }))

  const autoSave = (key: string, value: unknown) => {
    setEdit(key, value)
    update.mutate({ [key]: value })
  }

  if (!settings) return null

  const allCategories = [...new Set(settings.map(s => s.category))]
  const categories = [
    ...CATEGORY_ORDER.filter(c => allCategories.includes(c)),
    ...allCategories.filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  const hasPendingTextEdits = Object.keys(edits).some(k => {
    const s = settings.find(s => s.key === k)
    if (!s) return false
    return typeof s.value !== 'boolean'
      && s.key !== 'auth.api_token_allowed_roles'
      && !(s.key in SELECT_SETTINGS)
  })

  return (
    <div className="max-w-2xl">
      {categories.map(category => {
        const items = settings.filter(s => s.category === category)
        if (!items.length) return null

        return (
          <div key={category} className="mb-8">
            <h3 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
              {t('admin.cat_' + category, { defaultValue: category })}
            </h3>

            <div className="space-y-3">
              {items.map(s => {
                const val = currentValue(s)
                const isBoolean   = typeof s.value === 'boolean'
                const isRoleArray = s.key === 'auth.api_token_allowed_roles'
                const selectOpts  = SELECT_SETTINGS[s.key]
                const ALL_ROLES   = ['user', 'admin', 'guest'] as const

                const PublicBadge = s.is_public
                  ? <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded flex-shrink-0">{t('admin.public_badge')}</span>
                  : null

                // ── Boolean → Toggle ──────────────────────────────────────
                if (isBoolean) {
                  return (
                    <div key={s.key} className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3">
                      <div className="pr-4 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-text-primary">{s.label ?? s.key}</p>
                          {PublicBadge}
                        </div>
                        {s.description && (
                          <p className="text-xs text-text-tertiary mt-0.5">{s.description}</p>
                        )}
                      </div>
                      <Toggle
                        checked={Boolean(val)}
                        onChange={e => autoSave(s.key, e.target.checked)}
                      />
                    </div>
                  )
                }

                // ── Role array → Checkboxes ───────────────────────────────
                if (isRoleArray) {
                  return (
                    <div key={s.key} className="bg-white border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-text-primary">{s.label ?? s.key}</p>
                        {PublicBadge}
                      </div>
                      {s.description && (
                        <p className="text-xs text-text-tertiary mb-3">{s.description}</p>
                      )}
                      <div className="flex gap-4">
                        {ALL_ROLES.map(role => {
                          const current = Array.isArray(val) ? val as string[] : (s.value as string[]) ?? []
                          const checked = current.includes(role)
                          return (
                            <Checkbox
                              key={role}
                              label={role}
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? current.filter(r => r !== role)
                                  : [...current, role]
                                autoSave(s.key, next)
                              }}
                              className="capitalize"
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // ── Enum → Dropdown ───────────────────────────────────────
                if (selectOpts) {
                  return (
                    <div key={s.key} className="bg-white border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-text-primary">{s.label ?? s.key}</p>
                        {PublicBadge}
                      </div>
                      {s.description && (
                        <p className="text-xs text-text-tertiary mb-2">{s.description}</p>
                      )}
                      <Dropdown
                        value={String(val ?? '')}
                        onChange={v => autoSave(s.key, v)}
                        options={selectOpts}
                        width="100%"
                        height={34}
                        fontSize={13}
                      />
                    </div>
                  )
                }

                // ── Text / numeric → Input ────────────────────────────────
                const isNumeric = typeof s.value === 'number'
                return (
                  <div key={s.key} className="bg-white border border-border rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text-primary">{s.label ?? s.key}</label>
                      {PublicBadge}
                    </div>
                    {s.description && (
                      <p className="text-xs text-text-tertiary mb-2">{s.description}</p>
                    )}
                    <Input
                      type={isNumeric ? 'number' : 'text'}
                      value={String(val ?? '')}
                      onChange={e => setEdit(s.key, isNumeric ? Number(e.target.value) : e.target.value)}
                      className="font-mono bg-surface-1"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {hasPendingTextEdits && (
        <div className="sticky bottom-4 flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 shadow-md mt-4">
          <Button
            onClick={() => update.mutate(
              Object.fromEntries(
                Object.entries(edits).filter(([k]) => {
                  const s = settings.find(s => s.key === k)
                  return s && typeof s.value !== 'boolean'
                    && s.key !== 'auth.api_token_allowed_roles'
                    && !(s.key in SELECT_SETTINGS)
                })
              )
            )}
            loading={update.isPending}
          >
            {saved ? t('settings.profile_saved') : t('admin.save_changes')}
          </Button>
          <Button variant="ghost" onClick={() => setEdits({})}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  )
}
