/**
 * The parts of `CaptchaPreview.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { RefreshCw } from "lucide-react"
import type { CaptchaPreview } from './CaptchaPreview'

export function Part1({ c, t, setNonce, isFetching }: { c: NonNullable<CaptchaPreview['c']>; t: NonNullable<CaptchaPreview['tr']>; setNonce: NonNullable<CaptchaPreview['setNonce']>; isFetching: NonNullable<CaptchaPreview['isFetching']> }) {
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
