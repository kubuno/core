import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Clock } from 'lucide-react'
import { Button, Input, Dropdown, Textarea, useToast } from '@ui'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import { Field, Section, type Vis } from './profileFields'

/**
 * A form box, as the API wants it: the trimmed text, or `null` to erase.
 *
 * `PATCH /api/v1/me` tells an absent field ("leave this alone") from an explicit
 * `null` ("erase this"). Sending `""` would store a blank string, and somebody
 * who cleared their date of birth would find it still there under a different
 * disguise — which for a personal datum is not an inconvenience but a broken
 * promise.
 */
const orNull = (value: string): string | null => (value.trim() ? value.trim() : null)

const PROFILE_LANGS: [string, string][] = [
  ['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['de', 'Deutsch'],
  ['it', 'Italiano'], ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'],
  ['ru', 'Русский'], ['ar', 'العربية'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'],
]
const PROFILE_LOCALES: [string, string][] = [
  ['fr-FR', 'French'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'],
  ['de-DE', 'German'], ['es-ES', 'Spanish'], ['it-IT', 'Italian'],
  ['pt-PT', 'Portuguese'], ['nl-NL', 'Dutch'], ['ja-JP', 'Japanese'], ['zh-CN', 'Chinese'],
]
function profileTimezones(): string[] {
  try {
    // Intl.supportedValuesOf is available in modern browsers.
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    if (fn) return fn('timeZone')
  } catch { /* fall through */ }
  return ['UTC', 'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']
}

export function ProfileTab() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { user, updateUser } = useAuthStore()
  const prefs = (user?.preferences ?? {}) as Record<string, unknown>
  const prof = (prefs.profile ?? {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')

  // Six of these boxes are backed by real columns since migration `000114`:
  // name pronunciation, pronouns, work location, introduction, gender and
  // birthday. They are read from the account row, not from the `preferences`
  // document — the three that used to live there were moved by that migration,
  // so there is exactly one place each of them is stored.
  const [f, setF] = useState({
    fullName:         user?.display_name ?? '',
    firstName:        user?.first_name ?? '',
    lastName:         user?.last_name ?? '',
    namePronunciation: user?.name_pronunciation ?? '',
    pronouns:         user?.pronouns ?? '',
    workLocation:     user?.work_location ?? '',
    gender:           user?.gender ?? '',
    birthday:         user?.birthday ?? '',
    introduction:     user?.introduction ?? '',
    extraEmails:    Array.isArray(prof.extraEmails) ? (prof.extraEmails as string[]) : [],
    phone:          s(prof.phone),
    location:       s(prof.location),
    language:       s(prefs.language) || 'fr',
    locale:         s(prefs.locale),
    firstDayOfWeek: s(prefs.firstDayOfWeek) || 'auto',
    timezone:       s(prefs.timezone),
    website:        s(prof.website),
    x:              s(prof.x),
    bluesky:        s(prof.bluesky),
    fediverse:      s(prof.fediverse),
    organization:   s(prof.organization),
    jobFunction:    s(prof.jobFunction),
    title:          s(prof.title),
  })
  const storedVis = (prof.visibility as Record<string, Vis>) ?? {}
  const [vis, setVis] = useState<Record<string, Vis>>({
    fullName: 'public', firstName: 'public', lastName: 'public', namePronunciation: 'public', pronouns: 'public', emails: 'public',
    phone: 'private', location: 'private', workLocation: 'public',
    gender: 'private', birthday: 'private',
    website: 'private', x: 'private', bluesky: 'private', fediverse: 'private',
    organization: 'private', jobFunction: 'private', title: 'private',
    // The old `bio` box became `introduction`; whoever had already chosen a
    // visibility for it keeps that choice rather than being silently reset.
    introduction: storedVis.bio ?? 'private',
    ...storedVis,
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }))
  const setV = (k: string) => (v: Vis) => setVis(p => ({ ...p, [k]: v }))
  const tz = profileTimezones()

  // Live preview of the chosen locale: current date/time + week start.
  const localePreview = (() => {
    try { return new Intl.DateTimeFormat(f.locale || undefined, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()) } catch { return '' }
  })()
  const weekStartLabel = f.firstDayOfWeek === '0'
    ? t('settings.profile_week_sun', { defaultValue: 'Dimanche' })
    : f.firstDayOfWeek === '6'
      ? t('settings.profile_week_sat', { defaultValue: 'Samedi' })
      : t('settings.profile_week_mon', { defaultValue: 'Lundi' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const profile = {
        extraEmails: f.extraEmails.map(x => x.trim()).filter(Boolean),
        phone: f.phone, location: f.location, website: f.website,
        x: f.x, bluesky: f.bluesky, fediverse: f.fediverse, organization: f.organization,
        jobFunction: f.jobFunction, title: f.title, visibility: vis,
      }
      const preferences = {
        language: f.language, locale: f.locale, firstDayOfWeek: f.firstDayOfWeek, timezone: f.timezone, profile,
      }
      const { data } = await api.patch<{ user: typeof user }>('/me', {
        display_name: f.fullName,
        first_name: orNull(f.firstName),
        last_name:  orNull(f.lastName),
        preferences,
        // Sent on every save, unchanged values included: the server refuses a
        // governed field only when the value actually MOVES, so echoing back
        // what is already stored never trips a policy the person is subject to.
        name_pronunciation: orNull(f.namePronunciation),
        pronouns:           orNull(f.pronouns),
        work_location:      orNull(f.workLocation),
        introduction:       orNull(f.introduction),
        gender:             orNull(f.gender),
        birthday:           orNull(f.birthday),
      })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
      if (f.language && f.language !== i18n.language) i18n.changeLanguage(f.language)
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      // A refusal by the organisation's policy arrives as a 403 carrying its own
      // sentence, which names the field. Swallowing it — what this form did
      // before — left somebody pressing Save forever on a field an administrator
      // had closed.
      const e2 = err as { message?: string; response?: { data?: { message?: string } } }
      toast.error(e2?.response?.data?.message ?? e2?.message ?? t('settings.profile_save_failed', { defaultValue: 'Enregistrement impossible' }))
    } finally { setBusy(false) }
  }

  const labelSelect = (
    <Dropdown width="100%" value={f.language} onChange={v => set('language', v)}
      options={PROFILE_LANGS.map(([value, label]) => ({ value, label }))} />
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="space-y-5">
        <Section title={t('settings.profile_sec_identity', { defaultValue: 'Identité et coordonnées' })}>
        <Field label={t('settings.profile_full_name', { defaultValue: 'Nom complet' })} vis={vis.fullName} onVis={setV('fullName')}>
          <Input value={f.fullName} onChange={e => set('fullName', e.target.value)} />
        </Field>

        <Field label={t('settings.profile_first_name', { defaultValue: 'Prénom' })} vis={vis.firstName} onVis={setV('firstName')}>
          <Input value={f.firstName} onChange={e => set('firstName', e.target.value)} maxLength={120} />
        </Field>

        <Field label={t('settings.profile_last_name', { defaultValue: 'Nom de famille' })} vis={vis.lastName} onVis={setV('lastName')}>
          <Input value={f.lastName} onChange={e => set('lastName', e.target.value)} maxLength={120} />
        </Field>

        <Field label={t('settings.profile_name_pronunciation', { defaultValue: 'Prononciation du nom' })}
          vis={vis.namePronunciation} onVis={setV('namePronunciation')}
          hint={t('settings.profile_name_pronunciation_hint', { defaultValue: 'Comment prononcer votre nom, écrit à votre façon.' })}>
          <Input value={f.namePronunciation} onChange={e => set('namePronunciation', e.target.value)}
            maxLength={120}
            placeholder={t('settings.profile_name_pronunciation_ph', { defaultValue: 'Par exemple : Ma-ri-nier' })} />
        </Field>

        <Field label={t('settings.profile_pronouns', { defaultValue: 'Pronoms' })} vis={vis.pronouns} onVis={setV('pronouns')}>
          <Input value={f.pronouns} onChange={e => set('pronouns', e.target.value)}
            maxLength={60}
            placeholder={t('settings.profile_pronouns_ph', { defaultValue: 'Vos pronoms. Par exemple : ils/elles' })} />
        </Field>

        <Field
          label={t('settings.profile_email', { defaultValue: 'E-mail' })}
          vis={vis.emails} onVis={setV('emails')}
          className="md:col-span-2"
          action={<button type="button" onClick={() => set('extraEmails', [...f.extraEmails, ''])}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus size={13} />{t('settings.profile_add', { defaultValue: 'Ajouter' })}</button>}
          hint={t('settings.profile_email_hint', { defaultValue: 'Adresse e-mail principale pour la réinitialisation du mot de passe et les notifications' })}
        >
          <div className="mb-2"><Input value={user?.email ?? ''} disabled /></div>
          {f.extraEmails.map((em, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Input type="email" value={em} placeholder="email@exemple.com"
                  onChange={e => set('extraEmails', f.extraEmails.map((x, j) => j === i ? e.target.value : x))} />
              </div>
              <button type="button" onClick={() => set('extraEmails', f.extraEmails.filter((_, j) => j !== i))}
                className="text-text-tertiary hover:text-danger shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
        </Field>

        <Field label={t('settings.profile_phone', { defaultValue: 'Numéro de téléphone' })} vis={vis.phone} onVis={setV('phone')}>
          <Input value={f.phone} onChange={e => set('phone', e.target.value)}
            placeholder={t('settings.profile_phone_ph', { defaultValue: 'Votre numéro de téléphone' })} />
        </Field>

        <Field label={t('settings.profile_location', { defaultValue: 'Localisation' })} vis={vis.location} onVis={setV('location')}>
          <Input value={f.location} onChange={e => set('location', e.target.value)}
            placeholder={t('settings.profile_location_ph', { defaultValue: 'Votre ville' })} />
        </Field>

        <Field label={t('settings.profile_work_location', { defaultValue: 'Lieu de travail' })}
          vis={vis.workLocation} onVis={setV('workLocation')}>
          <Input value={f.workLocation} onChange={e => set('workLocation', e.target.value)}
            maxLength={160}
            placeholder={t('settings.profile_work_location_ph', { defaultValue: 'Site, bâtiment, étage, ou « télétravail »' })} />
        </Field>

        </Section>

        {/* Personal data, kept in their own card rather than mixed into the
            contact details above: the sentence that says where these two go —
            and where they never go — has to be read before the boxes, not
            hunted for underneath one of sixteen fields. */}
        <Section title={t('settings.profile_sec_personal', { defaultValue: 'Données personnelles' })}>
        <div className="md:col-span-2 rounded-lg border border-border bg-surface-1 p-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('settings.profile_personal_note', { defaultValue: 'Ces deux champs sont facultatifs et vous pouvez les effacer à tout moment. Ils ne figurent jamais dans l’annuaire ni dans les sélecteurs de personnes des modules : ils ne se lisent que sur votre profil et sur votre fiche d’administration.' })}
        </div>

        <Field label={t('settings.profile_gender', { defaultValue: 'Genre' })} vis={vis.gender} onVis={setV('gender')}
          hint={t('settings.profile_gender_hint', { defaultValue: 'Texte libre : aucune liste ne vous est imposée. Laissez vide pour ne rien indiquer.' })}>
          <Input value={f.gender} onChange={e => set('gender', e.target.value)}
            maxLength={80}
            placeholder={t('settings.profile_gender_ph', { defaultValue: 'Comme vous souhaitez le formuler' })} />
        </Field>

        <Field label={t('settings.profile_birthday', { defaultValue: 'Date de naissance' })} vis={vis.birthday} onVis={setV('birthday')}
          hint={t('settings.profile_birthday_hint', { defaultValue: 'Saisissez votre date de naissance' })}>
          <Input type="date" value={f.birthday} onChange={e => set('birthday', e.target.value)} />
        </Field>
        </Section>

        <Section title={t('settings.profile_sec_region', { defaultValue: 'Langue et région' })}>
        <Field label={t('settings.profile_language', { defaultValue: 'Langue' })}
          hint={<a href="https://github.com/kubuno/kubuno" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('settings.profile_help_translate', { defaultValue: 'Aider à traduire' })}</a>}>
          {labelSelect}
        </Field>

        <Field label={t('settings.profile_locale', { defaultValue: 'Paramètres régionaux' })}
          hint={<><span className="flex items-center gap-1.5"><Clock size={12} />{localePreview}</span><span>{t('settings.profile_week_start', { defaultValue: 'Les semaines commencent le {{day}}', day: weekStartLabel })}</span></>}>
          <Dropdown width="100%" value={f.locale} onChange={v => set('locale', v)}
            options={[{ value: '', label: t('settings.profile_locale_auto', { defaultValue: 'Automatique' }) },
              ...PROFILE_LOCALES.map(([value, label]) => ({ value, label }))]} />
        </Field>

        <Field label={t('settings.profile_first_day', { defaultValue: 'Premier jour de la semaine' })}>
          <Dropdown width="100%" value={f.firstDayOfWeek} onChange={v => set('firstDayOfWeek', v)}
            options={[
              { value: 'auto', label: t('settings.profile_first_day_auto', { defaultValue: 'Issu de votre locale' }) },
              { value: '1', label: t('settings.profile_week_mon', { defaultValue: 'Lundi' }) },
              { value: '0', label: t('settings.profile_week_sun', { defaultValue: 'Dimanche' }) },
              { value: '6', label: t('settings.profile_week_sat', { defaultValue: 'Samedi' }) },
            ]} />
        </Field>

        <Field label={t('settings.profile_timezone', { defaultValue: 'Fuseau horaire' })}>
          <Dropdown width="100%" value={f.timezone} onChange={v => set('timezone', v)}
            options={[{ value: '', label: t('settings.profile_locale_auto', { defaultValue: 'Automatique' }) },
              ...tz.map(z => ({ value: z, label: z }))]} />
        </Field>

        </Section>

        <Section title={t('settings.profile_sec_social', { defaultValue: 'Réseaux, organisation et profil' })}>
        <Field label={t('settings.profile_website', { defaultValue: 'Site web' })} vis={vis.website} onVis={setV('website')}>
          <Input value={f.website} onChange={e => set('website', e.target.value)}
            placeholder={t('settings.profile_website_ph', { defaultValue: 'Votre site web' })} />
        </Field>

        <Field label={t('settings.profile_x', { defaultValue: 'X (anciennement Twitter)' })} vis={vis.x} onVis={setV('x')}>
          <Input value={f.x} onChange={e => set('x', e.target.value)}
            placeholder={t('settings.profile_x_ph', { defaultValue: 'Votre identifiant X (anciennement Twitter)' })} />
        </Field>

        <Field label="Bluesky" vis={vis.bluesky} onVis={setV('bluesky')}>
          <Input value={f.bluesky} onChange={e => set('bluesky', e.target.value)}
            placeholder={t('settings.profile_bluesky_ph', { defaultValue: 'Pseudo Bluesky' })} />
        </Field>

        <Field label={t('settings.profile_fediverse', { defaultValue: 'Fediverse (ex. Mastodon)' })} vis={vis.fediverse} onVis={setV('fediverse')}>
          <Input value={f.fediverse} onChange={e => set('fediverse', e.target.value)}
            placeholder={t('settings.profile_fediverse_ph', { defaultValue: 'Votre pseudo' })} />
        </Field>

        <Field label={t('settings.profile_organization', { defaultValue: 'Organisation' })} vis={vis.organization} onVis={setV('organization')}>
          <Input value={f.organization} onChange={e => set('organization', e.target.value)}
            placeholder={t('settings.profile_organization_ph', { defaultValue: 'Votre organisation' })} />
        </Field>

        <Field label={t('settings.profile_job', { defaultValue: 'Fonction' })} vis={vis.jobFunction} onVis={setV('jobFunction')}>
          <Input value={f.jobFunction} onChange={e => set('jobFunction', e.target.value)}
            placeholder={t('settings.profile_job_ph', { defaultValue: 'Votre fonction' })} />
        </Field>

        <Field label={t('settings.profile_title', { defaultValue: 'Titre' })} vis={vis.title} onVis={setV('title')}>
          <Input value={f.title} onChange={e => set('title', e.target.value)}
            placeholder={t('settings.profile_title_ph', { defaultValue: 'Votre titre' })} />
        </Field>

        <Field label={t('settings.profile_introduction', { defaultValue: 'Présentation' })}
          vis={vis.introduction} onVis={setV('introduction')} className="md:col-span-2"
          hint={t('settings.profile_introduction_hint', { defaultValue: '4 000 caractères au maximum.' })}>
          <Textarea value={f.introduction} onChange={e => set('introduction', e.target.value)} className="min-h-[150px]"
            maxLength={4000}
            placeholder={t('settings.profile_introduction_ph', { defaultValue: 'Quelques lignes sur vous. Le format Markdown est pris en charge.' })} />
        </Field>
        </Section>
      </div>

      <div className="mt-6">
        <Button type="submit" loading={busy}>
          {saved ? t('settings.profile_saved') : t('settings.save')}
        </Button>
      </div>
    </form>
  )
}
