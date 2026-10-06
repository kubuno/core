/**
 * The parts of `TwoFactorSection.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ComponentType } from "react"
import * as ReactQRCode from "react-qr-code"
import { Input } from "@ui"
import type { TwoFactorSection } from './TwoFactorSection'
type QRCodeProps = { value: string; size?: number; bgColor?: string; fgColor?: string }

function isReactComponent(x: unknown): x is ComponentType<QRCodeProps> {
  return typeof x === 'function' || (typeof x === 'object' && x !== null && '$$typeof' in x)
}

function resolveQRCode(mod: unknown): ComponentType<QRCodeProps> {
  let cur = mod
  for (let i = 0; cur && i < 5; i++) {
    if (isReactComponent(cur)) return cur
    const obj = cur as { QRCode?: unknown; default?: unknown }
    if (isReactComponent(obj.QRCode)) return obj.QRCode
    if (isReactComponent(obj.default)) return obj.default
    cur = obj.default
  }
  return mod as ComponentType<QRCodeProps>
}

const QRCode = resolveQRCode(ReactQRCode)

export function Part1({ disableCode, setDisableCode, t }: { disableCode: NonNullable<TwoFactorSection['disableCode']>; setDisableCode: NonNullable<TwoFactorSection['setDisableCode']>; t: NonNullable<TwoFactorSection['tr']> }) {
  return (
    <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  placeholder={t('settings.tfa_code_ph')}
                  className="tracking-widest text-center"
                />
  )
}

export function Part2({ uri }: { uri: NonNullable<TwoFactorSection['uri']> }) {
  return (
    <QRCode value={uri} size={180} />
  )
}

export function Part3({ t, secret }: { t: NonNullable<TwoFactorSection['tr']>; secret: NonNullable<TwoFactorSection['secret']> }) {
  return (
    <details className="text-xs">
                <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
                  {t('settings.tfa_manual')}
                </summary>
                <code className="block mt-2 px-3 py-2 bg-surface-2 rounded border border-border break-all font-mono text-text-primary select-all">
                  {secret}
                </code>
              </details>
  )
}

export function Part4({ code, setCode, t }: { code: NonNullable<TwoFactorSection['code']>; setCode: NonNullable<TwoFactorSection['setCode']>; t: NonNullable<TwoFactorSection['tr']> }) {
  return (
    <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  placeholder={t('settings.tfa_code_ph')}
                  className="tracking-widest text-center"
                />
  )
}
