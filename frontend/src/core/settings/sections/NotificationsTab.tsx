import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dropdown, Checkbox, useSaveShortcut } from '@ui'
import { useAuthStore } from '../../store/authStore'
import { useModulesStore } from '../../store/modulesStore'
import { NotificationRegistry } from '../../slots/SlotRegistry'
import { api } from '../../api/client'

function NotifCheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <Checkbox checked={checked} onChange={onChange} />
}

export function NotificationsTab() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const { activeModules } = useModulesStore()
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const groups = NotificationRegistry.getGroups(activeIds)

  const stored = (user?.preferences?.notifications ?? {}) as Record<string, unknown>
  const sa = (stored.activity ?? {}) as Record<string, { email?: boolean; push?: boolean }>
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)

  const [n, setN] = useState({
    emailReminder:  str(stored.emailReminder, 'never'),
    soundOnNotif:   !!stored.soundOnNotif,
    soundOnCall:    !!stored.soundOnCall,
    emailFrequency: str(stored.emailFrequency, 'hourly'),
    dailyDigest:    !!stored.dailyDigest,
  })
  const [matrix, setMatrix] = useState<Record<string, { email: boolean; push: boolean }>>(() => {
    const m: Record<string, { email: boolean; push: boolean }> = {}
    for (const g of groups) for (const a of g.activities) {
      const k = `${g.moduleId}:${a.id}`
      m[k] = { email: sa[k]?.email ?? !!a.emailDefault, push: sa[k]?.push ?? !!a.pushDefault }
    }
    return m
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const cell = (k: string, a: { emailDefault?: boolean; pushDefault?: boolean }) =>
    matrix[k] ?? { email: !!a.emailDefault, push: !!a.pushDefault }
  const toggle = (k: string, a: { emailDefault?: boolean; pushDefault?: boolean }, ch: 'email' | 'push') =>
    setMatrix(m => { const c = m[k] ?? { email: !!a.emailDefault, push: !!a.pushDefault }; return { ...m, [k]: { ...c, [ch]: !c[ch] } } })

  const save = async () => {
    setBusy(true)
    try {
      const notifications = { ...n, activity: matrix }
      const { data } = await api.patch<{ user: typeof user }>('/me', { preferences: { notifications } })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } finally { setBusy(false) }
  }

  useSaveShortcut(() => { void save() }, !busy)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Global notification options */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">{t('settings.notif_title', { defaultValue: 'Notifications' })}</h2>
        <label className="block text-sm text-text-secondary mb-1.5">
          {t('settings.notif_email_reminder', { defaultValue: 'Envoyer par e-mail des rappels des notifications non gérées après :' })}
        </label>
        <Dropdown value={n.emailReminder} onChange={v => setN(p => ({ ...p, emailReminder: v }))}
          options={[
            { value: 'never', label: t('settings.notif_never', { defaultValue: 'Jamais' }) },
            { value: '1h', label: t('settings.notif_after_1h', { defaultValue: 'Après 1 heure' }) },
            { value: '3h', label: t('settings.notif_after_3h', { defaultValue: 'Après 3 heures' }) },
            { value: '1d', label: t('settings.notif_after_1d', { defaultValue: 'Après 1 jour' }) },
          ]} />
        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
          <NotifCheck checked={n.soundOnNotif} onChange={() => setN(p => ({ ...p, soundOnNotif: !p.soundOnNotif }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_sound', { defaultValue: "Jouer un son lorsqu'une notification arrive" })}</span>
        </label>
        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
          <NotifCheck checked={n.soundOnCall} onChange={() => setN(p => ({ ...p, soundOnCall: !p.soundOnCall }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_sound_call', { defaultValue: "Jouer un son quand un appel est lancé" })}</span>
        </label>
      </section>

      {/* Activity matrix (E-mail / Push) — contributed by modules */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-1">{t('settings.notif_activity', { defaultValue: 'Activité' })}</h2>
        <p className="text-sm text-text-tertiary mb-5">
          {t('settings.notif_activity_desc', { defaultValue: 'Sélectionnez les activités pour lesquelles vous souhaitez recevoir une notification par e-mail ou une notification push.' })}
        </p>

        <div className="space-y-7">
          {groups.map(g => (
            <div key={`${g.moduleId}:${g.title}`}>
              <div className="flex items-center border-b-2 border-border pb-2 mb-1">
                <span className="flex-1 text-sm font-bold text-text-primary">{g.title}</span>
                <span className="w-16 text-center text-xs font-medium text-text-tertiary">{t('settings.notif_col_email', { defaultValue: 'E-mail' })}</span>
                <span className="w-16 text-center text-xs font-medium text-text-tertiary">{t('settings.notif_col_push', { defaultValue: 'Push' })}</span>
              </div>
              {g.activities.map(a => {
                const k = `${g.moduleId}:${a.id}`
                const c = cell(k, a)
                return (
                  <div key={k} className="flex items-center py-2.5 border-b border-border/60 last:border-0">
                    <span className="flex-1 text-sm text-text-primary pr-4">{a.label}</span>
                    <span className="w-16 flex justify-center"><NotifCheck checked={c.email} onChange={() => toggle(k, a, 'email')} /></span>
                    <span className="w-16 flex justify-center"><NotifCheck checked={c.push} onChange={() => toggle(k, a, 'push')} /></span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <label className="text-sm text-text-secondary">{t('settings.notif_email_freq', { defaultValue: "Envoyer des e-mails d'activité" })}</label>
          <Dropdown value={n.emailFrequency} onChange={v => setN(p => ({ ...p, emailFrequency: v }))}
            options={[
              { value: 'asap', label: t('settings.notif_freq_asap', { defaultValue: 'Dès que possible' }) },
              { value: 'hourly', label: t('settings.notif_freq_hourly', { defaultValue: 'Toutes les heures' }) },
              { value: 'daily', label: t('settings.notif_freq_daily', { defaultValue: 'Une fois par jour' }) },
              { value: 'weekly', label: t('settings.notif_freq_weekly', { defaultValue: 'Une fois par semaine' }) },
            ]} />
        </div>
      </section>

      {/* Daily digest */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">{t('settings.notif_digest_title', { defaultValue: 'Résumé journalier des activités' })}</h2>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <NotifCheck checked={n.dailyDigest} onChange={() => setN(p => ({ ...p, dailyDigest: !p.dailyDigest }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_digest_on', { defaultValue: 'Recevoir un résumé des activités chaque matin' })}</span>
        </label>
      </section>

      <Button onClick={save} loading={busy}>
        {saved ? t('settings.profile_saved') : t('settings.save')}
      </Button>
    </div>
  )
}

// Core-owned notification activities (account & security). Modules add their own
// groups via NotificationRegistry.register(...) from their entry.ts.
NotificationRegistry.register({
  moduleId: 'core', title: 'Compte et sécurité', order: 90,
  activities: [
    { id: 'group_membership', label: 'Vos adhésions aux groupes ont été modifiées', emailDefault: true },
    { id: 'password_email',   label: 'Votre mot de passe ou adresse e-mail a été modifié', emailDefault: true },
    { id: 'security',         label: 'Connexion à un nouvel appareil ou navigateur', emailDefault: true, pushDefault: true },
    { id: 'totp',             label: "TOTP (application d'authentification)", emailDefault: true, pushDefault: true },
  ],
})
