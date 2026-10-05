/**
 * The parts of `BackupCodesPanel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Check, Copy, Download, Printer } from "lucide-react"
import { Button, Callout, Card } from "@ui"
import type { BackupCodesPanel } from './BackupCodesPanel'

export function Part1({ t, codes, copied, copy, print, download, onDone }: { t: NonNullable<BackupCodesPanel['tr']>; codes: NonNullable<BackupCodesPanel['props']['codes']>; copied: NonNullable<BackupCodesPanel['copied']>; copy: BackupCodesPanel['copy']; print: BackupCodesPanel['print']; download: BackupCodesPanel['download']; onDone: NonNullable<BackupCodesPanel['props']['onDone']> }) {
  return (
    <Card bodyClassName="space-y-4">
          <Callout variant="warning" title={t('settings.bc_once_title')} t={t}>
            {t('settings.bc_once_desc')}
          </Callout>
    
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm text-text-primary select-all">
            {codes.map((code) => (
              <li key={code} className="tracking-wider">{code}</li>
            ))}
          </ol>
    
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={copy}
            >
              {copied ? t('settings.bc_copied') : t('settings.bc_copy')}
            </Button>
            <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={print}>
              {t('settings.bc_print')}
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={download}>
              {t('settings.bc_download')}
            </Button>
            {onDone && (
              <Button size="sm" onClick={onDone}>
                {t('settings.bc_done')}
              </Button>
            )}
          </div>
        </Card>
  )
}
