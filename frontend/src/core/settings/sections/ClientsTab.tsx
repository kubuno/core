import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Copy, Check, Users, Monitor, Smartphone, Apple, Calendar as CalendarIcon, Folder, type LucideIcon } from 'lucide-react'
import { Input } from '@ui'
import { useModulesStore } from '../../store/modulesStore'
import { fallbackCopy } from '../clipboard'

// Placeholder download links — wired to real store pages later.
function StoreBadge({ href, Icon, top, bottom, sub }: {
  href: string; Icon: LucideIcon; top: string; bottom: string; sub?: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl bg-[#1f1f1f] hover:bg-black text-white px-5 py-2.5 transition-colors">
      <Icon size={26} className="shrink-0" />
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-75">{top}</span>
        <span className="text-lg font-semibold -mt-0.5">{bottom}</span>
        {sub && <span className="text-[10px] opacity-70 -mt-0.5">{sub}</span>}
      </span>
    </a>
  )
}

/** Download apps + connect external CalDAV/CardDAV/WebDAV clients. */
export function ClientsTab() {
  const { t } = useTranslation()
  const { activeModules } = useModulesStore()
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const [copied, setCopied] = useState(false)
  const serverUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const copy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(serverUrl).then(done).catch(() => fallbackCopy(serverUrl, done))
    else fallbackCopy(serverUrl, done)
  }

  // Connect-buttons only for installed modules that expose a sync protocol.
  const connectors = [
    { id: 'calendar', to: '/calendar/settings', Icon: CalendarIcon, label: t('settings.cli_connect_calendar', { defaultValue: 'Connectez votre agenda (CalDAV)' }) },
    { id: 'tasks',    to: '/tasks/settings',    Icon: Check,        label: t('settings.cli_connect_tasks', { defaultValue: 'Connectez vos tâches (CalDAV)' }) },
    { id: 'contacts', to: '/contacts/settings', Icon: Users,        label: t('settings.cli_connect_contacts', { defaultValue: 'Connectez vos contacts (CardDAV)' }) },
    { id: 'drive',    to: '/drive/settings',    Icon: Folder,       label: t('settings.cli_connect_webdav', { defaultValue: 'Accédez à vos fichiers via WebDAV' }) },
  ].filter(c => activeIds.has(c.id))

  return (
    <div className="max-w-3xl space-y-10">
      {/* Sync apps */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_apps_title', { defaultValue: 'Obtenez les applications pour synchroniser vos fichiers' })}</h2>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          {t('settings.cli_apps_desc', { defaultValue: 'Kubuno vous permet d’accéder à vos fichiers où que vous soyez. Nos clients de bureau et mobiles sont disponibles gratuitement pour les principales plateformes.' })}
        </p>
        <div className="flex flex-wrap gap-3">
          <StoreBadge href="#" Icon={Monitor}    top={t('settings.cli_download', { defaultValue: 'Télécharger' })} bottom={t('settings.cli_desktop', { defaultValue: 'Application bureau' })} sub="Windows · macOS · Linux" />
          <StoreBadge href="#" Icon={Smartphone} top={t('settings.cli_get_on', { defaultValue: 'Disponible sur' })} bottom="Google Play" />
          <StoreBadge href="#" Icon={Smartphone} top={t('settings.cli_get_on', { defaultValue: 'Disponible sur' })} bottom="F-Droid" />
          <StoreBadge href="#" Icon={Apple}      top={t('settings.cli_download_on', { defaultValue: 'Télécharger sur' })} bottom="App Store" />
        </div>
        <p className="text-xs text-text-tertiary mt-4 leading-relaxed">
          {t('settings.cli_apps_token', { defaultValue: 'Configurez les clients de synchronisation à l’aide d’un jeton d’application.' })}{' '}
          <Link to="/settings?tab=api-tokens" className="text-primary hover:underline">{t('settings.cli_apps_token_link', { defaultValue: 'Gérer les jetons' })}</Link>
        </p>
      </section>

      {/* Connect external apps via DAV protocols */}
      {connectors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_connect_title', { defaultValue: 'Connectez d’autres applications à Kubuno' })}</h2>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            {t('settings.cli_connect_desc', { defaultValue: 'En parallèle des applications, vous pouvez connecter tout logiciel prenant en charge les protocoles WebDAV / CalDAV / CardDAV à Kubuno.' })}
          </p>
          <div className="flex flex-wrap gap-3">
            {connectors.map(c => (
              <Link key={c.id} to={c.to}
                className="inline-flex items-center gap-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors">
                <c.Icon size={16} className="text-primary" /> {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Server address */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_server_title', { defaultValue: 'Adresse du serveur' })}</h2>
        <p className="text-sm text-text-secondary mb-3 leading-relaxed">
          {t('settings.cli_server_desc', { defaultValue: 'Utilisez ce lien pour connecter vos applications et votre client de bureau à ce serveur :' })}
        </p>
        <div className="flex items-center gap-2 max-w-md">
          <div className="flex-1"><Input readOnly value={serverUrl} /></div>
          <button type="button" onClick={copy} title={t('settings.cli_copy', { defaultValue: 'Copier' })}
            className="p-2.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2 transition-colors">
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>
      </section>
    </div>
  )
}
