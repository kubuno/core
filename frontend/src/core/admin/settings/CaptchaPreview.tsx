import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { authApi, type CaptchaChallenge } from '../../api/auth'

/**
 * A live example of the sign-in CAPTCHA, shown right under the type selector.
 *
 * ## Why it is here
 *
 * An administrator picks a test type and tunes its difficulty (code length,
 * distortion, noise, slider tolerance, arithmetic range) blind: the numbers say
 * "distortion 80" but nobody can tell from the number whether the result is
 * still legible. Reaching the real thing means failing a sign-in five times.
 * This draws the actual challenge, from the same public endpoint the login form
 * uses (`GET /auth/captcha`, which always issues one of the CONFIGURED type), so
 * the operator sees what a person will face.
 *
 * ## What it does NOT do
 *
 * It shows the challenge; it does not grade it. The answer lives on the server
 * and is spent by a real sign-in, so there is nothing to verify against here —
 * the value is seeing the challenge, not solving it. « Régénérer » asks for a
 * fresh one, which is also how a just-SAVED tuning change is seen (the numbers
 * are buffered in the form until saved, so the preview reflects the saved
 * configuration, not an unsaved edit).
 */
export default function CaptchaPreview() {
  const { t } = useTranslation()
  const [nonce, setNonce] = useState(0)

  const { data, isFetching } = useQuery({
    // No setting value in the key: the endpoint reads the SAVED configuration,
    // so the preview is refreshed by the panel invalidating this query once a
    // save has actually landed (see `afterWrite`) — not on the optimistic edit,
    // which would race the write and fetch the previous type. `nonce` is the
    // manual "regenerate".
    queryKey: ['captcha-preview', nonce] as const,
    queryFn:  () => authApi.getCaptcha().then(r => r.data),
    staleTime: 0,
    gcTime:    0,
  })
  const c: CaptchaChallenge | undefined = data

  return (
    <div data-captcha-preview={c?.type ?? 'loading'} className="mt-2 rounded-lg border border-border bg-surface-1 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.captcha_preview_title', { defaultValue: 'Aperçu — exemple généré par le serveur' })}
        </span>
        <button
          type="button"
          onClick={() => setNonce(n => n + 1)}
          disabled={isFetching}
          aria-label={t('admin.captcha_preview_regen', { defaultValue: 'Régénérer un exemple' })}
          title={t('admin.captcha_preview_regen', { defaultValue: 'Régénérer un exemple' })}
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary
                     transition-colors hover:bg-surface-2 hover:text-text-secondary disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* The example, drawn exactly as the sign-in form draws it. */}
      {!c ? (
        <div className="py-4 text-center text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('common.loading')}
        </div>
      ) : c.type === 'text' ? (
        <img
          src={c.image}
          alt={t('admin.captcha_preview_title', { defaultValue: 'Aperçu' })}
          width={180}
          height={60}
          className="block rounded-md"
          style={{ border: '1px solid var(--color-border)', background: '#f1f3f4' }}
        />
      ) : c.type === 'math' ? (
        <div
          className="inline-flex items-center gap-2 rounded-md bg-surface-0 px-4 py-2"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <span className="select-none whitespace-nowrap text-lg font-medium text-text-primary">
            {c.prompt} = <span className="text-text-tertiary">?</span>
          </span>
        </div>
      ) : (
        <div>
          {/* Slider: the composed puzzle with the piece at its start position —
              a person drags it into the gap. Static here (a preview, not a solve). */}
          <div
            className="relative select-none overflow-hidden rounded-md"
            style={{ width: c.width, height: c.height, border: '1px solid var(--color-border)' }}
          >
            <img src={c.background} alt="" width={c.width} height={c.height} draggable={false} />
            <img
              src={c.piece}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                top: c.piece_y,
                left: 0,
                width: c.piece_width,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
              }}
            />
          </div>
          <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {t('admin.captcha_preview_slider_hint', {
              defaultValue: 'À la connexion, la pièce se glisse dans l’encoche.',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
