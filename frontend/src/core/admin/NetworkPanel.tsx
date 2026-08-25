import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, LockOpen, ShieldCheck, Upload, AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Callout, Card, Textarea, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { api } from '../api/client'
import { useConfirm } from '../hooks/useConfirm'
import SettingsGroupPanel from './settings/SettingsGroupPanel'

/**
 * Administration → System → Network: how the core is reached (HTTP/HTTPS).
 *
 * The toggles (enable HTTPS, ports, HSTS, minimum TLS version) are ordinary
 * `network.*` settings, rendered by the embedded `SettingsGroupPanel`. This
 * panel owns only what a setting cannot hold — the certificate material — plus
 * the live serving status the operator needs to read next to it.
 *
 * The core keeps terminating TLS with rustls; nothing here implements any part
 * of TLS. The private key goes IN in clear over the authenticated admin channel,
 * is stored encrypted, and never comes back OUT.
 */

interface StoredCert {
  id:         string
  source:     string
  subject:    string | null
  issuer:     string | null
  san:        string[]
  not_before: string | null
  not_after:  string | null
  is_active:  boolean
  created_at: string
}

interface NetworkData {
  config: {
    https_enabled:          boolean
    https_port:             number
    http_redirect_to_https: boolean
    http_redirect_port:     number
    tls_min_version:        string
    cert_mode:              string
    hsts: {
      enabled:            boolean
      max_age_days:       number
      include_subdomains: boolean
      preload:            boolean
    }
  }
  certificate: StoredCert | null
  certificates: StoredCert[]
  runtime: {
    https_live:       boolean
    file_override:    boolean
    restart_required: boolean
  }
  acme: {
    directory_url:      string
    email:             string
    domains:           string[]
    tos_agreed:        boolean
    last_order_status: string | null
    last_order_detail: string | null
    last_attempt_at:   string | null
  }
}

const errorOf = (e: unknown): string | undefined => {
  const any = e as { message?: string; response?: { data?: { message?: string; error?: string } } }
  return any?.message || any?.response?.data?.message || any?.response?.data?.error
}

/** Whole days from now until `iso`, negative once past. */
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.floor(ms / 86_400_000)
}

export default function NetworkPanel() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [certPem, setCertPem] = useState('')
  const [keyPem, setKeyPem] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'network'],
    queryFn: () => api.get<NetworkData>('/admin/network').then(r => r.data),
  })

  const upload = useMutation({
    mutationFn: () =>
      api
        .post<{ message: string }>('/admin/network/certificate', {
          cert_pem: certPem,
          key_pem: keyPem,
        })
        .then(r => r.data),
    onSuccess: res => {
      toast.success(res.message || t('admin.net_cert_installed', 'Certificat installé.'))
      setCertPem('')
      setKeyPem('')
      qc.invalidateQueries({ queryKey: ['admin', 'network'] })
    },
    onError: e =>
      toast.error(errorOf(e) || t('admin.net_cert_error', "Échec de l'installation du certificat")),
  })

  const requestAcme = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/admin/network/acme/request', {}).then(r => r.data),
    onSuccess: res => {
      toast.success(res.message || t('admin.net_acme_ok', 'Certificat obtenu.'))
      qc.invalidateQueries({ queryKey: ['admin', 'network'] })
    },
    onError: e =>
      toast.error(errorOf(e) || t('admin.net_acme_error', "Échec de l'obtention du certificat")),
  })

  const removeCert = useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(`/admin/network/certificate/${id}`).then(r => r.data),
    onSuccess: res => {
      toast.success(res.message || t('admin.net_cert_deleted', 'Certificat supprimé.'))
      qc.invalidateQueries({ queryKey: ['admin', 'network'] })
    },
    onError: e =>
      toast.error(errorOf(e) || t('admin.net_cert_delete_error', 'Suppression impossible')),
  })

  const askDelete = async (c: StoredCert) => {
    const ok = await confirm({
      title: t('admin.net_cert_delete_title', 'Supprimer ce certificat'),
      message: c.is_active
        ? t(
            'admin.net_cert_delete_active_msg',
            'Ce certificat est celui que sert le HTTPS. Sa suppression est refusée tant que le HTTPS est activé.',
          )
        : t('admin.net_cert_delete_msg', 'Supprimer « {{s}} » de l’historique ? Cette action est irréversible.', {
            s: c.subject || c.id,
          }),
      confirmLabel: t('common.delete', 'Supprimer'),
      variant: 'danger',
    })
    if (ok) removeCert.mutate(c.id)
  }

  const cert = data?.certificate ?? null
  const history = (data?.certificates ?? []).filter(c => !c.is_active)
  const acme = data?.acme
  const acmeMode = data?.config.cert_mode === 'acme'
  const runtime = data?.runtime
  const expiresIn = cert?.not_after ? daysUntil(cert.not_after) : null

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
          <ShieldCheck className="h-6 w-6 text-primary" />
          {t('admin.nav_network', 'Réseau (HTTP / HTTPS)')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t(
            'admin.net_intro',
            "Terminaison HTTP/HTTPS du core. Le TLS est assuré par rustls ; installez ici le certificat et réglez le comportement ci-dessous.",
          )}
        </p>
      </header>

      {/* ── Live status ─────────────────────────────────────────────────── */}
      {runtime?.file_override && (
        <Callout variant="info" title={t('admin.net_file_override_title', 'HTTPS géré par fichier')}>
          {t(
            'admin.net_file_override_body',
            "La section [server.tls] de config.toml est active : elle a la priorité sur ce panneau. Les réglages ci-dessous restent enregistrés mais ne sont pas appliqués tant que le fichier impose sa configuration.",
          )}
        </Callout>
      )}

      {runtime?.restart_required && (
        <Callout variant="warning" title={t('admin.net_restart_title', 'Redémarrage requis')}>
          {t(
            'admin.net_restart_body',
            "L'activation, la désactivation ou le changement de port du HTTPS lie ou délie une socket : le service doit être redémarré pour appliquer ce changement. Le port HTTP continue d'être servi en parallèle du HTTPS — un mandataire inverse ou une sonde qui l'utilise n'est pas coupé.",
          )}
        </Callout>
      )}

      <Card className="p-5">
        <div className="flex items-center gap-3">
          {runtime?.https_live ? (
            <Lock className="h-5 w-5 text-success" />
          ) : (
            <LockOpen className="h-5 w-5 text-text-tertiary" />
          )}
          <div>
            <div className="font-medium text-text-primary">
              {runtime?.https_live
                ? t('admin.net_https_live', 'HTTPS actif (le core sert en TLS)')
                : t('admin.net_https_off', 'HTTPS inactif (le core sert en HTTP nu)')}
            </div>
            <div className="text-sm text-text-secondary">
              {isLoading
                ? t('common.loading', 'Chargement…')
                : t('admin.net_min_tls', 'TLS minimum : {{v}}', { v: data?.config.tls_min_version })}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Certificate ─────────────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {t('admin.net_cert_title', 'Certificat TLS')}
        </h2>

        {cert ? (
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-text-secondary">{t('admin.net_cert_subject', 'Sujet')} : </span>
              <span className="font-medium text-text-primary">{cert.subject || '—'}</span>
            </div>
            {cert.san.length > 0 && (
              <div>
                <span className="text-text-secondary">{t('admin.net_cert_san', 'Domaines')} : </span>
                <span className="text-text-primary">{cert.san.join(', ')}</span>
              </div>
            )}
            <div>
              <span className="text-text-secondary">{t('admin.net_cert_issuer', 'Émetteur')} : </span>
              <span className="text-text-primary">{cert.issuer || '—'}</span>
            </div>
            {cert.not_after && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-secondary">{t('admin.net_cert_expires', 'Expire le')} : </span>
                <span className="text-text-primary">
                  {new Date(cert.not_after).toLocaleDateString(i18n.language)}
                </span>
                {expiresIn !== null && (
                  <span
                    className={
                      expiresIn < 0
                        ? 'text-danger'
                        : expiresIn < 30
                          ? 'text-warning'
                          : 'text-text-tertiary'
                    }
                  >
                    {expiresIn < 0
                      ? t('admin.net_cert_expired', '(expiré)')
                      : t('admin.net_cert_in_days', '(dans {{n}} j)', { n: expiresIn })}
                  </span>
                )}
              </div>
            )}
            <div className="text-text-tertiary">
              {t('admin.net_cert_source', 'Source')} :{' '}
              {cert.source === 'acme'
                ? t('admin.net_cert_source_acme', 'ACME (automatique)')
                : t('admin.net_cert_source_upload', 'importé')}
            </div>
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={() => askDelete(cert)}>
                <Trash2 className="h-4 w-4" />
                {t('admin.net_cert_delete', 'Supprimer ce certificat')}
              </Button>
            </div>
          </div>
        ) : (
          <Callout variant="info" icon={<AlertTriangle className="h-5 w-5" />}>
            {t('admin.net_cert_none', 'Aucun certificat installé. Importez-en un ci-dessous pour pouvoir activer le HTTPS.')}
          </Callout>
        )}

        <div className="space-y-3 border-t border-border pt-4">
          <div className="text-sm font-medium text-text-primary">
            {t('admin.net_cert_upload', 'Importer un certificat')}
          </div>
          <Textarea
            label={t('admin.net_cert_chain', 'Certificat (chaîne PEM : feuille + intermédiaires)')}
            value={certPem}
            onChange={e => setCertPem(e.target.value)}
            placeholder={'-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----'}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <Textarea
            label={t('admin.net_cert_key', 'Clé privée (PEM, non chiffrée)')}
            value={keyPem}
            onChange={e => setKeyPem(e.target.value)}
            placeholder={'-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <p className="text-xs text-text-tertiary">
            {t(
              'admin.net_cert_key_note',
              'La clé privée est chiffrée avant stockage et n’est jamais renvoyée par l’interface. Le remplacement d’un certificat est appliqué à chaud si le HTTPS est déjà actif.',
            )}
          </p>
          <Button
            variant="primary"
            onClick={() => upload.mutate()}
            disabled={upload.isPending || !certPem.trim() || !keyPem.trim()}
          >
            <Upload className="h-4 w-4" />
            {upload.isPending
              ? t('admin.net_cert_installing', 'Installation…')
              : t('admin.net_cert_install', 'Installer le certificat')}
          </Button>
        </div>
      </Card>

      {/* ── ACME (automatic certificates) ───────────────────────────────── */}
      {acmeMode && (
        <Card className="p-5 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('admin.net_acme_title', 'Certificat automatique (ACME / Let’s Encrypt)')}
          </h2>
          <p className="text-sm text-text-secondary">
            {t(
              'admin.net_acme_intro',
              "L'autorité vérifie chaque domaine en récupérant « http://<domaine>/.well-known/acme-challenge/… » servi par le core : chaque domaine doit pointer vers cette instance et être joignable en HTTP (port 80). Renseignez le répertoire, l'adresse de contact, les domaines et acceptez les conditions dans les réglages ci-dessous. Le renouvellement est ensuite automatique (30 jours avant l'expiration).",
            )}
          </p>

          {acme && (
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-text-secondary">{t('admin.net_acme_domains', 'Domaines')} : </span>
                <span className="text-text-primary">
                  {acme.domains.length > 0 ? acme.domains.join(', ') : '—'}
                </span>
              </div>
              {acme.last_order_status && (
                <div className="flex items-start gap-1.5">
                  <span className="text-text-secondary">{t('admin.net_acme_last', 'Dernière tentative')} : </span>
                  <span
                    className={
                      acme.last_order_status === 'ok'
                        ? 'text-success'
                        : acme.last_order_status === 'error'
                          ? 'text-danger'
                          : 'text-text-tertiary'
                    }
                  >
                    {acme.last_order_status === 'ok'
                      ? t('admin.net_acme_ok_short', 'Réussie')
                      : acme.last_order_status === 'error'
                        ? t('admin.net_acme_err_short', 'Échec')
                        : t('admin.net_acme_pending', 'En cours')}
                  </span>
                  {acme.last_attempt_at && (
                    <span className="text-text-tertiary">
                      · {new Date(acme.last_attempt_at).toLocaleString(i18n.language)}
                    </span>
                  )}
                </div>
              )}
              {acme.last_order_detail && (
                <div className="text-text-tertiary break-words">{acme.last_order_detail}</div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => requestAcme.mutate()}
            disabled={requestAcme.isPending}
          >
            <ShieldCheck className="h-4 w-4" />
            {requestAcme.isPending
              ? t('admin.net_acme_requesting', 'Obtention en cours…')
              : t('admin.net_acme_request', 'Obtenir / renouveler maintenant')}
          </Button>
        </Card>
      )}

      {/* ── History (retired certificates) ──────────────────────────────── */}
      {history.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('admin.net_cert_history', 'Certificats précédents')}
          </h2>
          <p className="text-sm text-text-secondary">
            {t(
              'admin.net_cert_history_desc',
              'Conservés pour mémoire uniquement : leur clé privée a été détruite au moment de leur remplacement.',
            )}
          </p>
          <ul className="divide-y divide-border">
            {history.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-text-primary">{c.subject || c.id}</div>
                  <div className="text-text-tertiary">
                    {c.not_after
                      ? t('admin.net_cert_expired_on', 'Expirait le {{d}}', {
                          d: new Date(c.not_after).toLocaleDateString(i18n.language),
                        })
                      : '—'}
                    {' · '}
                    {c.source === 'acme'
                      ? t('admin.net_cert_source_acme', 'ACME (automatique)')
                      : t('admin.net_cert_source_upload', 'importé')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => askDelete(c)}
                  disabled={removeCert.isPending}
                  aria-label={t('common.delete', 'Supprimer')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Settings (generic, scoped) ──────────────────────────────────── */}
      <SettingsGroupPanel tab="network" />

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
